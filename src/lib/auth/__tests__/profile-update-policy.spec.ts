/**
 * Admin console allowlist and administrative profile-change rules.
 * Run with: npm run test:auth
 */

import assert from "node:assert/strict";

import { authorizeProfileUpdate, PRIVILEGED_ROLES } from "@/lib/auth/profile-update-policy";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import type { UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const SA = { id: "sa-1", role: "super_admin" as UserRole };
const target = (role: UserRole, is_active = true, id = "t-1") => ({ id, role, is_active });

console.log("admin console + profile update policy");

check("admin console is super_admin only", () => {
  const roles: UserRole[] = ["super_admin", "admin", "ministry_admin", "ministry_officer", "government_officer", "county_officer", "dao_officer", "field_agent", "auditor"];
  assert.deepEqual(roles.filter(isAdminConsoleRole), ["super_admin"]);
});

check("non-super-admin actors are refused, including former admin-console roles", () => {
  for (const role of ["admin", "ministry_admin", "ministry_officer", "government_officer"] as UserRole[]) {
    const d = authorizeProfileUpdate({ actor: { id: "a", role }, target: target("field_agent"), patch: { role: "dao_officer" }, activeSuperAdmins: 1 });
    assert.equal(d.ok, false, role);
  }
});

check("a ministry_officer cannot make anyone (or themselves) super_admin", () => {
  const self = authorizeProfileUpdate({ actor: { id: "m", role: "ministry_officer" }, target: target("ministry_officer", true, "m"), patch: { role: "super_admin" }, activeSuperAdmins: 1 });
  const other = authorizeProfileUpdate({ actor: { id: "m", role: "ministry_officer" }, target: target("field_agent"), patch: { role: "super_admin" }, activeSuperAdmins: 1 });
  assert.equal(self.ok, false);
  assert.equal(other.ok, false);
});

check("super_admin may assign privileged roles to someone else", () => {
  for (const role of PRIVILEGED_ROLES) {
    const d = authorizeProfileUpdate({ actor: SA, target: target("field_agent"), patch: { role }, activeSuperAdmins: 2 });
    assert.equal(d.ok, true, role);
  }
});

check("nobody changes their own role", () => {
  const d = authorizeProfileUpdate({ actor: SA, target: target("super_admin", true, SA.id), patch: { role: "ministry_officer" }, activeSuperAdmins: 3 });
  assert.equal(d.ok, false);
});

check("nobody deactivates their own account", () => {
  const d = authorizeProfileUpdate({ actor: SA, target: target("super_admin", true, SA.id), patch: { is_active: false }, activeSuperAdmins: 3 });
  assert.equal(d.ok, false);
});

check("the last active super_admin cannot be demoted or deactivated", () => {
  const demote = authorizeProfileUpdate({ actor: SA, target: target("super_admin", true, "sa-2"), patch: { role: "admin" }, activeSuperAdmins: 1 });
  const deactivate = authorizeProfileUpdate({ actor: SA, target: target("super_admin", true, "sa-2"), patch: { is_active: false }, activeSuperAdmins: 1 });
  assert.deepEqual([demote.ok, deactivate.ok], [false, false]);
  const withAnother = authorizeProfileUpdate({ actor: SA, target: target("super_admin", true, "sa-2"), patch: { is_active: false }, activeSuperAdmins: 2 });
  assert.equal(withAnother.ok, true);
});

check("unknown roles and malformed flags are rejected", () => {
  assert.equal(authorizeProfileUpdate({ actor: SA, target: target("field_agent"), patch: { role: "root" }, activeSuperAdmins: 1 }).ok, false);
  assert.equal(authorizeProfileUpdate({ actor: SA, target: target("field_agent"), patch: { is_active: "no" }, activeSuperAdmins: 1 }).ok, false);
});

check("ordinary edits by super_admin are allowed", () => {
  assert.equal(authorizeProfileUpdate({ actor: SA, target: target("field_agent"), patch: { role: "dao_officer" }, activeSuperAdmins: 1 }).ok, true);
  assert.equal(authorizeProfileUpdate({ actor: SA, target: target("field_agent"), patch: { is_active: false }, activeSuperAdmins: 1 }).ok, true);
});

console.log(`${passed} checks passed`);
