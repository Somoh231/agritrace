# RC1 360 Executive Summary

## Decision

**GO FOR INTERNAL DEMO. NO-GO for controlled pilot or production promotion today.**

The local release candidate is materially safer and more truthful than baseline. It compiles, passes lint, passes 40 focused workflow/security checks, has zero known production dependency vulnerabilities, and passes authenticated browser QA at six responsive sizes. It is not yet pilot-releasable because the current production deployment is stale and publicly exposes `/setup`, the development lint chain still reports nine high advisories, and no linked-database migration/backup evidence was produced.

## Scorecard

| Area | Score | Summary |
| --- | ---: | --- |
| Overall | 80/100 | Strong internal-demo candidate; production and database operational evidence remain incomplete |
| Architecture | 82/100 | Clear App Router/domain boundaries; oversized modules and duplicated policy metadata remain |
| Security | 84/100 local; 55/100 deployed | Fail-closed profiles, safer inputs/exports/headers; deployed artifact remains exposed |
| Workflow | 80/100 | Real records only mutate; CAS transitions and explicit invalid-state responses added |
| Data integrity | 76/100 | Ledger compensation and CSV protections added; no database transaction boundary |
| UI/UX | 86/100 | Strong institutional design; dead actions and misleading role navigation repaired |
| Accessibility | 82/100 | Labels, form semantics, skip link, focus trap, Escape and restoration verified |
| Performance | 72/100 | Build healthy; several operational routes load 306–343 kB JS |
| Operational readiness | 68/100 | Strong local evidence; staging E2E, backup proof, production parity, and analytics storage absent |

## Findings before and after

| Severity | Baseline total | Resolved | Open after remediation |
| --- | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 |
| P1 | 9 | 8 | 1 |
| P2 | 16 | 9 | 7 |
| P3 | 14 | 6 | 8 |

## Highest-impact remediations

1. Removed authentication-to-admin privilege synthesis when `profiles` is missing.
2. Denied inactive/missing profiles consistently in middleware, layouts, APIs, workflows, admin, and AI.
3. Converted illustrative approval/verification/transfer rows to read-only and rejected fake server mutations.
4. Added compare-and-swap workflow transitions and decision-ledger failure compensation.
5. Added safe internal redirects, CSV formula neutralization, bounded workflow payloads, HSTS, and setup-page production gating.
6. Upgraded Next.js 14.2.25 to 15.5.21 and patched Sentry, PostCSS, Sharp, WebSocket, esbuild, and supporting dependencies.
7. Repaired login semantics, skip navigation, mobile focus management, and role-aware sidebar filtering.

## Remaining risks and external blockers

- The deployed production artifact is stale and still exposes `/setup`.
- Linked Supabase migration/RLS parity and a tested backup/restore record were not available.
- The local environment lacks `public.analytics_events`, so analytics persistence needs staging proof.
- The development-only ESLint chain retains nine high advisories; runtime dependencies report zero.
- Sentry builds pass both with and without a DSN, but enabling Sentry increased shared first-load JavaScript from 103 kB to 191 kB and emitted configuration deprecation warnings.

## Release conditions

The branch should remain unmerged and unpushed until the blockers in `RC1_RELEASE_GATE.md` are closed. No migration was applied and no production deployment was changed during this audit.
