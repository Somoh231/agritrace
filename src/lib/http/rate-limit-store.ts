/**
 * Rate-limit store abstraction — in-memory (dev/single-node) or Upstash/Vercel KV (production).
 *
 * Fail-open: if Redis is configured but unreachable, requests are allowed and a warning is logged.
 * Documented in docs/OBSERVABILITY.md — tighten to fail-closed for auth routes if policy requires.
 */

import { logApiFailure } from "@/lib/http/structured-log";
import type { RateLimitPolicy, RateLimitResult } from "@/lib/http/rate-limit";

export type RateLimitStoreKind = "memory" | "redis";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function pruneMemory(now: number): void {
  if (memoryStore.size <= MAX_KEYS) return;
  for (const [key, bucket] of memoryStore) {
    if (now >= bucket.resetAt) memoryStore.delete(key);
    if (memoryStore.size <= MAX_KEYS * 0.8) break;
  }
}

/** Counter key: the policy's namespace plus the caller identity (user or IP). */
export function scopedRateLimitKey(policy: RateLimitPolicy, identity: string): string {
  return `${policy.name}:${identity}`;
}

function memoryCheck(identity: string, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now();
  pruneMemory(now);
  const key = scopedRateLimitKey(policy, identity);
  let bucket = memoryStore.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + policy.windowMs };
    memoryStore.set(key, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= policy.max,
    limit: policy.max,
    remaining: Math.max(0, policy.max - bucket.count),
    resetAt: bucket.resetAt,
  };
}

function redisRestConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)?.trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const cfg = redisRestConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis REST ${res.status}`);
  const json = (await res.json()) as { result?: unknown };
  return json.result;
}

async function redisCheck(identity: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const namespaced = `agrivault:rl:${scopedRateLimitKey(policy, identity)}`;
  const windowSec = Math.max(1, Math.ceil(policy.windowMs / 1000));
  const now = Date.now();
  const resetAt = now + policy.windowMs;

  const count = Number(await redisCommand(["INCR", namespaced]));
  if (count === 1) {
    await redisCommand(["EXPIRE", namespaced, windowSec]);
  }
  const ttl = Number(await redisCommand(["TTL", namespaced]));
  const effectiveReset =
    ttl > 0 ? now + ttl * 1000 : resetAt;

  return {
    allowed: count <= policy.max,
    limit: policy.max,
    remaining: Math.max(0, policy.max - count),
    resetAt: effectiveReset,
  };
}

export function activeRateLimitStoreKind(): RateLimitStoreKind {
  return redisRestConfig() ? "redis" : "memory";
}

/** Enforce rate limit using Redis when configured, otherwise in-process memory. */
export async function checkRateLimitDistributed(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  if (redisRestConfig()) {
    try {
      return await redisCheck(key, policy);
    } catch (err) {
      logApiFailure("rate-limit.redis", err);
      return memoryCheck(key, policy);
    }
  }
  return memoryCheck(key, policy);
}

/** Synchronous memory-only check — used in unit tests and legacy callers. */
export function checkRateLimitMemory(key: string, policy: RateLimitPolicy): RateLimitResult {
  return memoryCheck(key, policy);
}
