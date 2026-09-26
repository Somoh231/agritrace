# ADR 0011 — Roles are assigned, never chosen

- **Status:** Proposed. The database change needs owner approval before it is applied.
- **Date:** 2026-09-26
- **Supersedes:** the role-from-metadata behaviour of `handle_new_user()` (migrations 20260207101000, 20260513120000)
- **Related:** ADR 0008 (role-based security)

## Context

AgriVault's policy is that nobody provisions themselves: administrators create or invite users and assign their role. The platform did not enforce that:

1. **Public email signup is enabled** on the production Supabase project (`disable_signup: false`, email provider on, confirmation required). Anyone holding the public anon key can register.
2. **`handle_new_user()` copies the role from signup metadata.** `options.data.role = "super_admin"` in a signup call produced an active `super_admin` profile.
3. **`profiles_self_update` has no column restriction** (`for update using (id = auth.uid())`, no `with check`), and `authenticated` holds `UPDATE` on `profiles`. Any signed-in user could `PATCH /rest/v1/profiles` to set their own `role` or re-activate themselves. `profiles_ministry_update` let ministry-wide roles do the same to anyone.
4. **`profile_role()`, `profile_county()` and `profile_district()` ignore `is_active`**, so a deactivated profile kept its role in the 100+ RLS policies built on them. (The newer `wf_*` helpers already check `is_active`.)
5. **The workspace preview cookie** changed the role the dashboard shell and three layouts used, and any user could set it to any role through `/api/workspace-demo-role`.
6. **Four shared demo identities** (published password) were active in production, one of them a `ministry_officer` with admin-console access.

Items 2–4 were reproduced against the repository's migration chain in a local Supabase Postgres (`npm run test:db:roles`, "before" phase).

## Decision

**Roles are assigned by administrators through the admin console (service role, audited). No request made with a user's own session can choose or change a role, activation or scope.**

### A. Auth setting (owner action)
Turn off *Allow new users to sign up* for the production project. Existing users, password reset and administrator-created or invited users are unaffected; the admin API ignores `disable_signup`.

### B. Database (proposal `supabase/proposals/20260926100000_harden_profile_role_assignment.sql`)
- `handle_new_user()` ignores metadata roles. Every new profile starts as `field_agent`, **inactive**, until an administrator assigns the role and activates it. A display name from metadata is still accepted.
- A `BEFORE UPDATE` trigger on `profiles` rejects changes to `id`, `role`, `is_active`, `deactivated_at`, `organization_id`, `county`, `district` or `email` when the request's JWT role is `authenticated` or `anon` (SQLSTATE `42501`). The service role and direct database operators are unaffected, and users can still edit their name and phone.
- `profile_role()`, `profile_county()` and `profile_district()` return nothing for inactive profiles.
- An `AFTER UPDATE` trigger writes `PROFILE_PRIVILEGE_CHANGE` to `audit_log` for every role, activation or scope change, including changes made outside the app. The admin console's own audit rows are kept.

No policy is dropped, no column is added, and existing profiles keep their role and status. A dedicated `pending` enum value was considered and rejected for now: it needs an enum migration plus application changes, while "inactive `field_agent`" already grants nothing at either layer (the application refuses inactive profiles, and with this change RLS does too).

### C. Application (this branch)
The preview cookie can only select a role the user holds (`assignedWorkspaceRoles`, today the single `profiles.role`). For single-role users it does nothing, the switcher is not rendered, and `POST /api/workspace-demo-role` returns 403 for any other role. Middleware, admin APIs and RLS never read the cookie.

### D. Demo identities (owner action)
`scripts/ops/disable-demo-identities.mjs` (dry run by default) deactivates, bans and rotates the password of each shared demo account and records it in `audit_log`. It does not delete them: 52 production rows reference those users.

## Consequences

- New accounts wait for an administrator to assign a role. Signup is off, so in practice accounts are created from the Supabase dashboard (*Add user / Invite*) and activated in the admin console. The app has no invite screen yet (follow-up).
- The seed scripts set `role` and `is_active` explicitly through the service role, so they are unaffected.
- **Follow-up:** the admin console lets any admin-console role (including `ministry_officer`) assign any role, including `super_admin`. It should be limited to roles at or below the actor's.
- **Follow-up:** `auth.sessions` cannot be listed with the available credentials, so session state is inferred from the ban and token expiry.

## Rollback

`supabase/proposals/20260926100000_harden_profile_role_assignment.rollback.sql` restores the three helper functions and `handle_new_user()` exactly as before and drops both triggers. Profiles are not modified. The Auth setting is re-enabled from the same dashboard toggle. The preview change is a code revert.

## Verification

- `npm run test:db:roles`: 30 checks across three phases (current migrations are vulnerable; with the proposal they are closed and existing users are untouched; after rollback the previous behaviour returns).
- `npm run test:auth`: unit checks, including forged preview cookies.
- `npm run test:e2e:auth`: route and API checks against a production build wired to a stub Supabase, including forged preview cookies.
