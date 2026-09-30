/**
 * Read-only stakeholder preview: request policy, operational persona and the
 * staging-only account-management guard.
 * Run with: npm run test:auth
 */

import assert from "node:assert/strict";

import { isPreviewReadOnly, isSafeMethod, previewRequestAllowed, READ_ONLY_ALLOWED_WRITE_PATHS } from "@/lib/auth/preview-read-only";
import { resolveOperationalActor } from "@/lib/ops/current-actor";
import { getAllowedActions } from "@/lib/ops/permissions";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs ops module
import { checkPreviewAccountTarget, maskEmail } from "../../../../scripts/ops/preview-account-guard.mjs";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

check("only an explicit true flag makes an account read-only", () => {
  assert.equal(isPreviewReadOnly({ preview_read_only: true }), true);
  for (const p of [null, undefined, {}, { preview_read_only: false }, { preview_read_only: null }]) assert.equal(isPreviewReadOnly(p), false);
});

check("safe methods pass; every other method is refused outside the allowlist", () => {
  for (const m of ["GET", "head", "OPTIONS"]) assert.equal(isSafeMethod(m), true);
  for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
    for (const path of ["/api/ops/workflows/verification", "/api/ops/workflows/transfer", "/api/ops/workflows/submission", "/api/admin/users", "/api/workspace-demo-role", "/farmers", "/app"]) {
      assert.equal(previewRequestAllowed(m, path), false, `${m} ${path}`);
    }
  }
});

check("allowlisted report exports are POST-only and exact-path", () => {
  for (const p of READ_ONLY_ALLOWED_WRITE_PATHS) {
    assert.equal(previewRequestAllowed("POST", p), true);
    assert.equal(previewRequestAllowed("POST", `${p}?format=csv`), true);
    assert.equal(previewRequestAllowed("DELETE", p), false);
    assert.equal(previewRequestAllowed("POST", `${p}/extra`), false);
  }
});

check("a read-only ministry officer resolves to preview_observer and may only view GIS layers", () => {
  const actor = resolveOperationalActor({ id: "u", full_name: "x", role: "ministry_officer", county: null, preview_read_only: true });
  assert.equal(actor.role, "preview_observer");
  assert.deepEqual(getAllowedActions(actor), ["gis.view_operational_layers"]);
  const control = resolveOperationalActor({ id: "u", full_name: "x", role: "ministry_officer", county: null, preview_read_only: false });
  assert.notEqual(control.role, "preview_observer");
});

const STAGING = {
  NEXT_PUBLIC_APP_ENV: "staging",
  NEXT_PUBLIC_SUPABASE_URL: "https://stagingref.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x",
  SUPABASE_PRODUCTION_PROJECT_REF: "prodref",
  SUPABASE_STAGING_PROJECT_REF: "stagingref",
  PREVIEW_SITE_URL: "https://agritrace-git-preview-ministry-readiness.vercel.app",
};

check("account script accepts a verified staging target", () => {
  assert.deepEqual(checkPreviewAccountTarget(STAGING), { ok: true, errors: [] });
});

check("account script refuses production, unverified or public-site targets", () => {
  const refuse = (overrides: Record<string, string | undefined>) => assert.equal(checkPreviewAccountTarget({ ...STAGING, ...overrides }).ok, false, JSON.stringify(overrides));
  refuse({ NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" });
  refuse({ NEXT_PUBLIC_SUPABASE_URL: "https://otherref.supabase.co" });
  refuse({ NEXT_PUBLIC_APP_ENV: "production" });
  refuse({ NEXT_PUBLIC_APP_ENV: undefined });
  refuse({ SUPABASE_PRODUCTION_PROJECT_REF: undefined });
  refuse({ SUPABASE_STAGING_PROJECT_REF: undefined });
  refuse({ SUPABASE_STAGING_PROJECT_REF: "prodref", NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" });
  refuse({ SUPABASE_SERVICE_ROLE_KEY: undefined });
  refuse({ PREVIEW_SITE_URL: "https://agrivaultdata.com" });
  refuse({ PREVIEW_SITE_URL: "http://localhost:3000" });
  refuse({ PREVIEW_SITE_URL: undefined });
});

check("refusal messages never echo refs or URLs", () => {
  const { errors } = checkPreviewAccountTarget({ ...STAGING, NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" });
  for (const e of errors) assert.ok(!/prodref|stagingref|supabase\.co/.test(e), e);
});

check("emails are masked in output", () => {
  assert.equal(maskEmail("jane.doe@example.org"), "j***@example.org");
  assert.equal(maskEmail("nope"), "(invalid)");
});

console.log(`\n${passed} preview read-only checks passed`);
