import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../supabase/migrations/20260729230000_workforce_identity_provisioning.sql",
  import.meta.url,
);
const sql = await readFile(migrationUrl, "utf8");
const applicationTypes = await readFile(
  new URL("../src/lib/supabase/types.ts", import.meta.url),
  "utf8",
);

const supportedRoles = [
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

const requiredFragments = [
  "app.workforce_bootstrap_manifest",
  "create table public.workforce_role_catalog",
  "create table public.profile_role_assignments",
  "create table public.workforce_identity_transitions",
  "profile_role_assignments_one_current_primary",
  "profile_role_assignments_one_current_role",
  "profiles_lifecycle_consistency_check",
  "profiles_suspension_consistency_check",
  "authorization_version",
  "drop policy if exists profiles_self_update",
  "drop policy if exists profiles_ministry_update",
  "'field_agent'::public.user_role",
  "false,\n    'incomplete',\n    'incomplete'",
  "create function public.select_active_workforce_role",
  "create function public.replace_workforce_role_assignments",
  "create function public.has_active_workforce_access",
  "create function public.workforce_subject_has_access",
  "create function public.workforce_role_prerequisites_met",
  "as restrictive for all to authenticated",
  "workforce_identity_required",
  "legacy_profile_role_verified",
  "legacy_profile_role_temporary",
  "active workforce administrator required",
  "cannot remove the last viable super administrator",
  "stale authorization version",
  "to service_role",
  "grant execute on function public.select_active_workforce_role",
  "'ACTIVE_ROLE_SELECTED'",
  "'ROLE_ASSIGNMENTS_REPLACED'",
];

for (const fragment of requiredFragments) {
  assert.ok(sql.includes(fragment), `workforce identity migration missing contract: ${fragment}`);
}

for (const role of supportedRoles) {
  assert.ok(
    sql.includes(`('${role}',`),
    `role catalog is missing enum role: ${role}`,
  );
  assert.ok(
    applicationTypes.includes(`"${role}"`),
    `application UserRole is missing enum role: ${role}`,
  );
}

assert.match(sql, /^\s*begin;/im, "migration must be explicitly transactional");
assert.match(sql, /^\s*commit;/im, "migration must commit explicitly");
assert.doesNotMatch(
  sql,
  /\bdrop\s+table\b|\btruncate\b|\bdrop\s+column\b/i,
  "migration must not destructively remove table structure",
);
assert.doesNotMatch(
  sql,
  /\b(insert\s+into|update|delete\s+from)\s+auth\.users\b/i,
  "migration must never mutate auth.users",
);
assert.doesNotMatch(
  sql,
  /create table if not exists public\.(profile_role_assignments|workforce_role_catalog|workforce_identity_transitions)/i,
  "new authority tables must fail on partial application rather than mask drift",
);
assert.ok(
  !/new\.raw_user_meta_data->>'role'/.test(sql),
  "signup trigger must not trust user-controlled role metadata",
);
assert.ok(
  !/else\s+'field_agent'::user_role/i.test(sql),
  "signup trigger must not silently fall back to an active operational role",
);
assert.ok(
  !/insert into public\.profile_role_assignments[\s\S]{0,300}select p\.id,\s*p\.role/i.test(sql),
  "legacy profiles must not be blindly converted into explicit assignments",
);
assert.ok(
  !/assigned_by\s*[,)]?[\s\S]{0,100}select\s+p\.id/i.test(sql),
  "migration-created legacy assignments must not be represented as self-assigned",
);
assert.ok(
  !/security definer\s+set search_path = public/i.test(sql),
  "SECURITY DEFINER functions must not trust the writable public schema",
);
assert.ok(
  !/create policy[\s\S]{0,220}to authenticated[\s\S]{0,120}using\s*\(\s*true\s*\)/i.test(sql),
  "workforce migration must not create unconditional authenticated operational reads",
);
assert.match(
  sql,
  /replace_workforce_role_assignments\([\s\S]*?\) from public, anon, authenticated, service_role;/i,
  "service-only function ACL must revoke every application role explicitly",
);
assert.match(
  sql,
  /replace_workforce_role_assignments\([\s\S]*?\) to service_role;/i,
  "role replacement must be service-role-only",
);
assert.match(
  sql,
  /profile_id = auth\.uid\(\)[\s\S]{0,180}ended_at is null/i,
  "ordinary users may read only their current assignment rows",
);
assert.match(
  sql,
  /assignment\.expires_at > pg_catalog\.statement_timestamp\(\)/i,
  "expired assignments must fail closed",
);
assert.match(
  sql,
  /p\.access_transition_status = 'complete'/i,
  "transition-incomplete profiles must fail operational access",
);
assert.match(
  sql,
  /p\.account_status = 'active'/i,
  "inactive and non-active lifecycle states must fail operational access",
);
assert.match(
  sql,
  /or assignment\.expires_at > pg_catalog\.statement_timestamp\(\)/i,
  "active-role selection must require an unexpired assignment",
);
assert.match(
  sql,
  /every active legacy profile requires explicit approval/i,
  "legacy active users must be covered by an explicit bootstrap manifest",
);
assert.match(
  sql,
  /p\.role <> m\.role/i,
  "bootstrap approval cannot change or elevate an existing role",
);
assert.match(
  sql,
  /profiles_guard_last_viable_super_admin/i,
  "last viable super administrator must be protected across lifecycle writes",
);

console.log("Workforce identity migration contract passed.");
