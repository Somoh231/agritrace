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

