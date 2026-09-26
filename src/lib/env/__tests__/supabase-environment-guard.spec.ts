/**
 * Supabase environment guard checks (fake refs and keys only).
 * Run with: npm run test:env
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import { appEnvironment } from "@/lib/env/app-env";
import { checkSupabaseEnvironment, projectRefFromKey, projectRefFromUrl } from "@/lib/env/supabase-environment-guard.mjs";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const PROD = "prodprodprodprodprod";
const STAGING = "stagstagstagstagstag";
const url = (ref: string) => `https://${ref}.supabase.co`;
const key = (ref: string, role = "anon") =>
  ["e30", Buffer.from(JSON.stringify({ iss: "supabase", ref, role })).toString("base64url"), "sig"].join(".");

const staging = { appEnv: "staging", supabaseUrl: url(STAGING), anonKey: key(STAGING), serviceRoleKey: key(STAGING, "service_role"), productionRef: PROD };
const production = { appEnv: "production", supabaseUrl: url(PROD), anonKey: key(PROD), serviceRoleKey: key(PROD, "service_role"), productionRef: PROD, stagingRef: STAGING };

console.log("guard — Vercel Preview");
check("preview pointed at production is rejected", () => {
  const r = checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", supabaseUrl: url(PROD), anonKey: key(PROD), serviceRoleKey: key(PROD, "service_role") });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("PRODUCTION Supabase project")));
});
check("preview on staging passes", () => {
  assert.equal(checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", stagingRef: STAGING }).ok, true);
});
check("preview without SUPABASE_PRODUCTION_PROJECT_REF is rejected (cannot be verified)", () => {
  assert.equal(checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", productionRef: "" }).ok, false);
});
check('preview without NEXT_PUBLIC_APP_ENV="staging" is rejected', () => {
  assert.equal(checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", appEnv: "" }).ok, false);
  assert.equal(checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", appEnv: "production" }).ok, false);
});
check("preview on a third, non-staging project is rejected when the staging ref is known", () => {
  assert.equal(checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", stagingRef: STAGING, supabaseUrl: url("otherotherotherother"), anonKey: undefined, serviceRoleKey: undefined }).ok, false);
});
check("preview with a staging URL but a production service key is rejected", () => {
  const r = checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", serviceRoleKey: key(PROD, "service_role") });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.startsWith("SUPABASE_SERVICE_ROLE_KEY")));
});

console.log("guard — Vercel Production");
check("production on production passes", () => {
  assert.equal(checkSupabaseEnvironment({ ...production, vercelEnv: "production" }).ok, true);
  assert.equal(checkSupabaseEnvironment({ ...production, vercelEnv: "production", appEnv: "" }).ok, true);
});
check("production pointed at staging is rejected", () => {
  const r = checkSupabaseEnvironment({ ...production, vercelEnv: "production", supabaseUrl: url(STAGING), anonKey: key(STAGING), serviceRoleKey: key(STAGING, "service_role") });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("STAGING Supabase project")));
});
check('production labelled "staging" is rejected (the indicator can never reach production)', () => {
  assert.equal(checkSupabaseEnvironment({ ...production, vercelEnv: "production", appEnv: "staging" }).ok, false);
});
check("production without SUPABASE_PRODUCTION_PROJECT_REF is rejected", () => {
  assert.equal(checkSupabaseEnvironment({ ...production, vercelEnv: "production", productionRef: "" }).ok, false);
});

console.log("guard — local");
check("local staging mode rejects production credentials", () => {
  assert.equal(checkSupabaseEnvironment({ ...staging, supabaseUrl: url(PROD), anonKey: key(PROD) }).ok, false);
  assert.equal(checkSupabaseEnvironment({ ...staging }).ok, true);
});
check("local development without a staging label is unconstrained (current behaviour)", () => {
  const r = checkSupabaseEnvironment({ supabaseUrl: url(PROD), anonKey: key(PROD) });
  assert.equal(r.ok, true);
  assert.equal(r.target, "unconstrained");
});
check("an unknown NEXT_PUBLIC_APP_ENV value is rejected", () => {
  assert.equal(checkSupabaseEnvironment({ appEnv: "prod" }).ok, false);
});

console.log("guard — no secrets in messages");
check("errors never contain project refs, URLs or keys", () => {
  const r = checkSupabaseEnvironment({ ...staging, vercelEnv: "preview", supabaseUrl: url(PROD), serviceRoleKey: key(PROD, "service_role") });
  for (const e of r.errors) {
    assert.ok(!e.includes(PROD) && !e.includes(STAGING) && !e.includes("supabase.co") && !e.includes("eyJ") && !e.includes("e30."), e);
  }
});
check("ref parsing: URL and legacy JWT keys", () => {
  assert.equal(projectRefFromUrl(url(PROD)), PROD);
  assert.equal(projectRefFromKey(key(STAGING)), STAGING);
  assert.equal(projectRefFromKey("sb_publishable_abc"), null);
});

console.log("app environment label");
check("label comes from NEXT_PUBLIC_APP_ENV, else Vercel, else development", () => {
  assert.equal(appEnvironment({ NEXT_PUBLIC_APP_ENV: "staging" }), "staging");
  assert.equal(appEnvironment({ VERCEL_ENV: "production" }), "production");
  assert.equal(appEnvironment({ VERCEL_ENV: "preview" }), "staging");
  assert.equal(appEnvironment({}), "development");
});

console.log("next.config.mjs refuses to load when misconfigured");
const loadConfig = (env: Record<string, string>) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", "await import('./next.config.mjs')"], {
    env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", NODE_ENV: "production", ...env },
    encoding: "utf8",
  });
check("Vercel Preview + production project → config load fails", () => {
  const r = loadConfig({ VERCEL_ENV: "preview", NEXT_PUBLIC_APP_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: url(PROD), SUPABASE_PRODUCTION_PROJECT_REF: PROD });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /supabase-environment-guard/);
});
check("Vercel Preview + staging project → config loads", () => {
  const r = loadConfig({ VERCEL_ENV: "preview", NEXT_PUBLIC_APP_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: url(STAGING), SUPABASE_PRODUCTION_PROJECT_REF: PROD });
  assert.equal(r.status, 0, r.stderr);
});

console.log(`\n${passed} checks passed`);
