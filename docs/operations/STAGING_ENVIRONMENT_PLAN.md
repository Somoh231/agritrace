# Staging environment plan

**Goal:** Vercel **Preview** → **staging** Supabase. Vercel **Production** → **production** Supabase. After cutover, no preview deployment can reach production data.

**Status (2026-09-26):** Owner decisions recorded (§2). Guardrails implemented on `ops/staging-guardrails` (§7). Nothing has been executed against Vercel, Supabase or production.

**Sequence (owner instruction):** first finish the production security sequence **A → C → B → D** (disable signup → disable demo identities → role-hardening migration → deploy `security/platform-emergency-hardening`), then the staging cutover (§4), then Track B. Track B does not start until both are complete.

---

## 1. Where things stand today (verified 2026-09-26)

| Fact | Evidence |
|---|---|
| Preview and Production share one Supabase project **and its service-role key**. | `vercel env ls`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN` are each scoped "Production, Preview"; there are no other variables. |
| **18 preview deployments** (first page of the listing) were built against production. | Snapshot in §10. They are behind Vercel SSO, but each carries production credentials. |
| Local development (`.env.local`) points at production. | Same project URL. |
| The migration chain replays cleanly on Supabase Postgres 17. | All 11 migrations apply in order (`npm run test:db:roles`). |
| Supabase extras: one Edge function (`sync-batch`), no Storage buckets. | `supabase/functions/`; no `storage.*` usage. |
| Optional services are unset (Sentry, Upstash/KV, Anthropic). | Read by code, absent from Vercel. |
| Existing seed scripts are **not** for staging. | `seed-demo.ts` creates the shared `@agritrace.demo` accounts; `ministry-canonical-data.ts` holds 24 DAO-officer and farmer records with realistic person names of unknown origin. |

## 2. Owner decisions (2026-09-26)

1. Supabase **Pro** for staging.
2. Same **region** and **Postgres major version** as production.
3. **Staging-only** CLI/project access for Claude, plus a local `.env.staging.local`. Never production database credentials.
4. A **separate staging Mapbox token**.
5. The 18 production-backed previews are deleted **only after** the cutover is fully verified.
6. **Never** copy production operational or personal data into staging.
7. Production credentials are **not rotated or modified** during staging setup unless separately approved.

## 3. Staging project requirements

| Item | Requirement |
|---|---|
| Name | `agrivault-staging` |
| Organisation | Same organisation as production. Claude's CLI account gets membership of **staging only**. |
| Region / Postgres | Same as production (check production *Settings → Infrastructure*). |
| Plan | Pro |
| Auth | Public signup **off**; email confirmation on; no custom SMTP. |
| Auth URLs | Site URL `https://agritrace-git-main-somoh231s-projects.vercel.app`; redirect allowlist `https://agritrace-*-somoh231s-projects.vercel.app/**` and `http://localhost:3000/**`. **No production domain.** |
| Keys | Staging's own anon and service-role keys: stored in Vercel (Preview and Development scopes) and the owner's secret store only. |
| Mapbox | New token restricted to `*.vercel.app` previews and localhost. The production token stays restricted to `agrivaultdata.com`. |

## 4. Environment variables

| Variable | Production | Preview | Development | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | production | **staging** | staging | Inlined at build, so rebuild after any change. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | **staging** | staging | |
| `SUPABASE_SERVICE_ROLE_KEY` | production | **staging** | staging | Server only. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | production token | **staging token** | staging token | |
| `NEXT_PUBLIC_APP_ENV` *(new)* | `production` | **`staging`** | `development` | Label only. Required for Preview (guard). |
| `SUPABASE_PRODUCTION_PROJECT_REF` *(new)* | production ref | production ref | production ref | Required in Production **and** Preview (guard). Not secret: the ref is already public in the production bundle. |
| `SUPABASE_STAGING_PROJECT_REF` *(new)* | staging ref | staging ref | staging ref | Lets the guard also reject "production on staging" and "preview on some third project". |

**Order matters:** the new guard variables must exist in both scopes **before** `ops/staging-guardrails` merges to `main`. Otherwise the next production build fails; that is safe, because Vercel keeps serving the previous deployment, but it's avoidable.

`.env.staging.local` (gitignored by `.env*`) holds the staging URL, anon key, service-role key, database URL and both project refs for Claude's staging tooling. QA account passwords live in `.env.qa.local` and the owner's secret store, never in Vercel.

## 5. Production security sequence (before cutover)

| Order | Action | Who | Verification |
|---|---|---|---|
| A | Disable public signup (*Authentication → Sign In / Providers → Allow new users to sign up: off*) | Owner | Claude reads `/auth/v1/settings`: `disable_signup: true` |
| C | Disable the 4 shared demo identities (`scripts/ops/disable-demo-identities.mjs --execute` with the confirmation variable) | Owner says "approve C"; Claude runs it | Dry run shows 4 inactive and banned; 4 audit rows |
| B | Apply `supabase/proposals/20260926100000_harden_profile_role_assignment.sql` in the SQL editor | Owner | Owner runs the verification queries; Claude checks the output, moves the file into `supabase/migrations/`, re-runs `npm run test:db:roles` |
| D | Merge and deploy `security/platform-emergency-hardening` | Owner says "approve D"; Claude merges and smoke-tests | Production smoke plus the preview-cookie checks; rollback target recorded |

Full detail, including rollbacks: the owner checklist delivered on 2026-09-26 and ADR 0011.

## 6. Staging cutover checklist (after A–D)

| # | Step | Who | Verification | Rollback |
|---|---|---|---|---|
| 1 | Create `agrivault-staging` (§3). Add Claude's CLI account to it (staging only). Put staging values in `.env.staging.local`. | Owner | Claude: `supabase projects list` shows staging; refuses if its ref equals `SUPABASE_PRODUCTION_PROJECT_REF` | Delete project |
| 2 | Replay migrations: `supabase link --project-ref <staging>` then `supabase db push`. Then apply the (by now production-approved) role hardening. | Claude | `supabase migration list`: all applied, 0 pending; hardening queries true | Reset staging database |
| 3 | Deploy Edge function: `supabase functions deploy sync-batch --project-ref <staging>` (staging secrets only) | Claude | Function listed; invoke with a staging QA token → 2xx/4xx as designed | `supabase functions delete` |
| 4 | Generate synthetic QA data: `npm run seed:staging` (§8; refuses a production ref) | Claude | Row counts match the seed manifest; spot-check shows only `QA-` records | Re-run (idempotent reset) |
| 5 | Create the QA role matrix accounts (§9) through the Admin API; passwords to `.env.qa.local` and the secret store | Claude | Each account signs in on a local staging build and lands on its expected home | Delete QA users |
| 6 | Point Vercel **Preview** (and Development) at staging: the variables in §4. Production scope untouched. | Owner, or Claude via `vercel env` after approval | `vercel env ls`: separate Production and Preview entries; Production entries unchanged | Re-point Preview (not recommended) |
| 7 | Trigger a fresh preview: push `ops/staging-guardrails` (or redeploy) | Claude | Build passes the guard; staging label present | Redeploy previous |
| 8 | **Prove the guard:** on a throwaway branch, set one Preview variable (branch-scoped) to the production project and push | Claude, with owner approval of the temporary variable | That preview **fails to build** with `supabase-environment-guard … PRODUCTION Supabase project`; then remove the variable and the branch | Remove the temporary variable |
| 9 | Smoke tests on the fresh preview, signed into Vercel: auth (each QA role home and refused routes), workflow (submit → DAO verify → CAC approve on `QA-` data), RLS (cross-county account sees nothing; inactive account refused), `/api/health` → `"environment":"staging"`, indicator visible | Claude (the owner signs the browser pane into Vercel) | All pass | — |
| 10 | Confirm no staging activity reached production: production `analytics_events`, `audit_log` and `profiles` counts before and after steps 7–9 (read-only), and no `QA-` codes in production | Claude | Counts unchanged except real production traffic; 0 `QA-` rows | — |
| 11 | Record every production-backed preview deployment (all pages of the listing, not just the first) | Claude | List saved in §10 with IDs | — |
| 12 | Delete them: `vercel remove <dpl_id> --yes` one at a time | Owner approves the final list; Claude runs | Each ID returns 404 in `vercel inspect` | Not reversible (and not needed: superseded builds carrying production credentials) |
| 13 | Re-check: every remaining preview was built after step 6 and its `/api/health` says `staging` | Claude | Listing contains only post-cutover previews | — |

## 7. Guardrails (implemented, branch `ops/staging-guardrails`)

- **Build and start guard:** `src/lib/env/supabase-environment-guard.mjs`, loaded by `next.config.mjs`, so it runs for `next build`, `next dev` and `next start`.

  | Situation | Result |
  |---|---|
  | Vercel Preview (or local `NEXT_PUBLIC_APP_ENV=staging`) on the production project | **fails** |
  | Preview without `NEXT_PUBLIC_APP_ENV=staging` or without `SUPABASE_PRODUCTION_PROJECT_REF` | **fails** (cannot be verified) |
  | Preview on a project other than `SUPABASE_STAGING_PROJECT_REF` (when set) | **fails** |
  | Vercel Production on staging, not on production, or labelled `staging` | **fails** |
  | Anon or service-role key belonging to a different project than the URL (legacy JWT keys carry `ref`) | **fails** |
  | Local development without a staging label | unconstrained (current behaviour) |

  Error messages never contain refs, URLs or keys.
- **Staging indicator:** "STAGING · SYNTHETIC DATA" bar at the top of the authenticated app shell. It renders only when the build's `NEXT_PUBLIC_APP_ENV` is exactly `staging`, which the guard makes impossible in production. It never appears on the public website.
- **Health label:** `/api/health` now includes `"environment": "production" | "staging" | "development"`. It is a label only.
- **Evidence:**
  - 18 guard checks, including loading `next.config.mjs` (`npm run test:env`).
  - Real `next build` runs with a deliberate misconfiguration fail at startup (preview → production project; production labelled staging).
  - Stub-Supabase production builds labelled `staging` and `production`: 87/87 route and environment tests each (indicator present or absent; health label; no identifying data; route protection intact).
  - Normal build: public-site suite 90 passed, 2 skipped by design.

## 8. Synthetic QA seed (`npm run seed:staging`, to be written at step 4)

- **Nothing from production:** no rows, exports or "anonymised" copies. Schema-only dumps are used for diffing only.
- **Obviously synthetic:**
  - names like `QA Farmer 0042` and `QA DAO Officer 03`;
  - phone numbers in a non-dialable pattern (`+231 000 000 0042`);
  - an organisation called `AgriVault QA (synthetic)`;
  - a `QA-` prefix on every generated code.
- **Allowed reference data:** public administrative geography (counties, districts, geoBoundaries county shapes, CC BY 3.0 IGO).
- **Deterministic:** a fixed random seed; re-running resets all `QA-` data.
- **Guarded:** refuses unless the URL matches `.env.staging.local` and differs from `SUPABASE_PRODUCTION_PROJECT_REF`.
- **Shape:**
  - the 3 pilot counties plus 1 empty **control county**;
  - ~50 farmers per pilot district, with plots inside the real county boundary;
  - submissions in every workflow state, including overdue and stale;
  - 2 warehouses per pilot county, with transfers and one discrepancy;
  - queued, partial and failed sync records;
  - two synthetic seasons, labelled synthetic.

## 9. Synthetic QA role matrix

Accounts are `qa.<name>@agrivault-staging.test`, created through the Admin API with `email_confirm: true`, each with a random per-account password; there are no shared passwords. "Current" is computed from the code (`postLoginHomeForRole`, `assertPilotRouteAccess`) with the call-center fix from ADR 0012 §A applied. "Proposed" is ADR 0012 §B–§D, pending owner confirmation.

| QA account | Scope | Home | Command Center | County | District | DAO desk | CLAN desk | Admin | Farmers | Verif. queue | Inventory |
|---|---|---|---|---|---|---|---|---|---|---|---|
| super_admin | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ministry_admin | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ministry_officer | national | /command-center | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| county_agriculture_coordinator | Bong | /county-dashboard | – | ✓ | ✓ | ✓ | ✓ | – | ✓ | ✓ | ✓ |
| dao_officer | Bong / 1 district | /district-dashboard | – | – | ✓ | ✓ | ✓ | – | ✓ | ✓ | ✓ |
| clan_technician | Bong / 1 district | current: /district-dashboard · **proposed: /workspace/clan** | – | – | current ✓ · **proposed –** | current ✓ · **proposed –** | ✓ | – | ✓ (own scope) | – | – |
| field_agent | Nimba / 1 district | as clan_technician | – | – | as CLAN | as CLAN | ✓ | – | ✓ (own county) | – | – |
| warehouse_manager | 1 warehouse | /inventory | – | – | – | – | – | – | ✓ | – | ✓ |
| cooperative_manager | 1 cooperative | /farmers | – | – | – | – | – | – | ✓ | – | ✓ |
| exporter | own organisation | current: /cocoa/lots (gated → /farmers) · **proposed: /cocoa/lots** | – | – | – | – | – | – | current ✓ · **proposed –** | – | current ✓ · **proposed –** |
| call_center_agent | national capture | **/farmers** (fixed) | – | – | – | – | – | – | ✓ | – (by design) | – |
| auditor | read-only | /audit-tools | – | – | – | – | – | – | ✓ | – | – |
| donor_observer | read-only | /donor-dashboard | – | – | – | – | – | – | – | – | – |
| **legacy aliases:** admin, government_officer, county_officer, district_officer, donor_partner | as their modern role | | | | | | | | | | |

**Negative accounts (each must be refused):** `qa.inactive-admin` (inactive `admin` → `/account-unavailable`, admin API 403, RLS denies with the hardening applied); `qa.no-profile` (Auth user without a profile row); `qa.pending` (fresh signup-shaped account, inactive `field_agent`); `qa.cross-county` (CAC for the empty control county: sees no pilot-county records).

## 10. Old preview deletion plan

- **Snapshot (2026-09-26, first page of `vercel ls agritrace`, 18 preview deployments, all built with production credentials):** `dpl_CsjXkDDHDUkwTtRVFkqFz8N8GWFH`, `dpl_928vW5WUSJ5vqmNFSG6zvRviio8g`, `dpl_44ba75FSmos3if7iiuZCqFwW59zu`, `dpl_6DqKn5LLafAcihRZXfvdoBzPiCzv`, `dpl_Dj8b76aeXHN57inWEJveiKjyGi1y`, `dpl_2ZM1VFXKatMfYcW3kgN6M175eB39`, `dpl_GeXLaZK5FZdaPpsWPxumFdz6cH6W`, `dpl_J8NEuzhaLqMKRKM3yAaQFxV3d1e7`, `dpl_42faQq2Jd5YtkQTJ7sKZTZssPKmv`, `dpl_FCo2WdkjGZTLX5MbgjdQtMYqZbhQ`, `dpl_4XL3vi5vqFaY5PZtpgbFvAw7LSnn`, `dpl_HSfPFLE1h5ZwnczyUfVYojMnH47K`, `dpl_vYBYHYH9wcwis2aitzUA32hkQtGy`, `dpl_G94C6SVufbeFL1Et3nFYaXxnvG74`, `dpl_5URyQdETspR1U52ZRfCrizAqRriw`, `dpl_C5VUQmsVeQhFahM3cWrcLne37oZ1`, `dpl_GLF2WA3HrgR45z4doQsyozKyGKNs`, `dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw`.
- **At step 11**, the list is rebuilt from **all** pages. It includes any preview created before step 6 (for example new pushes of the security or guardrails branches) and **excludes every production deployment**, including the current production and the rollback targets `dpl_4QRCeQapV8KcvvMaviB1N5EQ2Xvz` / `dpl_AJjGknRipMfXPvhKuoxZUJbaK83W`.
- **Deletion** happens only after steps 7–10 pass and the owner approves the final list: `vercel remove <id> --yes`, one ID at a time, logging each result.
- **Afterwards:** `vercel inspect` on each removed ID returns not found, and step 13 passes.

## 11. Rollback

| Scope | Rollback | Production impact |
|---|---|---|
| Staging project, migrations, function, seed, QA accounts (steps 1–5) | Reset or delete staging | None |
| Preview variable split (step 6) | Re-point Preview. Prefer fixing staging forward: reverting reconnects previews to production. | None; Production scope untouched |
| Guardrails merge | Revert the merge commit, or unset `SUPABASE_PRODUCTION_PROJECT_REF` in Preview (preview builds then fail closed, not open) | None |
| Old preview deletion (step 12) | Not reversible; not needed | None |

## 12. Data-handling rules

1. No production rows, backups, exports or anonymised copies in staging.
2. No real names, phone numbers, emails or personal locations. Public administrative geography is fine.
3. No shared or published passwords. Per-account random credentials live in a secret store.
4. Anything in staging that looks real is a seed bug. Fix the seed.
5. Production credentials are not rotated or modified during staging setup unless separately approved.
