# AgriVault RC1 360 Audit State

Last updated: 2026-07-29

## Current status

| Field | Value |
| --- | --- |
| Current phase | `STAGING_VERIFICATION_COMPLETE` |
| Current audit cycle | `3` |
| Active workstream | Local and CLI-authenticated preview verification complete; pilot-critical external evidence blocked |
| Branch | `audit/rc1-360-agentic-qa` |
| Baseline | `c69b4598fe96fbbf4a968922739e4af0a227c8dc` |
| Routes inspected | 147 inventoried: 124 pages and 23 APIs; targeted browser coverage across public, auth, command, role-denial, workflow, transfer, admin, health, and setup families |
| Findings severity | P0: 0 open; P1: 1 open; P2: 8 open; P3: 8 open |
| Tests | Clean install pass; lint pass; 40 workflow/security checks pass; 22 Playwright core checks pass and 62 credential-gated checks skip; builds pass with and without Sentry |
| Browser | Local production-mode core passes at desktop/mobile; interactive preview is blocked by Vercel SSO; CLI-authenticated preview core routes are verified |
| Blockers | Stale production `/setup`; no browser preview auth or designated role credentials; live RLS/offline/GIS/export-role matrix unproved; no disposable restore target |
| Local verdict | `GO FOR INTERNAL DEMO` |
| Production/pilot verdict | `NO-GO for controlled pilot; GO FOR INTERNAL DEMO only` |

## Phase progression

- [x] Baseline capture and clean-branch verification
- [x] Repository, route, architecture, security, workflow/data, UI/UX, accessibility, and performance audits
- [x] Implementation Wave 1: critical auth, mutation-truthfulness, dependency, framework, and input-security fixes
- [x] QA Cycle 1: lint, build, workflow/security tests, dependency audit
- [x] Implementation Wave 2: accessibility, mobile navigation, role-aware navigation, health/setup, logging
- [x] QA Cycle 2: production build and local/deployed browser QA
- [x] Final local release validation
- [x] Exact preview deployment identity and CLI-authenticated core-route verification
- [x] Local reusable Playwright/axe preview harness and two-viewport core regression
- [x] Linked migration parity and table-presence inspection
- [x] Backup/restore drill plan and explicit blocker classification
- [ ] Production deployment of this branch
- [ ] Executed backup/restore evidence on an approved disposable target
- [ ] Authenticated role, RLS, offline replay/dedupe, GIS, and authorized export QA in preview
- [ ] Full dependency audit with zero high findings

## Finding disposition

| Severity | Open | Resolved | Notes |
| --- | ---: | ---: | --- |
| P0 | 0 | 0 | No confirmed P0 |
| P1 | 1 | 9 | Added and resolved GET-before-auth behavior on rice/DDS report endpoints; open item remains stale production `/setup` |
| P2 | 8 | 11 | Transaction atomicity, lint-chain advisory, CSP, bundle/Sentry cost, analytics storage, restore evidence, authenticated E2E/a11y, Node runtime policy |
| P3 | 8 | 6 | Consolidation, documentation hygiene, deprecated wrappers, polish |

## Validation evidence

- `npm run lint` — pass, zero warnings.
- `npm ci` — pass; Node 22 locally does not satisfy the repository's `20.x` engine declaration.
- `npm run test:workflow` — pass: 29 workflow + 11 security checks.
- `npm run build` — pass on Next.js 15.5.21; 134 static-generation steps.
- Sentry-enabled build with a non-secret test DSN — pass; configuration deprecation warnings and a shared-JS increase are recorded as P2 follow-up.
- `npm audit --omit=dev --json` — 0 production vulnerabilities.
- Full `npm audit --json` — 9 high findings in the ESLint/plugin development chain; no runtime dependency finding.
- Local browser QA — pass for public shell, invalid/valid login, logout, protected redirects, role denial, corrected exporter navigation, mobile menu focus/Escape, clean console.
- Responsive dimensions — 1440×900, 1280×800, 1024×768, 768×1024, 390×844, 360×800; no horizontal overflow on the authenticated command center.
- RC1 Playwright core — 22/22 pass across 1440×900 and 390×844; 62 authenticated route cases skip because no `QA_*` credentials are configured.
- Preview deployment `dpl_833QkZ2cuJoidseeY1g8wZxRDZwk` is Ready and build logs directly identify branch `audit/rc1-360-agentic-qa`, commit `893860b`, Node 20.x, and Next 15.5.21.
- CLI-authenticated preview requests prove application `/setup` 404, `/api/health` 200 sanitized JSON, `/login` 200, `/` 200, and `/command-center` 307 to login.
- Browser preview requests land on Vercel authentication; neither the Vercel nor GitHub browser session is authenticated. Status: **BLOCKED — VERCEL DEPLOYMENT PROTECTION AUTHENTICATION UNAVAILABLE**.
- Linked migrations are 11 local/11 remote in parity through `20260619120000`; required workflow tables exist and `analytics_events` does not.
- Production `https://agrivaultdata.com/setup` still returns 200. Production was not changed.

## Safety constraints observed

- No database migrations were applied.
- No backup, destructive mutation, real approval, transfer, import, or user-management action was executed.
- Browser workflow checks used read-only navigation and demo authentication only.
- No secrets or credentials are recorded in audit artifacts.

## Remaining release blockers

1. Provide protected-preview browser access and designated `QA_*` role accounts; execute the role, RLS, export, accessibility, console/network, GIS, and offline replay matrices.
2. Approve a disposable AgriVault Supabase project and execute `RC1_BACKUP_RESTORE_DRILL.md`.
3. Resolve or owner-approve the broad RLS policies observed in static review before any pilot data is loaded.
4. Reconcile the absent `analytics_events` table without applying an unreviewed remote migration.
5. Deploy only after the above gates pass; then prove production `/setup` is application-level 404 and remove/rotate training credentials.
