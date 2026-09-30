# Ministry stakeholder preview — read-only, staging, synthetic data

**Branch:** `preview/ministry-readiness` · **Status:** prepared, not activated. No stakeholder account exists and no invitation has been sent.

The preview lets one named Ministry reviewer look around the platform without being able to change anything. It has three properties, and each one is enforced independently:

| Property | How it is enforced | Proof |
|---|---|---|
| **Read-only** | Middleware refuses every non-GET request from the account (403). Workflow APIs refuse it again. Restrictive RLS policies refuse every INSERT, UPDATE and DELETE on every RLS table. The UI does not render mutation controls. | `npm run test:e2e:auth` (`ministry-preview-readonly.spec.ts`), `npm run test:db:preview`, `npm run test:auth` |
| **Staging-backed** | The `next.config.mjs` guard refuses to build a Vercel Preview unless `NEXT_PUBLIC_APP_ENV=staging` and the Supabase project is not production. The account script refuses any target other than the staging ref. | `npm run test:env`, `npm run test:auth` |
| **Synthetic data only** | The staging seed refuses to run without the staging marker, or when any non-synthetic farmer row is present. | `npm run test:db:preview` (seed section) |

The account is an ordinary `ministry_officer` profile with `profiles.preview_read_only = true`. No new role was created. The flag can only be changed by the service role; the profile guard trigger blocks the user from changing it themselves.

---

## 1. Capability matrix

| Area | ministry_officer (normal) | ministry_officer + `preview_read_only` |
|---|---|---|
| Command Center, Farmer Registry, farmer detail, GIS, verification queue and history, warehouse, inventory, transfers, reporting | view | **view** |
| Approve, reject, return, escalate or request corrections (verification, transfers, submissions) | per workflow rules | **refused** (403 in middleware and in the route; RLS) |
| Create, edit or delete farmers, plots, production, cooperatives or warehouses | yes, subject to RLS | **refused** (403; RLS) |
| Record receipts, stock movements or transfers | yes, subject to RLS | **refused** (403; RLS) |
| Field capture (register farmer, boundary, field report) | yes | **not offered**; refused if attempted |
| Change own role, scope, activation or preview flag | no (guard trigger) | no (guard trigger + RLS) |
| Admin console, user management, setup diagnostics | no (super_admin only) | no |
| Report exports (`POST /api/reports/rice`, `/api/reports/dds`) and page-view analytics | yes | yes (they render a file or record a page view; nothing else) |
| AI assistant | disabled platform-wide | disabled |

---

## 2. One-time staging setup (owner)

Nothing below has been done yet. Every step targets the **staging** project only.

1. **Create the staging project.** Follow `STAGING_ENVIRONMENT_PLAN.md` §3: `agrivault-staging`, signup off, redirect allowlist limited to `*.vercel.app` previews.
2. **Replay the schema.** Apply `supabase/migrations/*`, then the two proposals, in this order:
   - `20260926100000_harden_profile_role_assignment.sql`
   - `20260930100000_preview_read_only_and_scoped_writes.sql`

   The rollback files sit next to each proposal. The proposals are **not** applied to production and are not moved into `supabase/migrations/` until the owner approves them for production.
3. **Mark the database as staging.** Run this once, in the staging SQL editor only:
   ```sql
   create schema if not exists agrivault_env;
   revoke all on schema agrivault_env from public, anon, authenticated;
   create table if not exists agrivault_env.marker (environment text primary key check (environment = 'staging'));
   insert into agrivault_env.marker values ('staging') on conflict do nothing;
   ```
4. **Load the synthetic data.** Run `supabase/seed/preview-synthetic.sql` in the staging SQL editor. The script is idempotent. It refuses without the marker, and it refuses when any non-synthetic farmer row exists.
5. **Point Vercel Preview at staging.** Scope these variables to Preview only, or to the `preview/ministry-readiness` branch:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, all with **staging** values;
   - `NEXT_PUBLIC_APP_ENV=staging`;
   - `SUPABASE_PRODUCTION_PROJECT_REF` and `SUPABASE_STAGING_PROJECT_REF`.

   Leave the Production variables unchanged. `SUPABASE_PRODUCTION_PROJECT_REF` must also be added to Production before this branch is ever merged, because the guard requires it for production builds.
6. **Redeploy the branch.** The build log must show that the guard passed. The app shell must show "STAGING · SYNTHETIC DATA".

Until step 5 is done, every Preview build of this branch **fails at the guard**. That failure is the intended behaviour: a preview cannot silently fall back to the production project.

---

## 3. Preview accounts

All account work goes through `scripts/ops/preview-account.mjs`. The script:

- is a dry run by default;
- reads the env file named with `--env-file` (never `.env.local`);
- refuses unless that file targets the staging ref (`NEXT_PUBLIC_APP_ENV=staging`, staging ref ≠ production ref, URL = staging ref, service key from the same project, `PREVIEW_SITE_URL` https and not the public site);
- never prints keys or full email addresses;
- never handles passwords.

Put the staging values plus `PREVIEW_SITE_URL=<the branch preview URL>` in `.env.staging.local`. Env files are gitignored.

### Synthetic QA account (internal walkthroughs)

```bash
node scripts/ops/preview-account.mjs --env-file .env.staging.local --invite --email <owner-controlled address> --qa
```

This does not change anything; it is a dry run. When the plan looks right, re-run it with `--execute` and `CONFIRM_PREVIEW_ACCOUNT=invite-staging-preview-account` set. The account is labelled "Preview QA · synthetic".

### Stakeholder account (only after owner approval for that named person)

1. **Create and invite:**
   ```bash
   CONFIRM_PREVIEW_ACCOUNT=invite-staging-preview-account node scripts/ops/preview-account.mjs --env-file .env.staging.local --invite --email <their own address> --name "<Full name>" --execute
   ```
   - Supabase sends a real invite to that person's own mailbox. Shared or team mailboxes are refused.
   - `handle_new_user()` creates the profile **inactive**.
   - One update then sets `role=ministry_officer`, `preview_read_only=true` and `is_active=true`. There is never a moment where the account is active without the read-only flag.
   - The script writes a `PREVIEW_ACCOUNT_INVITED` audit row.
2. **Activation:** the person opens the invite, which goes to `/auth/callback` and then `/auth/set-password`, and chooses their own password. Nobody else ever knows it, and no credentials are shared.
3. **Check:** `--status` lists the preview accounts with masked emails. The account should read `ministry_officer active read-only`.
4. **Revoke** (at the end of the review, or at any time):
   ```bash
   CONFIRM_PREVIEW_ACCOUNT=revoke-staging-preview-account node scripts/ops/preview-account.mjs --env-file .env.staging.local --revoke --email <their address> --execute
   ```
   - The profile is set inactive. Middleware refuses the account on its next request.
   - The Auth identity is banned, so the person cannot sign in or refresh a token.
   - The script writes a `PREVIEW_ACCOUNT_REVOKED` audit row.
   - Nothing is deleted. To restore access, re-invite the person deliberately.

---

## 4. Synthetic data inventory (`supabase/seed/preview-synthetic.sql`)

| Table | Rows | Content |
|---|---|---|
| farmers | 24 | "Sample farmer 01–24"; `SMP-F-001…024`; phones `+231 000 000 001…024` (not dialable); Nimba, Bong and Lofa only; "Sample district A/B"; notes "Illustrative preview record — not a real farmer." |
| plots | 24 | Rice; small square outlines at illustrative points within the three counties |
| rice_production_records | 24 | Illustrative yields and losses for the current period. The UI shows "Pilot validation period", never a season name. |
| warehouses | 3 | "Sample warehouse A · Nimba / B · Bong / C · Lofa" (`SMP-WH-A/B/C`) |
| inventory_items | 3 | Sample rice seed, urea and NPK (`SMP-*` SKUs) |
| warehouse_stock | 9 | `SMP-BATCH-*` |
| inventory_movements | 6 | Receipts, transfers, distributions and one loss (`SMP-MV-*`) |
| warehouse_transfer_orders | 3 | Delivered, in transit and requested (`SMP-TR-*`) |
| operational_submissions | 8 | One per workflow stage, from submitted to ministry-approved, plus one "corrections requested" (`SMP-SUB-*`) |
| workflow_actions | 31 | Step history for each submission. Actors are labels only ("Sample DAO reviewer"); no accounts are linked. |

None of this is copied from production. The old demo identities (`@agritrace.demo`, the `ministry-canonical-data.ts` names) are not used.

---

## 5. Walkthrough script (10–15 minutes)

Before the session, confirm three things. The preview URL shows "STAGING · SYNTHETIC DATA". Every page shows "Preview · Read only" and "Illustrative preview data — not production programme results". `--status` shows the account as active.

| # | Minutes | Screen | What to show | What to say |
|---|---|---|---|---|
| 1 | 1 | **Login** (`/login`) | The reviewer signs in with the password they set themselves. | "This is a staging copy with sample records. Nothing you see is a programme result, and nothing you click can change data." |
| 2 | 2 | **Command Center** (`/command-center`) | Pilot overview for Nimba, Bong and Lofa; the reporting chain; the two labels at the top. | "The pilot is being validated in three counties. Figures here are illustrative." |
| 3 | 2 | **Farmer Registry** (`/farmers`) | Search and filter by county; the sample rows; there is no "Register farmer" button. | "Registration is done by field staff. This account can look, not add." |
| 4 | 1 | **Farmer detail** ("View" on "Sample farmer 01") | Profile, plot and verification state, in a read-only drawer. | "Each record carries its verification history." |
| 5 | 2 | **GIS** (`/map`) | County layers and sample plot points. | "Plots are captured by GPS in the field and shown against administrative boundaries." |
| 6 | 2 | **Verification** (`/verification-queue`) | Queue by stage (DAO → CAC → Ministry) and the history of a sample submission. There are no approve or reject buttons. | "Decisions move through the district, county and Ministry stages. No one can review their own submission." |
| 7 | 2 | **Warehouse and traceability** (`/logistics`, `/inventory`, `/transfers`) | Sample warehouses A–C, stock, movements, and a transfer in transit. | "Stock and transfers are recorded as movements, so every quantity has a trail." |
| 8 | 2 | **Reporting** (`/reporting/workspace`, `/reports`) | The reporting chain, and an export. | "Exports are generated from the same records." |
| 9 | 0.5 | **Logout** | Open the user menu and choose "Sign out". | — |

If the reviewer tries an action, the platform refuses it (403, "This preview account is read-only."). That refusal is expected and worth pointing out.

---

## 6. Verification commands

| Command | What it proves |
|---|---|
| `npm run test:db:preview` | 45 checks against a throwaway Postgres: RLS refuses the preview account, the control role keeps its rights, farmer, plot and rice updates are scoped, and every RLS table has the policies. The seed is guarded and synthetic-only. The rollback restores the previous state. |
| `npm run test:e2e:auth` | Among other things: every mutating API route, enumerated from `src/app/api`, returns 403 for the preview account. Page routes refuse non-GET methods. The walkthrough routes show both labels, offer no mutation controls, have no console errors, no serious or critical axe violations, and no overflow at 1440, 1024 and 390 px wide. The login → logout flow works. |
| `npm run test:auth` | The request policy, the `preview_observer` persona (GIS view only), and the account script's staging-only guard. |
| `npm run test:env` | Preview builds refuse the production project; production builds refuse the staging project. |
