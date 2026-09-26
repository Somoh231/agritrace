/**
 * Role landing and route-permission invariants.
 * Run with: npm run test:auth
 */

import assert from "node:assert/strict";

import { mayAccessNationalCommandCenter, postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { assertPilotRouteAccess, canAccessNationalCommandCenter, pilotRoleLandingPath } from "@/lib/auth/workspace-access";
import type { UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ROLES: UserRole[] = [
  "super_admin", "admin", "ministry_admin", "ministry_officer", "government_officer",
  "county_agriculture_coordinator", "county_officer", "dao_officer", "district_officer",
  "clan_technician", "field_agent", "cooperative_manager", "warehouse_manager",
  "donor_observer", "donor_partner", "exporter", "call_center_agent", "auditor",
];

/**
 * Roles whose sign-in home is currently refused by the route gate, pending an
 * owner decision (docs/adr/0012-role-route-boundaries.md). The test fails if a
 * role is added here silently or if a listed role is fixed without removing it.
 */
const PENDING_DECISION: Partial<Record<UserRole, string>> = {
  exporter: "ADR 0012 §C: exporter workspace is /cocoa/lots, currently gated off",
};

console.log("role routes — every role can open where it is sent");

check("sign-in home is a page the role may open (except documented pending decisions)", () => {
  const denied = ROLES.filter((r) => !assertPilotRouteAccess(r, postLoginHomeForRole(r)).ok);
  assert.deepEqual(denied.sort(), (Object.keys(PENDING_DECISION) as UserRole[]).sort());
});

check("fallback landing page is a page the role may open", () => {
  for (const r of ROLES) assert.equal(assertPilotRouteAccess(r, pilotRoleLandingPath(r)).ok, true, r);
});

check("call_center_agent: home is the farmer registry, not the reviewer queue", () => {
  assert.equal(postLoginHomeForRole("call_center_agent"), "/farmers");
  assert.equal(assertPilotRouteAccess("call_center_agent", "/farmers").ok, true);
  assert.equal(assertPilotRouteAccess("call_center_agent", "/verification-queue").ok, false);
});

check("command-center layout check agrees with the middleware gate for every role", () => {
  for (const r of ROLES) assert.equal(mayAccessNationalCommandCenter(r), canAccessNationalCommandCenter(r), r);
});

console.log(`\n${passed} checks passed`);
