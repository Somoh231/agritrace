# RC1 Workforce Identity and Provisioning

Last updated: 2026-07-29

## Decision

AgriVault uses one identity system: Supabase Auth plus the linked operational
profile and RLS model. Shared role accounts and unrestricted public registration
are not part of the workforce design. The implementation is committed locally,
but its schema migration is intentionally unapplied pending staging approval.

## Existing schema findings

- `auth.users.id` already equals `profiles.id`; no duplicate `auth_user_id` is required.
- Existing profile identity, organization, county, district, active-state, and
  historical timestamp fields are reused.
- Existing `organizations`, `counties`, `districts`, `warehouse_assignments`,
  and `audit_log` tables are reused.
- The prior Auth trigger trusted user-supplied role metadata and defaulted
  unknown users to an active `field_agent`.
- The former `profiles_self_update` policy allowed a user to update mutable
  profile columns, including role and status.
- `profiles.role` remains the explicit primary/active role because current RLS
  and route policies consume it.

## New schema

Migration `20260729230000_workforce_identity_provisioning.sql` adds staff ID,
job title, department, clan/field area, lifecycle status, invitation/activation
timestamps, `updated_at`, and `provisioned_by`. It adds
`profile_role_assignments`, one-primary-role and staff-ID indexes, assignment
RLS, transactional role replacement, assigned-role selection, a fail-closed
Auth trigger, and profile timestamp maintenance.

The migration removes self-service profile updates. New Auth identities begin
inactive and incomplete with no explicit role assignment. Rollback requires
exporting role history and removing application references first; active
default-role signup must never be restored.

## Provisioning workflow

1. An authorized `super_admin`, `admin`, or `ministry_admin` opens Users & Roles.
2. The server verifies the session, active profile, permission, rate limit, and request ID.
3. It normalizes the email, rejects duplicates, validates organization and
   geography, and checks role-assignment privilege.
4. Supabase sends an invitation to `/auth/complete?mode=invite`.
5. The server completes the linked profile and explicit role assignments.
6. Account, invitation, profile, role, and scope events enter `audit_log`.
7. If persistence fails after Auth creation, the new Auth identity is deleted
   and the failure is recorded without exposing provider details.
8. The user chooses a private password and activation revalidates completeness.

Only `super_admin` may assign `super_admin` or `admin`. `super_admin` or `admin`
is required to assign `ministry_admin`. Administrators cannot alter their own
roles or activation state through this workflow.

## Sign-in and role selection

Authentication alone is insufficient. Login, middleware, API/report guards, and
workflow mutation guards require an active linked profile, lifecycle state
`active`, an explicit primary role among active assignments, organization or
Ministry-unit assignment, and required county/district/clan scope.

Failures use the approved inactive, incomplete-profile, and no-authorized-role
messages and sign the browser out. Multiple-role users select only from their
database assignments at `/workspace/select`; selection transactionally updates
the primary role used by RLS/routing and records an audit event.

## Invitation, recovery, and deactivation

- Supabase sends setup and recovery links. No temporary password is created,
  returned, emailed by AgriVault, or stored in application tables.
- Password completion occurs at `/auth/complete`; expired links fail clearly.
- Administrators can resend an invited user's setup link or initiate recovery.
- The client never receives password hashes, generated links, service-role
  credentials, or raw provider errors.
- Deactivation immediately blocks application access, preserves all historical
  attribution, and applies an Auth ban to block sign-in/refresh.
- Reactivation validates the complete profile, lifts the ban, and records the event.

## Supabase Auth configuration checklist

| Setting | Required state |
| --- | --- |
| Site URL | Exact approved environment origin |
| Allowed redirects | Exact invite/recovery completion URLs; no broad wildcard |
| Invitation redirect | `/auth/complete?mode=invite` |
| Recovery redirect | `/auth/complete?mode=recovery` |
| SMTP/provider | Branded TLS provider with bounce/complaint monitoring |
| Email confirmation | Invitation verifies the address before activation |
| Sessions | Short admin access token, refresh rotation, documented values |
| Rate limits | Login, email link, OTP, and recovery limits reviewed |
| CAPTCHA | Enable where anonymous abuse risk warrants; public signup stays disabled |
| Leaked-password protection | Enable where supported |
| Administrator MFA | Required readiness item before production |

No production Auth setting was changed.

## QA account plan

After an explicit staging approval, create unique QA CLAN A/B, DAO A/B, CAC
A/B, Ministry, Warehouse, Auditor, Donor Observer, Data Administrator, System
Administrator, and Exporter identities. Use `QA geography A` and `QA geography
B`, unique inboxes, and local/CI secrets only.

Test activation, invalid/expired links, duplicate invite, inactive/missing
profile, missing role/geography, multiple roles, provisioning denial, role
assignment/removal, deactivation, recovery, logout/session invalidation, direct
API denial, cross-geography isolation, and all audit events.

No QA accounts were created because no staging project was explicitly approved
for user creation and the workforce migration remains unapplied.
