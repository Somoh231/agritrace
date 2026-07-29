# RC1 360 Executive Summary

## Decision

**GO FOR INTERNAL DEMO. NO-GO for controlled pilot or production promotion today.**

The release candidate is materially safer and more truthful than baseline. It passes a clean install, lint, 42 focused workflow/security checks, two production builds, 22 desktop/mobile Playwright core checks, and a zero-vulnerability production dependency audit. The exact final preview build is Ready, its `/setup` route is an application-level 404 through Vercel CLI authentication, its health response is sanitized, all six report endpoints reject unauthenticated requests, and optional analytics degrades quietly. It is not pilot-releasable because interactive authenticated role/RLS/offline/GIS/export verification is blocked by protected-preview authentication and missing designated `QA_*` accounts, no disposable restore target is approved, and production remains stale with `/setup` returning 200.

## Scorecard

| Area | Score | Summary |
| --- | ---: | --- |
| Overall | 82/100 | Strong internal-demo candidate; pilot-critical browser, RLS, offline, GIS, and restore evidence remain incomplete |
| Architecture | 82/100 | Clear App Router/domain boundaries; oversized modules and duplicated policy metadata remain |
| Security | 86/100 local/preview core; 55/100 production | Fail-closed profiles and protected preview core; production remains stale and live RLS matrix is unproved |
| Workflow | 80/100 | Real records only mutate; CAS transitions and explicit invalid-state responses added |
| Data integrity | 76/100 | Ledger compensation and CSV protections added; no database transaction boundary |
| UI/UX | 86/100 | Strong institutional design; dead actions and misleading role navigation repaired |
| Accessibility | 84/100 | Public/login serious-or-critical axe findings cleared on desktop/mobile; authenticated routes and screen-reader output remain unproved |
| Performance | 72/100 | Build healthy; several operational routes load 306–343 kB JS |
| Operational readiness | 70/100 | Remote migration state is unchanged with one reviewed local migration pending; protected browser QA, restore proof, and production parity remain absent |

## Findings before and after

| Severity | Baseline total | Resolved | Open after remediation |
| --- | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 |
| P1 | 11 | 9 | 2 |
| P2 | 19 | 12 | 7 |
| P3 | 14 | 6 | 8 |

## Highest-impact remediations

1. Removed authentication-to-admin privilege synthesis when `profiles` is missing.
2. Denied inactive/missing profiles consistently in middleware, layouts, APIs, workflows, admin, and AI.
3. Converted illustrative approval/verification/transfer rows to read-only and rejected fake server mutations.
4. Added compare-and-swap workflow transitions and decision-ledger failure compensation.
5. Added safe internal redirects, CSV formula neutralization, bounded workflow payloads, HSTS, and setup-page production gating.
6. Upgraded Next.js 14.2.25 to 15.5.21 and patched Sentry, PostCSS, Sharp, WebSocket, esbuild, and supporting dependencies.
7. Repaired login semantics, skip navigation, mobile focus management, and role-aware sidebar filtering.

## Staging continuation evidence

- Vercel deployment `dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw` is Ready; build logs directly identify `audit/rc1-360-agentic-qa` at `7f45178`.
- Vercel CLI-authenticated application requests: `/setup` 404, `/api/health` 200 sanitized JSON, `/command-center` 307 to login, all six report endpoints 401 when unauthenticated, and optional analytics 204 `disabled`.
- Browser requests land at Vercel/GitHub authentication, so interactive preview console/network and authenticated role scenarios are not passed.
- The linked Supabase project remains unchanged at 11 remote migrations through `20260619120000`; the repository has one intentionally pending RLS migration, workflow tables exist, and `analytics_events` is absent.
- Local Playwright: 22 core tests pass across desktop and mobile; 62 authenticated route checks skip due missing environment-only role credentials.
- The next controlled-pilot prerequisite check found all 18 requested local
  preview/bypass/role variables absent. Vercel Preview also has no bypass or QA
  account variables, and no disposable restore target is approved.
- `analytics_events` is optional observability infrastructure. Its absence now
  produces a quiet, explicit disabled response rather than repetitive error logs.
- Static policy review confirms all-authenticated transfer visibility and broad
  field/geo access. A scoped migration and SQL contract test are committed but
  remain unapplied pending owner approval.

## Remaining risks and external blockers

- The deployed production artifact is stale and still exposes `/setup`.
- Static RLS review found broad authenticated-read policies that require normal-user, cross-geography verification and data-owner approval.
- No approved disposable restore target exists; the drill is defined but not executed.
- `public.analytics_events` is absent from the linked schema (`PGRST205`), but it is confirmed optional and now degrades quietly with an explicit status.
- The linked project still carries the vulnerable transfer/field/geo policies;
  the repository now has one intentionally pending migration.
- The development-only ESLint chain retains nine high advisories; runtime dependencies report zero.
- Sentry builds pass both with and without a DSN, but enabling Sentry increased shared first-load JavaScript from 103 kB to 191 kB and emitted configuration deprecation warnings.

## Release conditions

The branch may be pushed for protected Preview deployment only. It must remain unmerged to `main`, and no production promotion should occur until the blockers in `RC1_RELEASE_GATE.md` close. No migration was applied and no production deployment was changed during this audit.
