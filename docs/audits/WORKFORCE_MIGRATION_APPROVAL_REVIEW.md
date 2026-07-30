# Workforce Migration Approval Review (Superseded)

This first-pass review is retained as an audit trail. Its findings drove the
revised migration design. The current final review is:

`docs/audits/WORKFORCE_MIGRATION_APPROVAL_REVIEW_V2.md`

Do not use the verdict, line numbers, or commands below for application.

Review date: 2026-07-29

Repository: `/Users/mo/Desktop/Agriculture Pilot Liberia/agritrace`

Branch reviewed: `audit/rc1-360-agentic-qa`

Source HEAD reviewed: `ece311a66ae372017aeea0679ecad2ada1435d2f`

Reviewed migrations:

1. `20260729220000_rc1_geography_rls_hardening.sql`
2. `20260729230000_workforce_identity_provisioning.sql`

Scope was local and static only. No migration was applied, no Supabase Auth
setting was changed, no user was created, and no production promotion occurred.
Live data was not queried in this review. “Existing-data” conclusions below are
therefore schema- and repository-shaped conclusions; the preflight queries in
section 11 remain mandatory against the approved environment.

## 1. Final migration verdict

**NO-GO. Do not apply either migration to the approved Supabase environment in
its current form.**

The order is correct and neither migration contains table drops, row deletes,
truncation, or direct `auth.users` writes. Migration `220000` materially
improves the three reviewed operational RLS surfaces. Migration `230000`
correctly stops trusting signup role metadata, removes authenticated profile
updates, and makes the privileged role-replacement RPC service-role-only.

Those strengths do not close the gate. The following findings require revision
or an approved, demonstrated data-remediation design:

| ID | Severity | Finding | Required closure |
| --- | --- | --- | --- |
| WF-DB-01 | Blocker | Applying `230000` makes the application use the new readiness path, which requires an organization for every active role. The current schema permits `profiles.organization_id IS NULL`, and repository bootstrap instructions explicitly create the first `super_admin` with a null organization. A current administrator with that production-shaped record would be locked out after migration even though the SQL leaves `is_active = true`. | Define the organization rule by role, revise the application/migration consistently, and make the preflight completeness query return zero rows before application. |
| WF-DB-02 | Blocker | Inactive-profile denial is not enforced universally at the database layer. Existing operational policies include direct identity predicates such as `actor_id = auth.uid()`, `assignee_id = auth.uid()`, and `recipient_id = auth.uid()`. `profile_role()`, `profile_county()`, and `profile_district()` also return values without checking `is_active` or `account_status`. The two proposed migrations do not add a restrictive active-profile policy to all operational tables. | Add and test a database-level active-workforce predicate, including restrictive policies or equivalent coverage for every operational table and direct self/actor predicate. |
| WF-DB-03 | High | Every reviewed `SECURITY DEFINER` function fixes `search_path` to writable object namespace `public`, rather than an empty or tightly trusted path with fully qualified references. | Use a hardened path (prefer `SET search_path = ''`) and fully qualify all relations, types, and non-`pg_catalog` functions. Verify ownership and ACLs after application. |
| WF-DB-04 | High | `replace_workforce_role_assignments` does not reject a missing/inactive actor. `actor_role NOT IN (...)` evaluates to null when no actor row is found, and PL/pgSQL does not enter the `IF` on a null condition. Null array elements, a null primary role, duplicate roles, and a missing target are also not explicitly rejected. The function is service-role-only, so this is not an ordinary-user SQL escalation, but it breaks the promised authorization and audit invariant for the approved provisioning mechanism. | Reject null/missing actor and target, null/empty/duplicate role arrays, null primary role, and any primary not in the normalized role set before audit or assignment writes. |
| WF-DB-05 | High | `profile_role_assignments_read` allows any active or inactive user to read their own assignment rows and uses `is_ministry_wide()`, which includes `ministry_officer` and `government_officer`, to read all assignments. This exposes authorization metadata beyond the stated administrator/auditor review model. Table privileges are also left to environment defaults instead of being explicit. | Require an active profile for self-read, limit global read to explicitly approved admin/auditor roles, revoke all from `anon`, revoke writes from `authenticated`, grant only `SELECT` to `authenticated`, and grant the intended service role explicitly. |
| WF-DB-06 | High | The role backfill treats every current `profiles.role` as approved and writes `assigned_by = p.id`, falsely representing migration-created assignments as self-assigned. This does not elevate beyond the current role at SQL execution time, but it legitimizes any historical public-signup/default-role residue without review. | Run the preflight provenance/completeness review, obtain an approved mapping, and record backfilled assignment provenance as system migration/null rather than the subject user. |
| WF-DB-07 | Medium | `is_active` and `account_status` can drift. Migration `220000` checks only `is_active`; other helpers use `coalesce(is_active, true)`. No constraint guarantees that only `account_status = 'active'` has `is_active = true`. | Add a lifecycle consistency constraint or make every authorization helper check both fields. |
| WF-DB-08 | Medium | DAO field-report read scope compares the report county to the viewer county and the attributed officer district to the viewer district, but does not also compare the officer county. Repeated district names or inconsistent legacy attribution can cross-match. Warehouse transfers have no district dimension and intentionally give DAO/district roles county-level endpoint scope. | Add the officer-county predicate for field reports. Formally approve and document county-level warehouse scope for DAO/district roles, or introduce a district-capable warehouse assignment model. |
| WF-DB-09 | Medium | `230000` is not safe to rerun manually: it rewrites every lifecycle status from `is_active`, can turn invited/incomplete rows into inactive rows, and can reactivate an old role assignment during the backfill. `IF NOT EXISTS` on a partially incompatible table can also mask drift. | Treat it as exactly-once, fail on unexpected pre-existing objects, and make only policy/function replacement blocks deliberately repeatable. Add an explicit partial-application recovery procedure. |

Operator approval alone is insufficient while these findings remain open.

## 2. Objects created or altered

### Line-by-line coverage: `20260729220000_rc1_geography_rls_hardening.sql`

| Lines | Object/action | Review |
| --- | --- | --- |
| 1-3 | Safety header | Correctly says approval and staging validation are required. |
| 5-59 | `can_read_warehouse_transfer` | Active-profile check and role/warehouse/county/requester scope are materially narrower than the replaced `USING (true)`. Uses unsafe `search_path = public`. DAO/district access is county-level because warehouses have no district column. |
| 61-110 | `can_manage_warehouse_transfer` | Requires an active recognized role and a related endpoint/assignment. Cooperative/exporter requester-only read does not imply write. Uses unsafe `search_path = public`. |
| 112-115 | Transfer helper ACLs | Explicitly revokes `PUBLIC`/`anon` and grants `authenticated`; ordinary callers can execute only a boolean authorization helper. Existing grants to any other named role are not explicitly reset. |
| 117-160 | Transfer policies | Replaces the permissive `FOR ALL` and `SELECT USING (true)` policies with four command-specific policies. Delete is ministry-wide only. No data rows are changed. |
| 162-210 | `can_read_field_report` | Active user, national/auditor, county, DAO/district, and own-attribution branches are explicit. Officer county is not checked in the DAO branch. Uses unsafe search path. |
| 212-249 | `can_write_field_report` | National or self-attributed scoped capture only. County must match for field/DAO callers. Uses unsafe search path. |
| 251-273 | Field helper ACLs and policies | Explicit function ACLs; read and insert only. Existing report attribution remains unchanged. |
| 275-325 | `can_read_geo_location` | Scopes through the existing farmer row: county, county+district, registrar, or organization. Missing farmer/profile fails closed. Uses unsafe search path. |
| 327-367 | `can_write_geo_location` | National, DAO/district within county+district, or own registered farmer. County coordinators, organizations, auditors, and donors do not receive write access. Uses unsafe search path. |
| 369-391 | Geo helper ACLs and policies | Explicit function ACLs; read and insert only. No geo row is mutated. |

### Line-by-line coverage: `20260729230000_workforce_identity_provisioning.sql`

| Lines | Object/action | Review |
| --- | --- | --- |
| 1-3 | Safety header | Correctly blocks unapproved remote application. |
| 5-14 | Profile columns | Additive and preserves UUID identity, organization, county, district, warehouse links, and historical FKs. `provisioned_by` uses `ON DELETE SET NULL`. `IF NOT EXISTS` can mask incompatible prior definitions. |
| 16-20 | Account-status check | Enumerated text values are compatible with the app. Constraint is added before the backfill and can fail if a partially deployed column already contains another value. It does not enforce consistency with `is_active`. |
| 22-26 | Existing-profile backfill | No deletion or role change. Active rows become `active`; inactive rows become `inactive`. It touches every profile and assumes all existing role grants are legitimate. A rerun overwrites invited/incomplete lifecycle states. |
| 28-30 | Staff-ID index | Case-insensitive uniqueness is appropriate. Freshly added values are null, so first application cannot encounter duplicates; a partial/manual deployment still can. |
| 32-41 | `profile_role_assignments` | Additive role-history table; enum-compatible; profile deletion cascades assignment history in the future. The table-level unique key permits soft reactivation. |
| 43-48 | Assignment indexes | Partial unique index prevents more than one active primary. Active lookup index supports `(profile_id, role)` authorization checks. Neither index guarantees at least one active primary. |
| 50-54 | Role backfill | Copies, rather than elevates, `profiles.role`; however, it assumes role provenance is approved, records the subject as assigner, and is unsafe after later role changes if rerun. |
| 56-65 | Assignment RLS | RLS is enabled, but self-read does not require active status and `is_ministry_wide()` is broader than administrator/auditor review. Table grants/revokes are not explicit. |
| 67-70 | Profile policy removal | Correctly removes the only repository-defined authenticated profile-update policies. With RLS enabled, ordinary authenticated profile updates become fail-closed. |
| 72-86 | Updated-at trigger | Additive, non-definer trigger; uses a broad search path but has no elevated execution context. |
| 88-123 | `handle_new_user` | Correctly ignores user-controlled role metadata and creates new profiles as inactive/incomplete with no role assignment. It reacts to `auth.users` inserts but does not mutate `auth.users`. Uses unsafe search path. |
| 125-173 | `select_active_workforce_role` | Checks the caller’s active profile and an unremoved explicit assignment, transactionally changes the one primary role and `profiles.role`, and audits the choice. It cannot select an unassigned role. Uses unsafe search path. |
| 175-177 | Role-selection ACL | Explicit `PUBLIC`/`anon` revoke and authenticated execute grant. |
| 179-297 | `replace_workforce_role_assignments` | Service-side transactional replacement, soft removal, primary synchronization, and audit events are directionally correct. Null/missing actor and target validation is defective; input arrays are not normalized or fully validated. Uses unsafe search path. |
| 299-310 | Replacement ACL | Correctly revokes `PUBLIC`, `anon`, and `authenticated`, then grants only `service_role`. Ordinary authenticated users cannot invoke it. |
| 312-317 | Rollback notes | Correctly warns against restoring active default signup, but is not an executable or complete rollback plan. |

Created objects:

- Six RLS authorization helper functions for transfers, field reports, and geo
  locations.
- One `profile_role_assignments` table.
- One profile lifecycle constraint.
- Three new indexes: staff ID uniqueness, one active primary role, and active
  role lookup.
- One profile timestamp trigger/function.
- One fail-closed replacement for `handle_new_user`.
- One authenticated active-role selector.
- One service-role-only assignment replacement function.

Altered objects:

- `profiles`: nine additive workforce columns, lifecycle backfill, two removed
  update policies, and timestamp trigger.
- `warehouse_transfer_orders`: four replacement RLS policies.
- `field_reports`: replacement read/insert policies.
- `geo_locations`: replacement read/insert policies.

## 3. Existing-data impact

There are no `DELETE`, `TRUNCATE`, `DROP TABLE`, destructive column operations,
or updates to operational business rows in either migration.

Existing operational attribution is preserved:

- Profile UUIDs do not change.
- `field_reports.officer_profile_id`, `farmers.registered_by`,
  `warehouse_transfer_orders.requested_by`, warehouse assignments, workflow
  actors, and audit users are not rewritten.
- Organization, county, district, and warehouse assignment data are not
  normalized or deleted.

The material writes are:

- Every existing profile receives a lifecycle status and timestamps.
- Every existing profile receives one active primary role-assignment row copied
  from its current `profiles.role`.

Production-shaped risks:

- `organization_id`, `county`, and `district` remain nullable text/UUID fields.
  The application’s new access readiness logic requires an organization for
  every role and requires geography for field/county roles.
- Repository bootstrap SQL explicitly creates a `super_admin` with
  `organization_id = NULL`; that shape would be denied by the new application
  readiness path after the migration makes the new columns queryable.
- County and district values are free text. Case-insensitive comparisons reduce
  case drift but do not validate that the district belongs to the county.
- Existing role values are enum-compatible, but their original authorization
  provenance is not established by the schema.
- Existing duplicate non-null staff IDs cannot exist on a clean first
  application because the column is new, but can break a partial/manual retry.

The approved environment must pass the preflight queries in section 11. Static
inspection cannot certify its live rows.

## 4. Existing-user impact

- No current profile is set inactive if `is_active` is currently true.
- No current profile receives a role other than its current `profiles.role`.
- Inactive profiles remain `is_active = false` and become
  `account_status = 'inactive'`.
- Existing active profiles are labelled active even when required organization
  or geography is missing.
- After migration, application guards stop using their legacy-schema fallback.
  An active user whose profile lacks the newly required completeness fields can
  therefore lose application access without being marked inactive.
- Any unreviewed role created through the old metadata-trusting signup trigger
  is copied into the explicit assignment table. This preserves current access
  rather than adding a higher role, but converts unverified legacy state into
  the new source of assigned roles.

Conclusion: “no accidental deactivation” is true at the column-write level but
is **not proven at the effective-access level**. Existing-user compatibility is
a blocker until live completeness and role provenance are reviewed.

## 5. RLS changes

Positive changes:

- The reviewed transfer `authenticated USING (true)` policy is removed.
- Transfer policies are split by `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Field-report and geo reads are bounded by user state, role, attribution,
  organization, or geography.
- Profile self-update and ministry-update policies are removed, preventing
  authenticated clients from changing protected profile fields directly.
- No policy in either proposed migration creates `authenticated USING (true)`.

Limitations:

- Pre-existing `authenticated USING (true)` policies remain on
  `pilot_dao_officers`, `pilot_operational_events`, and
  `pilot_county_metrics`. They are not created by these migrations, but the
  statement “no operational table has such a policy” is not globally true.
- Inactive denial in `220000` depends on `is_active` only.
- Existing workflow policies can authorize an inactive user through direct
  `auth.uid()` equality.
- Assignment-table read scope is broader than the documented
  administrator/auditor model.
- DAO warehouse access is county-level because neither `warehouses` nor
  `warehouse_assignments` carries district scope.

Missing-profile users fail the reviewed helper functions because no active
profile row exists. They ordinarily cannot own FK-attributed operational rows,
but universal missing/inactive denial should still be enforced explicitly.

## 6. Function security

| Function group | Definer | Caller ACL | Result |
| --- | --- | --- | --- |
| Transfer/field/geo helpers | Yes | `authenticated` after `PUBLIC`/`anon` revoke | Functional checks are caller-bound through `auth.uid()`, but search path requires hardening. |
| `handle_new_user` | Yes | Trigger execution | Correct fail-closed row creation; does not write `auth.users`; search path requires hardening. |
| `select_active_workforce_role` | Yes | `authenticated` only | Cannot select an unassigned role; active/profile checks are present; search path requires hardening. |
| `replace_workforce_role_assignments` | Yes | `service_role` only | Not callable by ordinary authenticated users; missing/null actor and input checks require correction. |
| `set_profile_updated_at` | No | Trigger execution | No privilege elevation. |

All `SECURITY DEFINER` bodies reference `public` relations, but
`SET search_path = public` is not the safest form. The revision should use an
empty search path and fully qualify relations, types, `auth.uid`, and helper
calls. Function ownership must remain a non-login migration owner, and explicit
ACL verification is mandatory.

## 7. Role-assignment behavior

- The enum dependency is correct: all referenced legacy and operational roles
  were created before these migrations.
- First application creates one primary assignment per existing profile.
- The partial unique index safely prevents two unremoved primary rows.
- The model does not enforce at least one active primary by constraint; the two
  RPCs maintain that invariant only when inputs and targets are valid.
- Active-role switching checks an unremoved assignment before synchronizing
  `profile_role_assignments.is_primary` and `profiles.role`. It therefore cannot
  create a role that was not explicitly assigned.
- Role switching can re-enable the privileges of any still-active assignment;
  that is intended multi-role behavior, not escalation beyond assignments.
- Assignment replacement correctly reserves `super_admin` and `admin` grants
  for a `super_admin`, and `ministry_admin` grants for `super_admin`/`admin`,
  when `actor_role` is non-null.
- A null `actor_role` bypasses those `IF` predicates because SQL comparisons
  return null. Service-role-only execution limits who can exploit the defect,
  but the mechanism still fails its own authorization contract.
- Direct service-role writes can make assignments and `profiles.role` drift.
  RLS continues to consume `profiles.role`; assignments drive RLS indirectly
  only through the approved RPCs. The revision should make this invariant
  database-enforced or make the primary assignment the authoritative helper
  source.

## 8. Migration dependencies

Required order is:

1. `20260513110000_add_user_role_enums.sql`
2. `20260513120000_user_role_operational_hierarchy.sql`
3. `20260619120000_workflow_engine.sql`
4. `20260729220000_rc1_geography_rls_hardening.sql`
5. `20260729230000_workforce_identity_provisioning.sql`

The two reviewed filenames sort in the correct order. `220000` depends on the
existing role labels, transfer table, profile geography, warehouses,
warehouse assignments, field reports, geo locations, and farmers. `230000`
depends on the complete role enum, profiles, organizations, audit log, existing
Auth trigger, and helper functions.

Do not apply `230000` while leaving `220000` pending: the identity rollout would
activate the new application path without first closing the known transfer and
geography RLS exposure.

## 9. Rollback risks

Neither file has a down migration.

- Rolling back `220000` by restoring the old policies would reintroduce the
  transfer `USING (true)` exposure and broad geography reads. Prefer a forward
  corrective migration.
- Dropping `profile_role_assignments` destroys role history.
- Dropping workforce columns destroys staff metadata and lifecycle timestamps.
- Restoring the old `handle_new_user` restores user-controlled role metadata
  and active default-role signup; that rollback is prohibited.
- Removing role assignments before application rollback can strand the current
  application, which expects explicit assignments when the table exists.
- Profile and policy DDL takes locks. The all-profile update and unique index
  creation can extend the deployment window on a large profile table.
- A partially executed/manual retry is unsafe because lifecycle backfill and
  assignment backfill are not repeat-safe.

Before any approved application, take a schema-only dump plus data exports for
`profiles`, `profile_role_assignments` (if present), `audit_log`, and current
policy/function catalogs. Rollback must be an approved forward migration, not
ad hoc object deletion.

## 10. Exact application commands

**These commands are documented for the future approved run. Do not execute
them until WF-DB-01 through WF-DB-06 are closed, revised SQL is reviewed, and
the preflight queries return approved results.**

Run from the repository root:

```bash
cd "/Users/mo/Desktop/Agriculture Pilot Liberia/agritrace"
test "$(git branch --show-current)" = "audit/rc1-360-agentic-qa"
git status --short
npm run test:rls:rc1
npm run test:workflow
npm run lint
npm run build
git diff --check
```

Select and verify the approved Supabase environment without embedding secrets:

```bash
test -n "${APPROVED_SUPABASE_PROJECT_REF:?Set the approved non-production project ref}"
supabase link --project-ref "$APPROVED_SUPABASE_PROJECT_REF"
supabase migration list --linked
supabase db push --linked --dry-run
```

The dry run must list exactly the reviewed-and-revised `20260729220000` and
`20260729230000` migrations, in that order, and no other migration. After a
named operator approves the dry-run output, the application command is:

```bash
supabase db push --linked
```

Do not use `--include-all`, `--include-seed`, or `--yes`. Do not run the command
against production as part of controlled-pilot validation.

## 11. Exact preflight and post-migration verification queries

### Mandatory preflight (before any future application)

Run read-only with a database-owner connection and save the result as approval
evidence:

```sql
begin transaction read only;

-- Auth/profile linkage. Both counts must be zero.
select
  count(*) filter (where p.id is null) as auth_users_without_profile,
  count(*) filter (where u.id is null) as profiles_without_auth_user
from auth.users u
full join public.profiles p on p.id = u.id;

-- Effective-access compatibility. This result must be reviewed row by row and
-- must be empty under the final role-completeness rules.
select
  p.id,
  p.email,
  p.role,
  p.organization_id,
  p.county,
  p.district,
  p.is_active,
  p.deactivated_at,
  p.created_at,
  u.created_at as auth_created_at,
  u.last_sign_in_at,
  u.raw_user_meta_data->>'role' as signup_metadata_role
from public.profiles p
join auth.users u on u.id = p.id
where p.is_active is true
  and (
    p.organization_id is null
    or (
      p.role in (
        'county_officer',
        'county_agriculture_coordinator',
        'district_officer',
        'dao_officer',
        'field_agent',
        'clan_technician',
        'call_center_agent'
      )
      and nullif(btrim(p.county), '') is null
    )
    or (
      p.role in ('district_officer', 'dao_officer', 'field_agent', 'clan_technician')
      and nullif(btrim(p.district), '') is null
    )
  )
order by p.role, p.email;

-- Role provenance review. Any metadata-derived administrative role requires
-- explicit human approval; do not automatically copy it into assignments.
select
  p.id,
  p.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as signup_metadata_role,
  p.created_at,
  u.last_sign_in_at
from public.profiles p
join auth.users u on u.id = p.id
where u.raw_user_meta_data ? 'role'
   or p.role in ('super_admin', 'admin', 'ministry_admin')
order by p.created_at;

-- Geography consistency candidates.
select p.id, p.email, p.role, p.county, p.district
from public.profiles p
where p.county is not null
  and not exists (
    select 1 from public.counties c
    where lower(btrim(c.name)) = lower(btrim(p.county))
  )
union all
select p.id, p.email, p.role, p.county, p.district
from public.profiles p
where p.district is not null
  and not exists (
    select 1
    from public.districts d
    join public.counties c on c.id = d.county_id
    where lower(btrim(d.name)) = lower(btrim(p.district))
      and lower(btrim(c.name)) = lower(btrim(p.county))
  );

-- Existing attribution with missing scope metadata.
select fr.id, fr.county as report_county, p.id as officer_id,
       p.county as officer_county, p.district as officer_district
from public.field_reports fr
left join public.profiles p on p.id = fr.officer_profile_id
where fr.officer_profile_id is not null
  and (
    p.id is null
    or lower(btrim(fr.county)) is distinct from lower(btrim(p.county))
  );

-- Warehouse managers without an assignment, and assignments to missing rows.
select p.id, p.email, p.county
from public.profiles p
where p.role = 'warehouse_manager'
  and p.is_active is true
  and not exists (
    select 1 from public.warehouse_assignments wa where wa.profile_id = p.id
  );

select wa.profile_id, wa.warehouse_id
from public.warehouse_assignments wa
left join public.profiles p on p.id = wa.profile_id
left join public.warehouses w on w.id = wa.warehouse_id
where p.id is null or w.id is null;

rollback;
```

### Mandatory post-migration catalog and invariant checks

```sql
begin transaction read only;

-- Both versions must appear exactly once.
select version
from supabase_migrations.schema_migrations
where version in ('20260729220000', '20260729230000')
order by version;

-- Enum compatibility.
select e.enumlabel
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public' and t.typname = 'user_role'
order by e.enumsortorder;

-- Profile lifecycle consistency. Must return zero.
select count(*) as lifecycle_mismatches
from public.profiles
where (account_status = 'active') is distinct from is_active;

-- Every profile must have exactly one active primary, and it must match
-- profiles.role. All three counts must be zero.
select
  count(*) filter (where x.active_primary_count <> 1) as bad_primary_count,
  count(*) filter (where x.primary_role is distinct from x.profile_role) as role_mismatch,
  count(*) filter (where x.active_assignment_count < 1) as no_active_assignment
from (
  select
    p.id,
    p.role as profile_role,
    count(pra.id) filter (where pra.removed_at is null) as active_assignment_count,
    count(pra.id) filter (
      where pra.removed_at is null and pra.is_primary
    ) as active_primary_count,
    (max(pra.role::text) filter (
      where pra.removed_at is null and pra.is_primary
    ))::public.user_role as primary_role
  from public.profiles p
  left join public.profile_role_assignments pra on pra.profile_id = p.id
  group by p.id, p.role
) x;

-- No duplicate active role or case-insensitive staff ID.
select profile_id, role, count(*)
from public.profile_role_assignments
where removed_at is null
group by profile_id, role
having count(*) > 1;

select lower(employee_or_staff_id), count(*)
from public.profiles
where employee_or_staff_id is not null
group by lower(employee_or_staff_id)
having count(*) > 1;

-- No assignment grants a role absent from the enum (should be structurally
-- impossible) and no orphan should exist.
select pra.*
from public.profile_role_assignments pra
left join public.profiles p on p.id = pra.profile_id
where p.id is null;

-- RLS and policy inventory.
select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_role_assignments',
    'warehouse_transfer_orders',
    'field_reports',
    'geo_locations'
  )
order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_role_assignments',
    'warehouse_transfer_orders',
    'field_reports',
    'geo_locations'
  )
order by tablename, policyname;

-- Must return zero rows for the reviewed operational tables.
select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('warehouse_transfer_orders', 'field_reports', 'geo_locations')
  and 'authenticated' = any(roles)
  and lower(regexp_replace(coalesce(qual, ''), '[()[:space:]]', '', 'g')) = 'true';

-- Function definer/search-path/ACL verification.
select
  p.oid::regprocedure as function_signature,
  p.prosecdef as security_definer,
  p.proconfig,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'can_read_warehouse_transfer',
    'can_manage_warehouse_transfer',
    'can_read_field_report',
    'can_write_field_report',
    'can_read_geo_location',
    'can_write_geo_location',
    'handle_new_user',
    'select_active_workforce_role',
    'replace_workforce_role_assignments'
  )
order by p.oid::regprocedure::text;

-- Table privileges must match the revised explicit ACL design.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profile_role_assignments'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

-- Profile update policies must remain absent.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
  and cmd in ('UPDATE', 'ALL');

rollback;
```

### Mandatory post-migration behavior tests

Use dedicated, already-approved staging identities. Do not create users as part
of the migration run. Supply UUIDs through psql variables:

```sql
-- Example invocation:
-- psql "$APPROVED_DATABASE_URL" \
--   -v inactive_user_id='<uuid>' \
--   -v missing_profile_user_id='<uuid>' \
--   -v multi_role_user_id='<uuid>' \
--   -v unassigned_role='auditor' \
--   -f workforce_postflight.sql

begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'inactive_user_id', 'role', 'authenticated')::text,
  true
);

-- Every query must return zero rows; add every operational table to the final
-- restrictive-policy contract, not only these examples.
select * from public.warehouse_transfer_orders limit 1;
select * from public.field_reports limit 1;
select * from public.geo_locations limit 1;
select * from public.operational_submissions limit 1;
select * from public.workflow_actions limit 1;
select * from public.workflow_comments limit 1;
select * from public.workflow_assignments limit 1;
select * from public.workflow_notifications limit 1;
rollback;

begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'missing_profile_user_id', 'role', 'authenticated')::text,
  true
);
select * from public.warehouse_transfer_orders limit 1;
select * from public.field_reports limit 1;
select * from public.geo_locations limit 1;
select * from public.operational_submissions limit 1;
rollback;

begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'multi_role_user_id', 'role', 'authenticated')::text,
  true
);

-- Must fail and leave the primary role unchanged.
select public.select_active_workforce_role(
  :'unassigned_role'::public.user_role,
  'postflight-unassigned-role'
);
rollback;

-- Run as an ordinary authenticated database role. Must fail with permission
-- denied before the function body executes.
begin;
set local role authenticated;
select public.replace_workforce_role_assignments(
  :'multi_role_user_id'::uuid,
  array['auditor']::public.user_role[],
  'auditor'::public.user_role,
  :'multi_role_user_id'::uuid,
  'postflight-forbidden-rpc'
);
rollback;
```

The existing `supabase/tests/rc1_rls_policy_contract.sql` should also be run in
the approved disposable environment after application. A new SQL contract must
be added for lifecycle denial, function ACL/search-path assertions, assignment
invariants, invalid RPC inputs, and protected profile updates before this gate
can change to GO.

## 12. Whether either migration requires revision

**Yes. Both require revision.**

`20260729220000` requires:

- Hardened `SECURITY DEFINER` search paths.
- Officer-county validation in DAO field-report reads.
- An explicit, approved statement or schema change for county-level DAO
  warehouse access.
- Contract assertions for function ACLs and inactive/missing-profile behavior.

`20260729230000` requires:

- A complete existing-user compatibility strategy for null organization and
  required geography.
- Universal database-enforced inactive/missing-profile denial.
- Null/missing actor, target, primary-role, null-element, and duplicate-array
  validation in assignment replacement.
- Narrower assignment-history read policy and explicit table privileges.
- Honest backfill provenance.
- Lifecycle consistency enforcement.
- Hardened definer search paths.
- Exactly-once/partial-failure semantics and a complete rollback plan.
- A database contract proving explicit assignments remain synchronized with the
  active role consumed by RLS.

## 13. Whether remote application is safe with operator approval

**No.**

The migrations are not safe to apply merely because an operator approves the
command. Approval can authorize a reviewed deployment; it cannot compensate for
unresolved authorization defects or unknown existing-user compatibility.

Remote application becomes eligible for a new GO/NO-GO review only after:

1. Both SQL files are revised.
2. Static contracts cover the findings above.
3. The approved environment passes every read-only preflight query.
4. Any current profile remediation is explicitly approved and separately
   executed; it must not be hidden inside a generic role backfill.
5. The dry run contains exactly the two revised migrations.
6. Disposable/staging postflight RLS tests pass as ordinary authenticated,
   inactive, missing-profile, multi-role, auditor, geography-bound, warehouse,
   and service-role callers.

Until then, the blunt recommendation is **NO-GO**.
