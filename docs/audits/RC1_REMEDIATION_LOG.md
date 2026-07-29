# RC1 Remediation Log

## Wave 1 — security, truthfulness, framework

- Created `audit/rc1-360-agentic-qa` from `main` at `c69b459`.
- Upgraded Next.js 14.2.25 → 15.5.21 and adapted async cookies/params plus client-only dynamic pages.
- Upgraded Sentry, PostCSS, Sharp, WebSocket, esbuild, ESLint tooling, and lockfile.
- Deleted the temporary demo-profile fallback and made profiles fail closed.
- Added active-profile checks to middleware, layouts, workflow/API/admin/AI entry points.
- Added safe internal redirect validation.
- Added request bounds and note/metadata clamps to workflow endpoints.
- Made verification/CAC/transfer examples read-only and required live UUID-backed records.
- Added workflow compare-and-swap and action-ledger compensation.
- Added CSV formula neutralization.
- Restricted `/setup` in production.
- Added HSTS and cross-domain policy headers.

## Wave 2 — UX, accessibility, role clarity, observability

- Converted login to a semantic form with labels, keyboard submit, and profile-state errors.
- Removed dead primary actions.
- Added skip link/main identifiers.
- Added mobile nav dialog semantics, focus trap, Escape, and restoration.
- Labeled workspace tools and improved focus styling.
- Filtered role navigation with canonical middleware access rules and least-privilege fallback.
- Removed the production health link to a disabled setup page.
- Improved structured provider-error logging without exposing details.
- Added security tests for redirects, CSV, export RBAC, and navigation.
- Added machine/human route inventory generator.

## Intentionally not changed

- No SQL migration was created or applied.
- No remote schema, RLS, seed, user, workflow, or deployment state was mutated.
- No incompatible ESLint 10 toolchain was retained after it broke the official React lint plugin.
- No production push/merge/deploy occurred because release gates are not all green.

## Wave 3 — staging harness and evidence

- Added Playwright 1.62 and axe integration using the repository's existing npm
  stack; no competing framework was present.
- Added `PREVIEW_BASE_URL`, optional Vercel bypass headers, environment-only
  per-role credentials, auth state outside Git, failure screenshots/traces,
  console/network collectors, desktop/mobile projects, and production mutation
  guards.
- Gitignored auth and browser artifacts and excluded generated Playwright reports
  from ESLint.
- Added 84 discoverable browser cases: 22 core cases pass locally and 62
  authenticated route cases skip without designated credentials.
- Fixed sampled public color-contrast/link-distinguishability failures found by
  axe.
- Added authenticated/authorized GET handling before the rice/DDS report routes'
  intended 405 response, removing method-based authentication inconsistency.
- Proved exact Preview identity and CLI-authenticated core routing; recorded the
  interactive Vercel SSO blocker without disabling protection.
- Proved 11/11 linked migration parity, required workflow table presence, and
  `analytics_events` absence without applying a migration.
- Added a complete restore-drill procedure and classified execution as
  **BLOCKED — NO APPROVED DISPOSABLE RESTORE TARGET**.

## Wave 3 validation

- `npm ci` — pass.
- `npm run lint` — pass.
- `npm run test:workflow` — 29 workflow + 11 security checks pass.
- `npm run build` — pass; Next 15.5.21, 134 static-generation steps.
- Sentry-placeholder build — pass with known deprecation and bundle warnings.
- `npx playwright test --config=playwright.config.ts` — 22 pass, 62
  credential-gated skips, 0 failures.
- `npm audit --omit=dev` — 0 vulnerabilities.
- `npm audit` — 9 high development-tool findings remain.
- `git diff --check` — pass.

## Wave 3 safety

- No Vercel protection setting was changed.
- No remote migration, restore, service-role RLS test, production mutation,
  production promotion, or `main` merge/push occurred.
- Synthetic mutation tests remain double-gated by non-production hostname and
  `QA_ALLOW_SYNTHETIC_MUTATIONS=true`.

## Wave 4 — controlled-pilot prerequisite and policy closure

- Verified that all requested preview/bypass/role variables and an approved
  disposable restore target are absent without printing values.
- Classified `analytics_events` as optional observability and made missing-table
  behavior quiet and explicit while retaining unexpected-failure logging.
- Added tests for missing versus unexpected analytics provider failures.
- Confirmed the deployed transfer policy is globally readable to authenticated
  sessions and classified it P1.
- Prepared, but did not apply, a migration narrowing transfer, field-report, and
  geo policies with active-profile and geography/assignment/ownership checks.
- Added static migration-contract and applied-schema SQL contract tests.
- Did not create QA users, apply SQL, seed records, alter Vercel protection,
  restore a database, touch production, or modify `main`.

## Wave 5 — administrator-provisioned workforce identity

- Disabled shared login controls and shared demo-account seeding.
- Added invitation-only Supabase Auth provisioning with duplicate prevention,
  server-side permission checks, safe compensation, and provider-safe errors.
- Added explicit multi-role assignments, primary-role selection, organization
  and geography readiness checks, activation/deactivation, password recovery,
  and access history.
- Replaced active default-role signup with an inactive/incomplete profile in a
  versioned, unapplied migration and removed the self role/status update policy.
- Added workforce validation and migration-contract tests.
- Did not apply migrations, create users, change Auth settings, or touch
  production.
