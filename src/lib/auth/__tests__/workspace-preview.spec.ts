/**
 * Role-preview cookie regression checks: the cookie is presentation only.
 * Run with: npm run test:auth
 */

import assert from "node:assert/strict";

import { resolveEffectiveWorkspaceRole } from "@/lib/auth/effective-workspace-role";
import { mayAccessCountyDashboard, mayAccessNationalCommandCenter, postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { assertPilotRouteAccess } from "@/lib/auth/workspace-access";
import {
  applyWorkspaceDemoRoleToProfile,
  assignedWorkspaceRoles,
  presentedWorkspaceRole,
  WORKSPACE_PREVIEW_ROLES,
} from "@/lib/auth/workspace-demo-role";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import type { Profile, UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const profile = (role: UserRole, is_active = true): Profile =>
  ({ id: "u1", email: null, full_name: "Test", role, organization_id: null, county: null, district: null, phone: null, is_active, created_at: "" }) as unknown as Profile;

console.log("workspace preview — forged cookies grant nothing");

check("every forgeable preview role leaves a field agent a field agent", () => {
  for (const forged of WORKSPACE_PREVIEW_ROLES) {
    assert.equal(resolveEffectiveWorkspaceRole(profile("field_agent"), forged), "field_agent", forged);
    assert.equal(applyWorkspaceDemoRoleToProfile(profile("field_agent"), forged).role, "field_agent", forged);
  }
});

check("forged admin preview does not pass the admin console check", () => {
  const role = resolveEffectiveWorkspaceRole(profile("clan_technician"), "admin");
  assert.equal(role, "clan_technician");
  assert.equal(isAdminConsoleRole(role!), false);
});

check("forged cookie cannot open another role's workspace (layout checks)", () => {
  const cac = resolveEffectiveWorkspaceRole(profile("dao_officer"), "ministry_admin")!;
  assert.equal(mayAccessNationalCommandCenter(cac), mayAccessNationalCommandCenter("dao_officer"));
  const clan = resolveEffectiveWorkspaceRole(profile("clan_technician"), "county_agriculture_coordinator")!;
  assert.equal(mayAccessCountyDashboard(clan), mayAccessCountyDashboard("clan_technician"));
  for (const path of ["/admin/users", "/command-center", "/workspace/ministry", "/county-dashboard"]) {
    assert.deepEqual(assertPilotRouteAccess(clan, path), assertPilotRouteAccess("clan_technician", path), path);
  }
});

check("forged cookie never rescues a missing or deactivated profile", () => {
  assert.equal(resolveEffectiveWorkspaceRole(null, "admin"), null);
  assert.equal(resolveEffectiveWorkspaceRole(profile("ministry_admin", false), "admin"), null);
  assert.deepEqual(assignedWorkspaceRoles(profile("admin", false)), []);
});

check("a real single-role user keeps their own home and access", () => {
  for (const r of ["ministry_admin", "county_agriculture_coordinator", "dao_officer", "warehouse_manager"] as UserRole[]) {
    const eff = resolveEffectiveWorkspaceRole(profile(r), null)!;
    assert.equal(eff, r);
    assert.equal(postLoginHomeForRole(eff), postLoginHomeForRole(r));
  }
});

console.log("workspace preview — legitimate multi-role switching");

check("selecting one of the user's own roles works; anything else falls back", () => {
  const assigned: UserRole[] = ["county_agriculture_coordinator", "dao_officer"];
  assert.equal(presentedWorkspaceRole(assigned, "dao_officer"), "dao_officer");
  assert.equal(presentedWorkspaceRole(assigned, "admin"), "county_agriculture_coordinator");
  assert.equal(presentedWorkspaceRole(assigned, null), "county_agriculture_coordinator");
  assert.equal(presentedWorkspaceRole([], "admin"), null);
});

console.log(`\n${passed} checks passed`);
