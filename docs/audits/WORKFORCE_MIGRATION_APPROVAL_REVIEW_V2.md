# Workforce Migration Approval Review V2

Review date: 2026-07-29  
Repository: `/Users/mo/Desktop/Agriculture Pilot Liberia/agritrace`  
Branch: `audit/rc1-360-agentic-qa`  
Baseline HEAD: `ece311a66ae372017aeea0679ecad2ada1435d2f`

Reviewed migrations:

1. `20260729220000_rc1_geography_rls_hardening.sql`
2. `20260729230000_workforce_identity_provisioning.sql`

Scope completed: line-by-line static review, aggregate/no-PII remote
preflight, application contract reconciliation, and local build/test gates.
No migration was applied. No Auth setting, identity, password, invitation,
profile, or operational row was changed remotely.

## 1. Final migration verdict

**NO-GO TO APPLY NOW.**

The earlier SQL design blockers are remediated in the working tree. The
remaining blockers are external approval inputs, not permission to weaken the
SQL:

1. Project ref `tkblfaqaaoyadjnyhyiz`, named `MOA Farm Traceability`, has not
   been proven to be the approved staging environment.
2. All four active legacy profiles require an identity-owner-approved bootstrap
   manifest. Current aggregate inspection establishes their shapes but not
   their authorization provenance.
3. The local Supabase CLI credential is invalid, so remote migration history
   and the required dry run cannot currently be retrieved.

Do not apply either migration until all three are closed. The migration itself
will reject a populated target without the manifest.

Conditional verdict after closure: **GO TO APPLY IN STAGING**, using the exact
commands and manifest procedure in section 10, followed immediately by every
query in section 11. This is not approval for production.

## 2. Objects created or altered

### Migration `20260729220000`

| Lines | Object/action | Verdict |
| --- | --- | --- |
| 5–119 | Transfer read/manage helpers and ACLs | Caller-bound, active-profile, warehouse/county/requester scoped; safe `pg_catalog` search path; explicit ACL reset |
| 121–164 | Transfer policies | Replaces unconditional read and broad write with command-specific select/insert/update/delete policies |
| 166–264 | Field-report helpers and ACLs | Preserves officer attribution; DAO scope now checks both officer county and district |
| 266–283 | Field-report policies | Read and insert only; no row rewrite |
| 285–386 | Geo helpers and ACLs | Scope resolves through the existing farmer, registrar, organization, county, and district |
| 388–405 | Geo policies | Read and insert only; no row rewrite |

### Migration `20260729230000`

| Lines | Object/action | Verdict |
| --- | --- | --- |
| 9–216 | Transaction, partial-application guard, temporary bootstrap manifest, and legacy validation | Exactly-once and fail-before-persistent-DDL; exact role match; Auth link, lifecycle, prerequisites, county/district, evidence, and deadline checks |
| 218–318 | Profile lifecycle columns, backfill, constraints, and indexes | Additive; current active/inactive state preserved; drift made impossible |
| 321–365 | `workforce_role_catalog` | All 18 enum roles represented with explicit prerequisites and admin/read-only flags |
| 367–437 | Assignment and transition ledgers plus indexes | Append-preserving role history, provenance, at-most-one current role/primary constraints, authorization lookup support |
| 440–506 | Approved legacy transition writes | Only manifest-approved active profiles receive current grants; inactive profiles receive no operational grant |
| 509–829 | Canonical identity/scope predicates and ACLs | Exactly one current primary, role match, lifecycle, transition, expiry, catalog, and prerequisites are mandatory |
| 831–961 | Profile triggers and fail-closed Auth trigger | Protected fields blocked from direct application-role mutation; signup ignores role metadata and creates inactive/incomplete access |
| 963–1057 | Active-role selector | Caller-bound; can select only a current, unexpired explicit grant; increments authorization version and audits |
| 1059–1349 | Service-only role/warehouse replacement | Validates actor, target, set shape, privilege boundary, last super admin, optimistic version, warehouses, prerequisites, history, and audit |
| 1354–1413 | Identity RLS/table privileges and profile revokes | Authenticated identity tables are read-only through narrow policies; `profiles` writes revoked |
| 1416–1472 | Pilot policy replacement | Removes all remaining operational `authenticated USING (true)` policies |
| 1474–1539 | Restrictive operational identity guard | Existing permissive policies are ANDed with canonical active identity for every known operational table |
| 1541–1551 | Rollback guidance and commit | Explicitly forward-only; failed execution rolls back the migration transaction |

Created:

- 13 additive profile fields and four profile constraints;
- `workforce_role_catalog`;
- `profile_role_assignments`;
- `workforce_identity_transitions`;
- six identity/history indexes;
- canonical access, prerequisite, role, scope, lifecycle, selector, and
  replacement functions;
- three profile triggers;
- identity-table policies;
- one restrictive `workforce_identity_required` policy on each present
  operational table.

Altered:

- existing profile lifecycle values and authorization version;
- existing role/scope helper bodies and ACLs;
- signup trigger function behavior;
- transfer, field-report, geo, and pilot RLS;
- authenticated table privileges on profiles and the new identity tables.

## 3. Existing-data impact

There is no `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or migration-time
operational `DELETE`.

The service-only replacement function contains a deliberate
`warehouse_assignments` delete-and-reinsert operation. It executes only when an
administrator explicitly supplies a replacement warehouse UUID array; it is
not executed by the migration.

Migration-time row writes are limited to:

- lifecycle, transition, timestamps, and `authorization_version` on profiles;
- role-catalog seed rows;
- one approved primary assignment per active manifest profile;
- one transition-ledger row per existing profile.

The preflight observed:

- 4 organizations, 4 warehouses, 16 stock rows;
- 50 farmers, 50 plots, 20 lots, 34 movements;
- 45 rice records, 3 field reports, and 1 geo row;
- no workflow, transfer-order, or pilot intelligence rows;
- zero non-canonical profile counties or district/county pairs.

No operational UUID, attribution FK, organization, geography, warehouse,
farmer, plot, lot, movement, report, or audit row is rewritten.

## 4. Existing-user impact

Observed identity shape:

- 5 Auth identities;
- 4 profiles, all active and email-confirmed;
- 1 Auth identity missing a profile;
- 0 profiles missing Auth;
- 0 banned identities;
- 0 active profiles carrying `deactivated_at`;
- roles: one each of `ministry_officer`, `exporter`,
  `cooperative_manager`, and `field_agent`;
- all four have organization and county prerequisites;
- none requires district under the new catalog.

The migration does not change any approved profile role and does not deactivate
an active profile. It refuses to run unless every active profile is present in
the manifest with the exact existing role. Therefore:

- no existing user receives elevated access;
- no unapproved existing role is legitimized;
- inactive profiles remain inactive and receive no assignment;
- the one missing-profile Auth identity remains denied;
- active users become operational only when their exact legacy role is
  explicitly approved.

The four demo-like pattern matches are not used as evidence. Their human owner,
individual-control status, and continued need remain an identity-owner
decision.

## 5. RLS changes

Migration `220000` narrows transfers, field reports, and geo locations.
Migration `230000` then makes explicit assignment state authoritative across
the database.

The restrictive operational policy means an existing permissive policy cannot
authorize:

- an inactive or suspended profile;
- an invited or incomplete profile;
- a transition-incomplete profile;
- an Auth identity missing a profile;
- a profile missing an assignment;
- a role/profile mismatch;
- zero or multiple usable primaries;
- a disabled, not-started, ended, or expired role;
- a role missing organization/geography/clan/warehouse prerequisites.

The historical unconditional policies on transfer orders and the three pilot
tables are explicitly dropped and replaced. Neither reviewed migration creates
`authenticated USING (true)`.

Profile self-read remains available so an incomplete identity can receive a
clear access state. That read does not confer operational access. Profile
update policies are removed and update privilege is revoked.

## 6. Function security

All reviewed `SECURITY DEFINER` functions set `search_path = pg_catalog` and
fully qualify application/Auth objects.

ACL behavior:

- subject-parameter access helpers: no explicit execute grant to application
  roles or `service_role`;
- caller-bound access/scope helpers: execute only for `authenticated` and
  `service_role`;
- active-role selector: execute for `authenticated` and `service_role`;
- assignment replacement: execute only for `service_role`;
- signup/trigger functions: no direct execute grant.

Every ACL block first revokes from `PUBLIC`, `anon`, `authenticated`, and
`service_role`, then adds only intended grants.

The service-only replacement RPC accepts an actor UUID because a service-role
JWT has no human `auth.uid()`. It does not trust the input blindly: it locks and
re-verifies that actor's complete, active, current administrator identity.
The API derives the UUID from its authenticated request guard, never request
JSON.

## 7. Role-assignment behavior

- Role history is append-preserving: old grants receive `ended_at`/`ended_by`.
- At most one current row exists for a profile/role.
- At most one current primary exists.
- Operational access additionally requires exactly one usable primary.
- The primary assignment must equal `profiles.role`.
- Assignment expiry is evaluated at statement time.
- `authorization_version` provides optimistic concurrency.
- Duplicate, empty, null-containing, disabled, or primary-mismatched sets fail.
- `super_admin`/`admin` delegation requires a current `super_admin`.
- `ministry_admin` delegation requires `super_admin` or `admin`.
- Self-role mutation fails.
- Demotion/deactivation of the last viable `super_admin` fails.
- Warehouse-manager grants require a canonical same-county warehouse
  assignment.
- Active-role switching only selects an already granted usable role and cannot
  alter expiry, scope, warehouses, or the grant set.

## 8. Migration dependencies

Required order is correct:

1. `20260729220000` relies on baseline tables, role enum labels,
   warehouse assignments, and current profile helper functions.
2. `20260729230000` relies on `220000` policy names and all earlier workflow,
   pilot, hierarchy-role, and transfer migrations; it replaces shared helpers
   after the geography policy hardening.

The app revision depends on `230000` because it no longer falls back to
`profiles.role` when the assignment schema is absent. Deploy order is:

1. approved database backup/restore point;
2. both migrations;
3. post-migration SQL verification;
4. revised app deployment;
5. authenticated QA.

Do not deploy the revised app first.

The local CLI is v2.98.2 and reports v2.110.0 available. Tool upgrade is not
required by the SQL, but operators must use one pinned/recorded version through
dry run and application.

## 9. Rollback risks

`220000` is repeatable at the object-definition level, but migration history
still treats it as exactly once. Reverting it would restore known over-broad
policies and is not recommended.

`230000` is intentionally exactly once:

- partial/prior objects cause a hard failure;
- the migration is wrapped in `BEGIN/COMMIT`;
- a failure inside `230000` rolls back its persistent changes;
- Supabase may commit `220000` before starting `230000`, so a manifest failure
  can leave the safer geography policies applied while identity remains
  unapplied. Do not deploy the revised app in that state.

Destructive rollback is unsafe because assignment and transition tables become
the authorization ledger. The recovery path is a forward compatibility
migration that retains:

- fail-closed signup;
- restrictive active identity;
- assignment/transition history;
- profile lifecycle constraints.

Before application, obtain a restorable staging backup or approved restore
point. The repository still has no approved disposable restore target for the
separate restore drill; that blocks release promotion, even though it need not
block an explicitly backed-up staging migration.

## 10. Exact application commands

These commands are **for the approved staging operator only after the NO-GO
conditions close**. They must not be run against the currently linked project
until its environment classification is confirmed.

```bash
cd "/Users/mo/Desktop/Agriculture Pilot Liberia/agritrace"

git switch audit/rc1-360-agentic-qa
git rev-parse HEAD
git status --short

export SUPABASE_ACCESS_TOKEN="<approved-operator-access-token>"
supabase projects list
supabase link --project-ref "<approved-staging-project-ref>"
supabase migration list --linked

npm run audit:workforce:preflight

export WORKFORCE_BOOTSTRAP_MANIFEST='<compact-approved-json-array-with-no-spaces>'
jq -e '
  type == "array"
  and all(.[];
    (.profile_id | type == "string")
    and (.role | type == "string")
    and (.decision == "verified" or .decision == "temporary_admin")
    and (.evidence_ref | type == "string" and length > 0)
    and (.reviewed_by | type == "string" and length > 0)
  )
' <<<"$WORKFORCE_BOOTSTRAP_MANIFEST"

PGOPTIONS="-c app.workforce_bootstrap_manifest=$WORKFORCE_BOOTSTRAP_MANIFEST" \
  supabase db push --linked --dry-run
```

The operator records the dry-run output and confirms it lists only:

```text
20260729220000_rc1_geography_rls_hardening.sql
20260729230000_workforce_identity_provisioning.sql
```

After a final explicit staging change approval:

```bash
PGOPTIONS="-c app.workforce_bootstrap_manifest=$WORKFORCE_BOOTSTRAP_MANIFEST" \
  supabase db push --linked

supabase migration list --linked
unset WORKFORCE_BOOTSTRAP_MANIFEST
unset SUPABASE_ACCESS_TOKEN
```

If the operator cannot prove that the CLI connection propagated `PGOPTIONS`,
stop. Do not edit out the manifest guard. Use an approved direct PostgreSQL
session mechanism that sets the same transaction/session GUC and record the
method in the change ticket.

## 11. Exact post-migration verification queries

Run as a read-only database verifier immediately after application.

```sql
-- A. Migration history and object presence
select version, name
from supabase_migrations.schema_migrations
where version in ('20260729220000', '20260729230000')
order by version;

select
  to_regclass('public.workforce_role_catalog') as role_catalog,
  to_regclass('public.profile_role_assignments') as role_assignments,
  to_regclass('public.workforce_identity_transitions') as transitions;

-- B. Lifecycle and Auth linkage
select count(*) as lifecycle_drift
from public.profiles
where
  (is_active and (
    account_status <> 'active'
    or deactivated_at is not null
    or suspended_at is not null
  ))
  or
  (not is_active and account_status = 'active')
  or
  (account_status = 'suspended') <> (suspended_at is not null);

select count(*) as auth_users_missing_profile
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

select count(*) as profiles_missing_auth_user
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- C. Assignment invariants
select profile_id, count(*) as current_primary_count
from public.profile_role_assignments
where is_primary and ended_at is null
group by profile_id
having count(*) <> 1;

select p.id
from public.profiles p
where p.is_active
  and not exists (
    select 1
    from public.profile_role_assignments a
    where a.profile_id = p.id
      and a.role = p.role
      and a.is_primary
      and a.ended_at is null
      and a.starts_at <= statement_timestamp()
      and (a.expires_at is null or a.expires_at > statement_timestamp())
  );

select profile_id, role, count(*) as duplicate_current_grants
from public.profile_role_assignments
where ended_at is null
group by profile_id, role
having count(*) > 1;

select p.id, p.role
from public.profiles p
where p.is_active
  and not public.workforce_role_prerequisites_met(p.id, p.role);

select count(*) as unapproved_legacy_assignment
from public.profile_role_assignments
where provenance in (
  'legacy_profile_role_verified',
  'legacy_profile_role_temporary'
)
and nullif(btrim(evidence_ref), '') is null;

-- D. Transition deadlines
select profile_id, deadline_at
from public.workforce_identity_transitions
where status = 'review_required'
  and (deadline_at is null or deadline_at <= statement_timestamp());

-- E. Function search paths
select
  n.nspname as schema_name,
  p.proname,
  p.prosecdef,
  p.proconfig
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
    'workforce_role_prerequisites_met',
    'workforce_subject_has_access',
    'has_active_workforce_access',
    'has_workforce_admin_access',
    'profile_role',
    'profile_county',
    'profile_district',
    'is_ministry_wide',
    'wf_is_ministry',
    'wf_is_reviewer',
    'wf_can_create',
    'wf_county_in_scope',
    'handle_new_user',
    'select_active_workforce_role',
    'replace_workforce_role_assignments',
    'guard_last_viable_super_admin'
  )
order by p.proname;

-- Every SECURITY DEFINER row above must contain search_path=pg_catalog.

-- F. ACL verification
select
  has_function_privilege(
    'authenticated',
    'public.replace_workforce_role_assignments(uuid,public.user_role[],public.user_role,uuid,text,bigint,uuid[])',
    'EXECUTE'
  ) as authenticated_can_replace_roles,
  has_function_privilege(
    'anon',
    'public.replace_workforce_role_assignments(uuid,public.user_role[],public.user_role,uuid,text,bigint,uuid[])',
    'EXECUTE'
  ) as anon_can_replace_roles,
  has_function_privilege(
    'service_role',
    'public.replace_workforce_role_assignments(uuid,public.user_role[],public.user_role,uuid,text,bigint,uuid[])',
    'EXECUTE'
  ) as service_role_can_replace_roles;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profiles',
    'workforce_role_catalog',
    'profile_role_assignments',
    'workforce_identity_transitions'
  )
order by table_name, grantee, privilege_type;

-- Expected: authenticated replacement=false, anon=false, service_role=true.
-- Expected: authenticated has no INSERT/UPDATE/DELETE on profiles or identity tables.

-- G. RLS coverage and unconditional policy check
select tablename
from pg_policies
where schemaname = 'public'
  and policyname = 'workforce_identity_required'
order by tablename;

select schemaname, tablename, policyname, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and 'authenticated' = any(roles)
  and (
    regexp_replace(coalesce(qual, ''), '[[:space:]()]', '', 'g') = 'true'
    or regexp_replace(coalesce(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
  );

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_role_assignments',
    'workforce_identity_transitions',
    'warehouse_transfer_orders',
    'field_reports',
    'geo_locations',
    'operational_submissions',
    'workflow_actions',
    'workflow_comments',
    'workflow_assignments',
    'workflow_notifications'
  )
order by tablename;

-- H. Index presence
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'profiles_employee_or_staff_id_unique',
    'profiles_authorization_lookup',
    'profile_role_assignments_one_current_role',
    'profile_role_assignments_one_current_primary',
    'profile_role_assignments_authorization_lookup',
    'profile_role_assignments_history_lookup',
    'workforce_identity_transitions_status_lookup'
  )
order by indexname;

-- I. Signup definition does not trust role metadata
select pg_get_functiondef(
  'public.handle_new_user()'::regprocedure
);

-- J. Aggregate existing-data preservation
select
  (select count(*) from public.farmers) as farmers,
  (select count(*) from public.plots) as plots,
  (select count(*) from public.lots) as lots,
  (select count(*) from public.movements) as movements,
  (select count(*) from public.rice_production_records) as rice_records,
  (select count(*) from public.field_reports) as field_reports,
  (select count(*) from public.geo_locations) as geo_locations;
```

Expected zero-row/zero-count results:

- lifecycle drift;
- profiles missing Auth;
- active profiles missing matching current primary;
- duplicate current grants;
- prerequisite failures;
- legacy grants missing evidence;
- overdue transition reviews;
- unconditional authenticated policies.

`auth_users_missing_profile` is currently expected to remain `1` until the
identity owner resolves that identity separately.

## 12. Does either migration require revision?

- `20260729220000`: **no further technical revision identified**.
- `20260729230000`: **no further static technical revision identified**.

`230000` requires a session bootstrap manifest, not a source-code role mapping.
Do not commit environment-specific UUIDs to the migration.

Because the user prohibited migration application during this review, SQL
execution against PostgreSQL was not performed. The first approved staging run
must therefore treat any PostgreSQL execution error as a stop/rollback event,
not permission for ad hoc SQL edits.

## 13. Is remote application safe with operator approval?

**Not with a generic approval.**

It is safe to attempt only after all of these specific approvals/evidence exist:

- exact project ref confirmed as approved staging;
- restorable staging backup/restore point confirmed;
- valid CLI/operator credential;
- four-entry identity-owner-approved manifest;
- recorded dry run listing exactly the two migrations;
- operator acceptance that `220000` may remain applied if `230000` rejects its
  manifest in the next migration transaction;
- post-migration verifier and rollback owner present.

Until then, the blunt recommendation is:

**NO-GO — DO NOT APPLY THE TWO MIGRATIONS TO THE CURRENTLY LINKED SUPABASE
ENVIRONMENT.**

## Appendix: local gate evidence

| Gate | Result |
| --- | --- |
| `npm run test:rls:rc1` | PASS |
| `npm run test:identity:rc1` | PASS |
| `npm run test:private:rc1` | PASS |
| `npm run test:workflow` | PASS — 29 workflow + 17 security checks |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — 135 routes built |
| `git diff --check` | PASS |
| Local production runtime `/` | PASS — 307 to `/login` |
| Local production runtime `/setup` | PASS — 404 |
| Local production runtime `/about` | PASS — 404 |
| Local production runtime `/api/demo-inquiry` | PASS — 404 |
| Local production runtime `/command-center` unauthenticated | PASS — 307 to login |

The build and runtime smoke used local code only. They did not apply a migration
or mutate Supabase.
