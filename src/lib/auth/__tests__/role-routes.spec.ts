/**
 * Role landing, route-permission and navigation invariants (ADR 0012 + Ministry preview readiness).
 * Run with: npm run test:auth
 */

import assert from "node:assert/strict";

import { mayAccessCountyDashboard, mayAccessDistrictDashboard, mayAccessNationalCommandCenter, postLoginHomeForRole } from "@/lib/auth/post-login-home";
import {
  assertPilotRouteAccess,
  canAccessCountyDashboard,
  canAccessDistrictDashboard,
  canAccessNationalCommandCenter,
  pilotRoleLandingPath,
} from "@/lib/auth/workspace-access";
import { ministryNavForRole } from "@/lib/navigation/ministry-nav";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
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
const can = (r: UserRole, path: string) => assertPilotRouteAccess(r, path).ok;

console.log("role routes — every role can open where it is sent, and nothing more");

check("sign-in home is a page every role may open", () => {
  const denied = ROLES.filter((r) => !can(r, postLoginHomeForRole(r)));
  assert.deepEqual(denied, []);
});

check("fallback landing page is a page every role may open", () => {
  for (const r of ROLES) assert.equal(can(r, pilotRoleLandingPath(r)), true, r);
});

check("layout checks agree with the middleware gate for every role", () => {
  for (const r of ROLES) {
    assert.equal(mayAccessNationalCommandCenter(r), canAccessNationalCommandCenter(r), `command-center ${r}`);
    assert.equal(mayAccessCountyDashboard(r), canAccessCountyDashboard(r), `county ${r}`);
    assert.equal(mayAccessDistrictDashboard(r), canAccessDistrictDashboard(r), `district ${r}`);
  }
});

check("/admin is super_admin only, for every admin route", () => {
  for (const r of ROLES) {
    for (const p of ["/admin", "/admin/users", "/admin/system", "/admin/launch-readiness", "/admin/organizations"]) {
      assert.equal(can(r, p), r === "super_admin", `${r} ${p}`);
    }
  }
});

check("farmer data: operational chain, cooperative and call-centre only", () => {
  const allowed = ROLES.filter((r) => can(r, "/farmers"));
  assert.deepEqual(allowed.sort(), [
    "admin", "call_center_agent", "clan_technician", "cooperative_manager", "county_agriculture_coordinator", "county_officer",
    "dao_officer", "district_officer", "field_agent", "government_officer", "ministry_admin", "ministry_officer", "super_admin",
  ].sort());
  for (const r of ["exporter", "warehouse_manager", "auditor", "donor_observer", "donor_partner"] as UserRole[]) {
    for (const p of ["/farmers", "/cooperatives", "/farm-profiles"]) assert.equal(can(r, p), false, `${r} ${p}`);
  }
});

check("CLAN and field agents: CLAN desk and capture tools, not district/national workspaces", () => {
  for (const r of ["clan_technician", "field_agent"] as UserRole[]) {
    assert.equal(postLoginHomeForRole(r), "/workspace/clan");
    assert.equal(can(r, "/workspace/clan"), true);
    assert.equal(can(r, "/field/boundary-capture"), true);
    for (const p of ["/workspace/dao", "/district-dashboard", "/county-dashboard", "/command-center", "/national-heat-map", "/verification-queue", "/reporting", "/reports"]) {
      assert.equal(can(r, p), false, `${r} ${p}`);
    }
  }
});

check("exporters: own export surfaces only", () => {
  assert.equal(postLoginHomeForRole("exporter"), "/cocoa/lots");
  for (const p of ["/cocoa/lots", "/cocoa/movements", "/cocoa/eudr"]) assert.equal(can("exporter", p), true, p);
  for (const p of ["/cocoa/approvals", "/cocoa/farmers", "/farmers", "/inventory", "/transfers", "/logistics", "/command-center"]) {
    assert.equal(can("exporter", p), false, p);
  }
});

check("call_center_agent: farmer registry home, never the reviewer queue or command center", () => {
  assert.equal(postLoginHomeForRole("call_center_agent"), "/farmers");
  assert.equal(can("call_center_agent", "/verification-queue"), false);
  assert.equal(can("call_center_agent", "/command-center"), false);
});

check("navigation never offers a link the route policy refuses", () => {
  for (const r of ROLES) {
    for (const section of ministryNavForRole(r)) {
      for (const item of section.items) {
        const path = item.href.split("?")[0];
        const ok = path.startsWith("/admin") ? isAdminConsoleRole(r) : can(r, path);
        assert.equal(ok, true, `${r} sees ${item.href}`);
      }
    }
  }
});

check("Ministry roles see no Administration links", () => {
  for (const r of ["ministry_officer", "ministry_admin", "government_officer", "admin"] as UserRole[]) {
    const hrefs = ministryNavForRole(r).flatMap((s) => s.items.map((i) => i.href));
    assert.equal(hrefs.some((h) => h.startsWith("/admin")), false, r);
  }
});

console.log(`${passed} checks passed`);
