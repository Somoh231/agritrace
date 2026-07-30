# AgriVault Workforce Identity Contract

Status: RC1 controlled-pilot contract  
Date: 2026-07-29

## Authority model

An Auth identity alone has no operational authority. Operational access exists
only when all of these facts are true at the same time:

1. `auth.uid()` resolves to exactly one `profiles` row.
2. `profiles.is_active = true`.
3. `profiles.account_status = 'active'`.
4. `profiles.access_transition_status = 'complete'`.
5. The profile is neither suspended nor deactivated.
6. Exactly one current, started, unexpired role assignment is primary.
7. That assignment's role exactly matches `profiles.role`.
8. The role exists and is enabled in `workforce_role_catalog`.
9. All catalog-declared organization, geography, clan, and warehouse
   prerequisites are satisfied.

The database function `has_active_workforce_access()` is the canonical
caller-bound predicate. Existing policy helpers (`profile_role`,
`profile_county`, `profile_district`, and the workflow helpers) return authority
only through that predicate.

This is intentionally redundant: `profiles.role` is the selected workspace,
while `profile_role_assignments` is the grant ledger. A mismatch denies access;
it never chooses the more privileged value.

## Signup and invitation

Public signup metadata is not trusted for roles, geography, organization,
activation, or assignment. `handle_new_user()` creates or links only an
inactive, incomplete profile with no role-assignment row.

Invitations are issued through the administrator server route using Supabase
Auth's supported admin invitation API. The service key is server-only. The
administrator route must:

1. authenticate the human actor;
2. confirm their current canonical administrator authority;
3. validate role prerequisites;
4. invite the work email;
5. populate the inactive/invited profile;
6. call the service-role-only assignment function with the authenticated
   actor's UUID and an audit request ID;
7. activate only through an explicit administrator decision.

An Auth user missing a profile, an invited profile, and an incomplete profile
all remain operationally denied.

## Role assignments

Assignments are append-only history. Removal sets `ended_at` and `ended_by`;
it does not delete the prior grant. Current uniqueness is enforced by partial
indexes:

- at most one current row per profile and role;
- at most one current primary row per profile.

The access predicate additionally requires exactly one usable current primary.
Zero primaries therefore fails closed.

Every assignment carries provenance. Accepted values are:

- `legacy_profile_role_verified`
- `legacy_profile_role_temporary`
- `admin_assigned`
- `invitation_provisioned`
- `system_recovery`

Legacy state is never silently relabelled as self-assigned.

## Active-role switching

`select_active_workforce_role()` is callable by an authenticated user only. It
can select only a role already granted to that same user, current, unexpired,
enabled, and prerequisite-complete. It updates the primary marker and
`profiles.role` in one transaction and increments `authorization_version`.

Role switching cannot add a role, extend an expiry, alter profile scope, or
write a warehouse assignment.

## Role administration

`replace_workforce_role_assignments()` is callable only by `service_role`.
Ordinary authenticated users have no execute privilege. The function:

- rejects null/missing actor or target records;
- independently verifies the actor's current canonical administrator access;
- rejects self-modification;
- rejects null, empty, duplicate, disabled, or primary-mismatched role sets;
- enforces administrator delegation boundaries;
- protects the last viable `super_admin`;
- supports optimistic concurrency through `authorization_version`;
- validates and, when supplied, atomically replaces warehouse assignments;
- validates every requested role prerequisite;
- closes old grants and appends new grants;
- synchronizes the selected role and primary assignment;
- records the change in `audit_log`.

The actor UUID is an audit input because a service-role JWT has no human
`auth.uid()`. The server route must derive it from the authenticated request;
it may never accept it from request JSON.

## Protected profile fields

Authenticated table privileges do not include `INSERT`, `UPDATE`, or `DELETE`
on `profiles`. Existing profile update policies are removed. A trigger also
rejects direct `anon` or `authenticated` changes to role, organization,
geography, workforce metadata, lifecycle, transition, suspension, provisioning,
and authorization-version fields.

## Inactive and transition identities

Inactive, suspended, incomplete, invited, expired, missing-profile, and
assignment-less identities are denied by a restrictive RLS policy added to
every known operational table. Direct predicates such as
`actor_id = auth.uid()` cannot bypass it.

An explicitly approved temporary legacy administrator may access only the
identity-administration surface through `has_workforce_admin_access()`. That
exception:

- is restricted to existing `super_admin`, `admin`, or `ministry_admin` roles;
- requires an exact role match and explicit evidence;
- expires within seven days;
- does not satisfy operational RLS;
- is closed when assignments are replaced and the transition is recorded.

## Geographic and warehouse compatibility

County comparisons are case-insensitive but require a canonical county name.
District-scoped roles require a district that belongs to the profile county.
The DAO field-report policy also verifies the attributed officer's county.

Warehouse managers require at least one warehouse assignment in their profile
county. Existing warehouse assignments are preserved unless an administrator
explicitly supplies a replacement set.

## Security-definer rules

Every new or replaced `SECURITY DEFINER` function fixes `search_path` to
`pg_catalog` and fully qualifies application and Auth objects. Function ACLs
are reset from `PUBLIC`, `anon`, `authenticated`, and `service_role` before the
minimum execute grants are applied.

Subject-parameter authorization helpers are private to the function owner.
Application callers receive only `auth.uid()`-bound wrappers.

