import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../supabase/migrations/20260729230000_workforce_identity_provisioning.sql",
  import.meta.url,
);
const sql = await readFile(migrationUrl, "utf8");

const requiredFragments = [
  "account_status text not null default 'incomplete'",
  "create table if not exists public.profile_role_assignments",
  "profile_role_assignments_one_primary",
  "drop policy if exists profiles_self_update",
  "drop policy if exists profiles_ministry_update",
  "'field_agent'::public.user_role",
  "false,\n    'incomplete'",
  "create or replace function public.select_active_workforce_role",
  "create or replace function public.replace_workforce_role_assignments",
  "to service_role",
  "grant execute on function public.select_active_workforce_role",
  "'ACTIVE_ROLE_SELECTED'",
];

for (const fragment of requiredFragments) {
  assert.ok(sql.includes(fragment), `workforce identity migration missing contract: ${fragment}`);
}

assert.ok(
  !/new\.raw_user_meta_data->>'role'/.test(sql),
  "signup trigger must not trust user-controlled role metadata",
);
assert.ok(
  !/else\s+'field_agent'::user_role/i.test(sql),
  "signup trigger must not silently fall back to an active operational role",
);

console.log("Workforce identity migration contract passed.");
