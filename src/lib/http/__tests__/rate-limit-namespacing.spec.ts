/**
 * Rate-limit namespacing: each endpoint family has its own budget.
 * Run with: npm run test:ratelimit
 */

import assert from "node:assert/strict";

import { apiTooManyRequests, beginApiRequest, beginApiRequestAsync } from "@/lib/http/api-response";
import * as policies from "@/lib/http/rate-limit-policies";
import {
  ADMIN_MUTATION_POLICY,
  ADMIN_READ_POLICY,
  AI_CHAT_POLICY,
  ANALYTICS_POLICY,
  PUBLIC_POLICY,
  READ_POLICY,
  WORKFLOW_MUTATION_POLICY,
} from "@/lib/http/rate-limit-policies";
import type { RateLimitPolicy } from "@/lib/http/rate-limit";
import { scopedRateLimitKey } from "@/lib/http/rate-limit-store";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const run = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const req = (ip: string) => new Request("https://agrivaultdata.com/api/x", { headers: { "x-forwarded-for": ip } });
const hit = (policy: RateLimitPolicy, user: string | null, ip = `10.0.0.1-${run}`) => beginApiRequest(req(ip), policy, user ? `${user}-${run}` : null);
const spend = (policy: RateLimitPolicy, n: number, user: string | null, ip?: string) => {
  let last = hit(policy, user, ip);
  for (let i = 1; i < n; i++) last = hit(policy, user, ip);
  return last;
};

(async () => {
  console.log("rate limits — budgets are independent");

  await check("every policy has a distinct namespace", () => {
    const names = Object.values(policies).map((p) => (p as RateLimitPolicy).name);
    assert.equal(new Set(names).size, names.length, names.join(","));
  });

  await check("100 analytics calls do not cause AI chat to 429 (same user, same IP)", () => {
    const last = spend(ANALYTICS_POLICY, 100, "u-browse");
    assert.equal(last.rateLimit.allowed, true);
    assert.equal(hit(AI_CHAT_POLICY, "u-browse").rateLimit.allowed, true);
  });

  await check("analytics beyond its own budget is limited, and still does not touch AI chat", () => {
    const over = spend(ANALYTICS_POLICY, ANALYTICS_POLICY.max + 1, "u-heavy");
    assert.equal(over.rateLimit.allowed, false);
    assert.equal(hit(AI_CHAT_POLICY, "u-heavy").rateLimit.allowed, true);
  });

  await check("exhausting AI chat does not block analytics", () => {
    const exhausted = spend(AI_CHAT_POLICY, AI_CHAT_POLICY.max + 1, "u-ai");
    assert.equal(exhausted.rateLimit.allowed, false);
    assert.equal(hit(ANALYTICS_POLICY, "u-ai").rateLimit.allowed, true);
  });

  await check("one user exhausting AI chat does not block another user on the same IP", () => {
    const sharedIp = `10.9.9.9-${run}`;
    assert.equal(spend(AI_CHAT_POLICY, AI_CHAT_POLICY.max + 1, "u-a", sharedIp).rateLimit.allowed, false);
    assert.equal(hit(AI_CHAT_POLICY, "u-b", sharedIp).rateLimit.allowed, true);
  });

  await check("anonymous callers are still limited per IP, and other IPs are unaffected", () => {
    const ip = `203.0.113.7-${run}`;
    const last = spend(PUBLIC_POLICY, PUBLIC_POLICY.max + 1, null, ip);
    assert.equal(last.rateLimit.allowed, false);
    assert.equal(hit(PUBLIC_POLICY, null, `203.0.113.8-${run}`).rateLimit.allowed, true);
  });

  await check("admin budgets are independent of analytics, AI, reads and workflow writes — and of each other", () => {
    for (const p of [ANALYTICS_POLICY, AI_CHAT_POLICY, READ_POLICY, WORKFLOW_MUTATION_POLICY]) spend(p, p.max + 1, "u-admin");
    assert.equal(hit(ADMIN_READ_POLICY, "u-admin").rateLimit.allowed, true);
    assert.equal(hit(ADMIN_MUTATION_POLICY, "u-admin").rateLimit.allowed, true);
    assert.equal(spend(ADMIN_MUTATION_POLICY, ADMIN_MUTATION_POLICY.max + 1, "u-admin").rateLimit.allowed, false);
    assert.equal(hit(ADMIN_READ_POLICY, "u-admin").rateLimit.allowed, true);
  });

  await check("limits were not raised to hide the problem", () => {
    assert.deepEqual(
      [AI_CHAT_POLICY.max, ANALYTICS_POLICY.max, READ_POLICY.max, ADMIN_MUTATION_POLICY.max, PUBLIC_POLICY.max, WORKFLOW_MUTATION_POLICY.max],
      [20, 120, 120, 40, 10, 60],
    );
  });

  console.log("rate limits — 429 responses stay clear");

  await check("429 carries the message, Retry-After and which budget was exceeded", async () => {
    const ctx = spend(AI_CHAT_POLICY, AI_CHAT_POLICY.max + 1, "u-429");
    const res = apiTooManyRequests(ctx);
    assert.equal(res.status, 429);
    const body = await res.json();
    assert.equal(body.error, "Too many requests. Please retry shortly.");
    assert.ok(Number(res.headers.get("Retry-After")) >= 1);
    assert.equal(res.headers.get("X-RateLimit-Scope"), "ai-chat");
    assert.equal(res.headers.get("X-RateLimit-Limit"), String(AI_CHAT_POLICY.max));
    assert.equal(res.headers.get("X-RateLimit-Remaining"), "0");
  });

  console.log("rate limits — distributed store keys");

  await check("keys are <namespace>:<identity>", () => {
    assert.equal(scopedRateLimitKey(AI_CHAT_POLICY, "user:abc"), "ai-chat:user:abc");
    assert.equal(scopedRateLimitKey(ANALYTICS_POLICY, "ip:1.2.3.4"), "analytics:ip:1.2.3.4");
  });

  await check("the Redis/KV path uses namespaced keys", async () => {
    const commands: unknown[][] = [];
    const realFetch = globalThis.fetch;
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    globalThis.fetch = (async (_url: string, init: { body: string }) => {
      const cmd = JSON.parse(init.body) as unknown[];
      commands.push(cmd);
      const result = cmd[0] === "INCR" ? 1 : cmd[0] === "TTL" ? 60 : "OK";
      return new Response(JSON.stringify({ result }), { status: 200 });
    }) as unknown as typeof fetch;
    try {
      await beginApiRequestAsync(req("10.1.1.1"), AI_CHAT_POLICY, "redis-user");
      await beginApiRequestAsync(req("10.1.1.1"), ANALYTICS_POLICY, null);
    } finally {
      globalThis.fetch = realFetch;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
    const incrKeys = commands.filter((c) => c[0] === "INCR").map((c) => c[1]);
    assert.deepEqual(incrKeys, ["agrivault:rl:ai-chat:user:redis-user", "agrivault:rl:analytics:ip:10.1.1.1"]);
  });

  console.log(`\n${passed} checks passed`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
