/**
 * Security infrastructure unit checks.
 * Run with: npm run test:workflow (bundled) or tsx src/lib/http/__tests__/security.spec.ts
 */

import assert from "node:assert/strict";

import { resolveRequestId, REQUEST_ID_HEADER } from "@/lib/http/request-context";
import { checkRateLimitMemory } from "@/lib/http/rate-limit-store";
import { canExportReport } from "@/lib/http/require-api-session";
import type { UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("security — request id");

check("resolveRequestId preserves valid incoming header", () => {
  const req = new Request("https://example.com", {
    headers: { [REQUEST_ID_HEADER]: "req-abc-123" },
  });
  assert.equal(resolveRequestId(req), "req-abc-123");
});

check("resolveRequestId generates UUID when header missing", () => {
  const id = resolveRequestId(new Request("https://example.com"));
  assert.match(id, /^[0-9a-f-]{36}$/i);
});

console.log("security — rate limiting");

check("rate limit blocks after max requests", () => {
  const policy = { windowMs: 60_000, max: 3 };
  const key = `test-${Date.now()}`;
  assert.equal(checkRateLimitMemory(key, policy).allowed, true);
  assert.equal(checkRateLimitMemory(key, policy).allowed, true);
  assert.equal(checkRateLimitMemory(key, policy).allowed, true);
  assert.equal(checkRateLimitMemory(key, policy).allowed, false);
});

console.log("security — report export RBAC");

check("unauthenticated export roles denied by canExportReport", () => {
  const donorOnly: UserRole = "donor_observer";
  assert.equal(canExportReport(donorOnly, "compliance"), false);
  assert.equal(canExportReport(donorOnly, "rice"), false);
  assert.equal(canExportReport(donorOnly, "donor"), true);
});

check("ministry can export compliance and executive", () => {
  const role: UserRole = "ministry_officer";
  assert.equal(canExportReport(role, "compliance"), true);
  assert.equal(canExportReport(role, "executive"), true);
  assert.equal(canExportReport(role, "donor"), true);
});

check("exporter can export DDS; donor exports blocked for compliance", () => {
  const exporter: UserRole = "exporter";
  assert.equal(canExportReport(exporter, "dds"), true);
  assert.equal(canExportReport(exporter, "executive"), false);
  const donor: UserRole = "donor_observer";
  assert.equal(canExportReport(donor, "compliance"), false);
});

console.log(`\nAll ${passed} security checks passed.\n`);
