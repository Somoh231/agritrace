/**
 * Missing-profile access regression checks.
 * Run with: npm run test:auth (or tsx src/lib/auth/__tests__/profile-access.spec.ts)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { resolveEffectiveWorkspaceRole } from "@/lib/auth/effective-workspace-role";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { ACCOUNT_UNAVAILABLE_PATH, roleFromProfile } from "@/lib/auth/profile-access";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import type { UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ALL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "ministry_admin",
  "ministry_officer",
  "government_officer",
  "county_agriculture_coordinator",
  "county_officer",
  "dao_officer",
  "district_officer",
  "clan_technician",
  "cooperative_manager",
  "field_agent",
  "warehouse_manager",
  "donor_observer",
  "donor_partner",
  "exporter",
  "call_center_agent",
  "auditor",
];

console.log("auth — missing profile is denied");

check("no profile row (null) resolves to no role", () => {
  assert.equal(roleFromProfile(null), null);
});

check("undefined profile (failed lookup) resolves to no role", () => {
  assert.equal(roleFromProfile(undefined), null);
});

check("profile without a role resolves to no role", () => {
  assert.equal(roleFromProfile({ role: "" as UserRole }), null);
});

check("deactivated profile resolves to no role, for every role including admin", () => {
  for (const role of ALL_ROLES) assert.equal(roleFromProfile({ role, is_active: false }), null, role);
});

check("missing profile never passes the admin-console check", () => {
  const role = roleFromProfile(null);
  assert.equal(role === null ? false : isAdminConsoleRole(role), false);
});

check("workspace preview cookie never substitutes for a missing profile", () => {
  for (const cookie of ["admin", "super_admin", "ministry_admin", undefined, null, ""]) {
    assert.equal(resolveEffectiveWorkspaceRole(null, cookie), null, String(cookie));
  }
});

check("denial page is not under any protected root (no redirect loop)", () => {
  const middleware = fs.readFileSync(path.join(process.cwd(), "src", "middleware.ts"), "utf8");
  const roots = [...middleware.matchAll(/^\s+"(\/[a-z0-9/-]+)",$/gm)].map((m) => m[1]);
  assert.ok(roots.length > 20, "protected roots parsed");
  assert.ok(roots.includes("/app") && roots.includes("/admin"), "known roots present");
  for (const r of roots) assert.ok(!(ACCOUNT_UNAVAILABLE_PATH === r || ACCOUNT_UNAVAILABLE_PATH.startsWith(`${r}/`)), r);
});

console.log("auth — valid profile behaviour unchanged");

check("active profile keeps its database role (is_active true or not selected)", () => {
  for (const role of ALL_ROLES) {
    assert.equal(roleFromProfile({ role, is_active: true }), role, role);
    assert.equal(roleFromProfile({ role }), role, role);
  }
});

check("post-login home is computed from the database role, as before", () => {
  for (const role of ALL_ROLES) assert.equal(postLoginHomeForRole(roleFromProfile({ role })!), postLoginHomeForRole(role), role);
});

check("workspace preview cannot re-role a real profile (single-role accounts)", () => {
  assert.equal(resolveEffectiveWorkspaceRole({ role: "ministry_admin" }, "county_officer"), "ministry_admin");
  assert.equal(resolveEffectiveWorkspaceRole({ role: "field_agent" }, "admin"), "field_agent");
  assert.equal(resolveEffectiveWorkspaceRole({ role: "field_agent" }, null), "field_agent");
});

console.log("auth — no synthetic profile in source");

check("the demo profile fallback module and its helpers are gone from src/", () => {
  const root = path.join(process.cwd(), "src");
  const banned = [
    "temp-demo-profile-fallback",
    "buildDemoProfileForAuthUser",
    "resolveUserRoleWithDemoFallback",
    "DEMO_PROFILE_FALLBACK",
  ];
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(entry.name) && !p.endsWith(path.join("__tests__", "profile-access.spec.ts"))) {
        const text = fs.readFileSync(p, "utf8");
        for (const b of banned) if (text.includes(b)) hits.push(`${path.relative(root, p)}: ${b}`);
      }
    }
  };
  walk(root);
  assert.deepEqual(hits, []);
});

console.log(`\n${passed} checks passed`);
