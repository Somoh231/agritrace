/**
 * Security infrastructure unit checks.
 * Run with: npm run test:workflow (bundled) or tsx src/lib/http/__tests__/security.spec.ts
 */

import assert from "node:assert/strict";

import { isAnalyticsTableUnavailable } from "@/lib/analytics/availability";
import {
  assessOperationalAccess,
  INACTIVE_ACCOUNT_MESSAGE,
  INCOMPLETE_PROFILE_MESSAGE,
  NO_AUTHORIZED_ROLE_MESSAGE,
} from "@/lib/auth/access-readiness";
import { safeInternalRedirect } from "@/lib/auth/safe-redirect";
import {
  canAssignProvisionedRole,
  canProvisionUsers,
  validateProvisioningInput,
} from "@/lib/admin/user-provisioning";
import { resolveRequestId, REQUEST_ID_HEADER } from "@/lib/http/request-context";
import { checkRateLimitMemory } from "@/lib/http/rate-limit-store";
import { canExportReport } from "@/lib/http/require-api-session";
import { ministryNavForRole, normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import { escapeCsvCell } from "@/lib/reports/csv";
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

console.log("security — internal redirects");

check("safe internal redirect preserves application paths", () => {
  assert.equal(
    safeInternalRedirect("/farmers?county=Bong#registry", "/command-center"),
    "/farmers?county=Bong#registry",
  );
});

check("safe internal redirect rejects absolute and protocol-relative URLs", () => {
  assert.equal(safeInternalRedirect("https://attacker.example", "/command-center"), "/command-center");
  assert.equal(safeInternalRedirect("//attacker.example/path", "/command-center"), "/command-center");
  assert.equal(safeInternalRedirect("/\\attacker.example", "/command-center"), "/command-center");
});

console.log("security — CSV export");

check("CSV cells neutralize spreadsheet formulas", () => {
  assert.equal(
    escapeCsvCell('=HYPERLINK("https://attacker.example")'),
    `"'=HYPERLINK(""https://attacker.example"")"`,
  );
  assert.equal(escapeCsvCell("  -1+2"), "'  -1+2");
  assert.equal(escapeCsvCell("Bong"), "Bong");
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

console.log("security — role-aware navigation");

check("exporter navigation omits national and admin routes", () => {
  const hrefs = ministryNavForRole("exporter").flatMap((section) => section.items.map((item) => item.href));
  assert.equal(hrefs.includes("/admin/users"), false);
  assert.equal(hrefs.includes("/command-center"), false);
  assert.equal(hrefs.includes("/inventory"), true);
  assert.equal(hrefs.includes("/farmers"), true);
});

check("invalid navigation roles fall back to least privilege", () => {
  assert.equal(normalizeMinistryNavRole(undefined), "auditor");
});

console.log("security — optional analytics");

check("missing analytics table is a recognized optional state", () => {
  assert.equal(
    isAnalyticsTableUnavailable({
      code: "PGRST205",
      message: "Could not find public.analytics_events in the schema cache",
    }),
    true,
  );
  assert.equal(
    isAnalyticsTableUnavailable({
      code: "42P01",
      message: 'relation "analytics_events" does not exist',
    }),
    true,
  );
});

check("unexpected analytics provider failures remain observable", () => {
  assert.equal(
    isAnalyticsTableUnavailable({
      code: "42501",
      message: "permission denied",
    }),
    false,
  );
});

console.log("security — workforce identity");

check("inactive and missing-role workforce identities fail closed with canonical messages", () => {
  const inactive = assessOperationalAccess(
    { role: "ministry_officer", is_active: false, account_status: "inactive" },
    ["ministry_officer"],
  );
  assert.equal(inactive.ok, false);
  if (!inactive.ok) assert.equal(inactive.message, INACTIVE_ACCOUNT_MESSAGE);

  const missingRole = assessOperationalAccess(
    { role: "ministry_officer", is_active: true, account_status: "active", organization_id: "org-1" },
    [],
  );
  assert.equal(missingRole.ok, false);
  if (!missingRole.ok) assert.equal(missingRole.message, NO_AUTHORIZED_ROLE_MESSAGE);
});

check("geographically scoped roles require complete organization and geography", () => {
  const incomplete = assessOperationalAccess(
    {
      role: "clan_technician",
      is_active: true,
      account_status: "active",
      organization_id: "org-1",
      county: "Bong",
      district: "Salala",
    },
    ["clan_technician"],
  );
  assert.equal(incomplete.ok, false);
  if (!incomplete.ok) assert.equal(incomplete.message, INCOMPLETE_PROFILE_MESSAGE);

  const complete = assessOperationalAccess(
    {
      role: "clan_technician",
      is_active: true,
      account_status: "active",
      organization_id: "org-1",
      county: "Bong",
      district: "Salala",
      clan_or_field_area: "QA geography A",
    },
    ["clan_technician", "dao_officer"],
  );
  assert.deepEqual(complete, {
    ok: true,
    role: "clan_technician",
    roles: ["clan_technician", "dao_officer"],
    multipleRoles: true,
  });
});

check("provisioning normalizes email and enforces assignment privilege", () => {
  assert.equal(canProvisionUsers("ministry_officer"), false);
  assert.equal(canProvisionUsers("ministry_admin"), true);
  assert.equal(canAssignProvisionedRole("ministry_admin", "super_admin"), false);
  assert.equal(canAssignProvisionedRole("super_admin", "admin"), true);

  const result = validateProvisioningInput(
    {
      email: "  QA.Clan@Example.ORG ",
      full_name: "QA Clan Officer",
      roles: ["clan_technician"],
      primary_role: "clan_technician",
      organization_id: "org-1",
      county: "Bong",
      district: "Salala",
      clan_or_field_area: "QA geography A",
    },
    "super_admin",
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.email, "qa.clan@example.org");
});

console.log(`\nAll ${passed} security checks passed.\n`);
