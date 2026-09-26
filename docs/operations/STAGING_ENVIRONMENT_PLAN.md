# Staging environment plan

**Goal:** Vercel **Preview** → **staging** Supabase. Vercel **Production** → **production** Supabase. After cutover, no preview deployment can reach production data.

**Status:** Plan (2026-09-26). Nothing described here has been executed.

---

## 1. Where things stand today (verified 2026-09-26)

| Fact | Evidence |
|---|---|
| Preview and Production share one Supabase project **and its service-role key**. | `vercel env ls`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN` are each scoped "Production, Preview". There are no other Vercel variables. |
| **18 preview deployments** are live and were built against production. | `vercel ls agritrace`. They are behind Vercel SSO, but each carries production credentials (service role server-side; URL and anon key inlined in the bundle). |
| Local development (`.env.local`) points at production. | Same project URL as production. |
| The migration chain replays cleanly on Supabase Postgres 17. | All 11 files in `supabase/migrations/` apply in order on `public.ecr.aws/supabase/postgres:17.6.1.166` (see `npm run test:db:roles`). |
| Supabase extras: one Edge Function (`sync-batch`), no Storage buckets. | `supabase/functions/`, no `storage.*` usage in code or migrations. |
| Optional services are unset today: Sentry (`SENTRY_*`, `NEXT_PUBLIC_SENTRY_DSN`), Upstash/KV rate-limit store, Anthropic. | Read by code, not present in Vercel. The app falls back (no Sentry, in-memory rate limiting, AI chat 503). |
| Existing seed scripts are **not** suitable for staging. | `seed-demo.ts` creates the shared `@agritrace.demo` accounts with a published password. `src/lib/data/ministry-canonical-data.ts` holds 24 DAO-officer and farmer records with realistic person names of unknown origin. |

---

## 2. Staging Supabase project — requirements

| Item | Requirement |
|---|---|
| Name | `agrivault-staging` (never reuse the production project) |
| Organisation / owner | Same organisation as production, so access is managed in one place. The CLI account on the build machine currently cannot see production. Grant it access to **staging only**. |
| Region | Same region as production (latency and data-residency parity). |
| Postgres | Same major version as production (check *Settings → Infrastructure*). Local tests use 17.6. |
| Plan | **Pro** recommended. Free projects pause after ~1 week idle, which breaks preview QA. |
| Auth | **Public signup off** (same policy as production after approval A). Email confirmations on. No custom SMTP; no mail needs to leave staging. |
| Auth URLs | Site URL: `https://agritrace-git-main-somoh231s-projects.vercel.app` (placeholder). Redirect allowlist: `https://agritrace-*-somoh231s-projects.vercel.app/**` and `http://localhost:3000/**`. **No production domain.** |
| Keys | Its own anon and service-role keys. The staging service-role key is stored only in Vercel (Preview and Development scopes) and in the owner's secret store. |
| Backups | Default. Staging holds nothing irreplaceable. |
| Network | Default. No production database password is ever given to staging tooling. |

Optional services, if enabled later: a **separate** Mapbox token restricted to `*.vercel.app` preview URLs and localhost (the production token stays restricted to `agrivaultdata.com`); `SENTRY_ENVIRONMENT=staging`; a separate Upstash database (or none).

---

## 3. Environment-variable split

| Variable | Production scope | Preview scope | Development scope | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | production project | **staging project** | staging project | Inlined at build time, so a rebuild is needed after any change. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon | **staging anon** | staging anon | |
| `SUPABASE_SERVICE_ROLE_KEY` | production service role | **staging service role** | staging service role | Never in `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | production token (domain-restricted) | staging token (preview-restricted) | staging token | Can stay shared until a second token exists. |
| `NEXT_PUBLIC_APP_ENV` *(new)* | `production` | `staging` | `development` | Drives a visible "Staging" label and the health label (see §7). Not secret. |
| `SUPABASE_PRODUCTION_PROJECT_REF` *(new)* | production ref | production ref | production ref | Used only by the build guard (§7) to **refuse** a preview build that points at production. The ref is already public in the production bundle. |
| `SENTRY_ENVIRONMENT`, `SENTRY_DSN` | `production` | `staging` | — | Only when Sentry is enabled. |
| `UPSTASH_REDIS_REST_*` / `KV_REST_API_*` | production store | separate store or unset | unset | Only when enabled. |
| `ANTHROPIC_API_KEY` | as decided | unset, or a separate low-limit key | unset | Only when enabled. |

**Local development:** `vercel env pull .env.local --environment=development` then gives staging values. No developer machine needs production credentials.

**QA account credentials** (§6) are **not** Vercel variables. They live in the owner's secret store and in a local, gitignored `.env.qa.local` used by Playwright (`.env*` is already ignored).

---

## 4. Cutover sequence

Each step names who does it. Claude acts only after explicit owner approval of that step.

| # | Step | Who |
|---|---|---|
| 1 | Create `agrivault-staging` with the settings in §2. | Owner (Supabase dashboard) |
| 2 | Give Claude **staging-only** access: either log the CLI into an account that can see staging, or put the staging URL, anon key, service-role key and database URL in a local `.env.staging.local`. Never production database credentials. | Owner |
| 3 | Replay migrations, deploy `sync-batch`, apply the role-hardening proposal (rehearsing approval B), load geography and the synthetic QA seed (§5, §6). | Claude |
| 4 | Verify staging (§8, steps V1–V4). | Claude |
| 5 | Set the Preview and Development scopes of the variables in §3 to staging values. Production scope is **not touched**. | Owner, or Claude via `vercel env` after approval |
| 6 | Land the build guard and environment label (§7) on a small branch; review; merge. | Claude, then owner approves the merge |
| 7 | Redeploy the active branches' previews so they rebuild against staging. | Claude |
| 8 | Verify previews hit staging and production is unchanged (§8, steps V5–V8). | Claude |
| 9 | Delete the preview deployments built before cutover (18 today). They still carry production credentials. | Owner approves; Claude runs `vercel remove` per deployment |
| 10 | Switch local `.env.local` to staging (`vercel env pull`). | Owner / each developer |

Steps 5–9 should happen in one sitting. Between 5 and 9, older previews still point at production, but they stay behind Vercel SSO.

---

## 5. Migration replay procedure

1. **Link staging only:** `supabase link --project-ref <staging-ref>`. Confirm with `supabase projects list` that the linked project is staging, and refuse if it matches `SUPABASE_PRODUCTION_PROJECT_REF`.
2. **Apply the chain:** `supabase db push` applies `supabase/migrations/*` in order. Then `supabase migration list` shows 11 applied and 0 pending.
3. **Rehearse the role hardening:** apply `supabase/proposals/20260926100000_harden_profile_role_assignment.sql` (branch `security/platform-emergency-hardening`) to staging. Run the verification queries from the owner checklist, then run the rollback and re-apply, so approval B is proven on a real Supabase project before production.
4. **Edge function:** `supabase functions deploy sync-batch --project-ref <staging-ref>`. Set any function secrets to staging values.
5. **Schema parity (no data):** the owner produces a **schema-only** dump of production (`supabase db dump --schema public --db-url <prod>`; it contains no rows) and Claude diffs it against staging. Any difference means production has drifted from the repository (changes made in the SQL editor). Each difference gets a migration or an explanation **before** previews move over.
6. **Going forward:** every new migration lands on staging first (via the branch preview), then production. The repository stays the single source of schema.

---

## 6. Synthetic QA seed strategy

**Principles**

- **Nothing from production.** No rows, no exports, no anonymised copies. Staging starts empty and is filled by code.
- **Obviously synthetic.** Names like `QA Farmer 0042` and `QA DAO Officer 03`. Phone numbers in a non-dialable pattern (`+231 000 000 0042`). An organisation called `AgriVault QA (synthetic)`. Every generated record carries a `QA-` code prefix.
- **Public reference data is allowed.** Counties, districts and county boundaries (geoBoundaries, CC BY 3.0 IGO, already credited in the app) are public administrative geography, not personal data. They are loaded by a geography-only split of `seed-national-pilot.ts`.
- **The canonical and demo seeds are not used on staging.** They carry demo accounts and realistic person names.
- **Deterministic.** A fixed random seed makes every run produce the same dataset, so screenshots and tests are stable. Re-running resets QA data (delete by `QA-` prefix, then insert).
- **Guarded.** `npm run seed:staging` refuses to run unless the target URL matches `.env.staging.local` **and** does not contain `SUPABASE_PRODUCTION_PROJECT_REF`.

**Dataset shape (small, but it covers every state)**

| Area | Content |
|---|---|
| Geography | All counties, including the 3 pilot counties (Nimba, Bong, Lofa) and 1 **control county** with no data, which exercises empty and out-of-scope states. 2 districts per pilot county. |
| Farmers and plots | About 50 farmers per pilot district, with plots drawn inside the real county boundary. Verification mix: verified / pending / flagged / rejected. |
| Workflow | Submissions in every state (draft, submitted, DAO-verified, CAC-approved, returned, escalated), including **overdue** and **stale** items for exception queues. |
| Warehouses | 2 per pilot county: stock, receipts, transfers in flight, and one open **discrepancy**. |
| Offline and sync | Records in *queued*, *partially synced* and *failed* states for PWA and sync UI. |
| Reports and analytics | Two seasons of synthetic production figures, so trends and variance are meaningful, explicitly labelled synthetic. |
| Audit | Audit rows produced by the seed's own workflow actions, never hand-written. |

**Accounts:** created with the Admin API (`email_confirm: true`, so no email is sent). Each gets a random 24+ character password, written once to `.env.qa.local` and the owner's secret store. There are no shared passwords, and none are committed.

---

## 7. Guardrails to add (small code change, step 6)

1. **Build guard.** In `next.config.mjs`, fail any **preview** build whose `NEXT_PUBLIC_SUPABASE_URL` contains `SUPABASE_PRODUCTION_PROJECT_REF`, and fail a **production** build whose URL does not. A misconfigured scope then produces a failed build instead of a preview connected to production.
2. **Environment label.** When `NEXT_PUBLIC_APP_ENV=staging`, the app shell shows a small, persistent "Staging · synthetic data" marker. The public website is unaffected.
3. **Health label.** `/api/health` adds `"environment": "staging" | "production"`. This is a label only, never a project ref or key.
4. **Seed guard.** As in §6: seed scripts refuse any URL containing the production ref.

---

## 8. Safe verification steps

All checks are read-only against production. Staging checks use only staging credentials.

| # | Check | Expected |
|---|---|---|
| V1 | `supabase migration list` on staging | 11 applied, 0 pending. The rehearsed hardening is confirmed by the owner checklist queries (it is not a migration file until approved). |
| V2 | Staging `GET /auth/v1/settings` | `disable_signup: true` |
| V3 | `npm run test:db:roles` (local Docker), plus the owner checklist queries run on staging | 32/32; hardening verified on staging |
| V4 | Role matrix (§9): sign in as each QA account on a local build pointed at staging | Each lands on its expected home; forbidden routes redirect; admin API 401/403 as listed |
| V5 | `vercel env ls` | The four Supabase/Mapbox variables have **separate** Production and Preview entries |
| V6 | A new preview build | The guard passes; `/api/health` (signed into Vercel) reports `"environment": "staging"` |
| V7 | Production smoke test | `agrivaultdata.com` routes, boundaries and `/api/health` unchanged; production deployment ID unchanged by steps 5–9 |
| V8 | Negative test | A throwaway branch with a preview variable deliberately pointed at production **fails to build** (then the variable is removed) |

---

## 9. Role and account matrix (staging QA accounts)

Home and access below are computed from the current code (`postLoginHomeForRole`, `assertPilotRouteAccess`, `isAdminConsoleRole`). They are the baseline, not a judgement of correctness.

| QA account (`qa.<role>@agrivault-staging.test`) | Scope | Home | Command Center | County dash | District dash | Admin console / API | Farmers | Verification queue | Inventory |
|---|---|---|---|---|---|---|---|---|---|
| super_admin | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ministry_admin | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ministry_officer | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| government_officer (legacy) | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| county_agriculture_coordinator (CAC) | Bong | /county-dashboard | – | ✓ | ✓ | – | ✓ | ✓ | ✓ |
| county_officer (legacy CAC) | Nimba | /county-dashboard | – | ✓ | ✓ | – | ✓ | ✓ | ✓ |
| dao_officer | Bong / 1 district | /district-dashboard | – | – | ✓ | – | ✓ | ✓ | ✓ |
| district_officer (legacy DAO) | Lofa / 1 district | /district-dashboard | – | – | ✓ | – | ✓ | ✓ | ✓ |
| clan_technician | Bong / 1 district | /district-dashboard | – | – | ✓ | – | ✓ | – | – |
| field_agent | Nimba / 1 district | /district-dashboard | – | – | ✓ | – | ✓ | – | – |
| cooperative_manager | 1 cooperative | /farmers | – | – | – | – | ✓ | – | ✓ |
| warehouse_manager | 1 warehouse | /inventory | – | – | – | – | ✓ | – | ✓ |
| donor_observer | read-only | /donor-dashboard | – | – | – | – | – | – | – |
| donor_partner (legacy) | read-only | /donor-dashboard | – | – | – | – | – | – | – |
| exporter | own lots | /cocoa/lots | – | – | – | – | ✓ | – | ✓ |
| call_center_agent | national queue | /verification-queue | – | – | – | – | ✓ | – | – |
| auditor | read-only | /audit-tools | – | – | – | – | ✓ | – | – |

**Negative accounts (each must be refused):**

| Account | State | Expected |
|---|---|---|
| `qa.inactive-admin` | admin role, `is_active = false` | Every protected route → `/account-unavailable`; admin API 403; with the hardening applied, RLS denies too |
| `qa.no-profile` | Auth user, profile row removed | → `/account-unavailable` |
| `qa.pending` | created as a fresh signup (inactive `field_agent`) | → `/account-unavailable` until an admin activates it |
| `qa.cross-county` | CAC for the **control county** | Sees none of the pilot counties' records (RLS scope) |

**Boundaries to confirm with the owner** (current behaviour, possibly unintended; to settle before Track B):

- `clan_technician` and `field_agent` land on **/district-dashboard** and can open the DAO workspace (`/workspace/dao`).
- `exporter` can open **/farmers** and **/inventory**.
- `call_center_agent`'s home is **/verification-queue**, but the route gate does **not** allow that role there, so the role signs in to a page it cannot open (likely bug).
- `call_center_agent` and `auditor` can open **/farmers**.
- `government_officer`, `county_officer`, `district_officer` and `donor_partner` are legacy aliases kept for existing accounts.

---

## 10. Rollback

| Step | Rollback | Production impact |
|---|---|---|
| Staging project creation, migrations, seed (1–4) | Delete or reset the staging project. | None |
| Vercel variable split (5) | Restore the Preview-scope entries to their previous values and redeploy. **Not recommended:** it reconnects previews to production. Prefer fixing the staging values forward. | None; Production scope is never edited |
| Build guard and label (6) | Revert the merge commit, or leave `SUPABASE_PRODUCTION_PROJECT_REF` unset (the guard is then inert). | None |
| Preview redeploys (7) | Redeploy from the previous commit. | None |
| Deleting old previews (9) | Not reversible, and not needed: they were superseded builds carrying production credentials. | None |
| Local `.env.local` switch (10) | `vercel env pull` again. | None |

Production is never modified by this plan. The only production interactions are read-only checks (V7) and the owner's schema-only dump (§5 step 5).

---

## 11. Data-handling rules for staging

1. No production rows, backups, exports or "anonymised" copies. Schema-only dumps are the only production artefact, and they are used for diffing, not import.
2. No real names, phone numbers, emails or locations of people. Public administrative geography is fine.
3. No shared or published passwords. QA credentials are per account, random and kept in a secret store.
4. Staging keys never enter the client bundle except the anon key and URL, as in production.
5. Anything that looks real in staging is a bug in the seed. Fix the seed; don't redact after the fact.

---

## 12. Owner decisions needed before step 1

1. Staging project plan tier (Pro recommended) and region confirmation.
2. How Claude receives **staging-only** access: a CLI account with staging membership, or a local `.env.staging.local`.
3. Whether to create a second Mapbox token now (recommended) or share the current one until later.
4. Confirmation of the boundary questions in §9.
5. Approval to delete the 18 pre-cutover preview deployments after step 8.
