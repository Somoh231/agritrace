# RC1 Security Audit

## Threat model

Primary assets are farmer PII, geospatial plot data, production records, subsidy/warehouse custody state, approval decisions, audit logs, user roles, service credentials, and government reporting outputs. Principal threats are privilege escalation, cross-county access, forged workflow decisions, spreadsheet injection, credential misuse, configuration disclosure, API abuse, and stale deployment drift.

## Resolved critical/high findings

| ID | Severity | Finding | Remediation |
| --- | --- | --- | --- |
| SEC-01 | P1 | Authenticated users without a profile were granted a synthetic admin role | Fallback deleted; missing/inactive profiles denied everywhere |
| SEC-02 | P1 | Inactive/unprovisioned sessions could reach selected APIs | Farmers, registrations, production, AI, workflow, and admin paths use active-profile guards |
| SEC-03 | P1 | Login accepted unsafe `redirectTo` values | Added strict same-origin path validation and tests |
| SEC-04 | P1 | Public production `/setup` disclosed bootstrap posture | Production returns 404 unless explicitly enabled |
| SEC-05 | P1 | CSV exports allowed formula execution on spreadsheet open | Shared cell neutralization added and tested |
| SEC-06 | P1 | Illustrative workflow actions appeared persisted | Fixture actions disabled; APIs reject illustrative identifiers |
| SEC-07 | P2 | Workflow bodies/notes/metadata lacked consistent bounds | Object-only parsers, 4k note bounds, and 16/128k request limits added |
| SEC-08 | P2 | Security headers lacked HSTS and cross-domain policy | HSTS and `X-Permitted-Cross-Domain-Policies: none` added |

## Open findings

| ID | Severity | Finding | Required action |
| --- | --- | --- | --- |
| SEC-09 | P1 | Deployed `agrivaultdata.com/setup` still returns 200 | Deploy remediated build; verify 404 before promotion |
| SEC-10 | P2 | Demo login controls and training credentials exist on the deployed login | Disable/rotate outside controlled training |
| SEC-11 | P2 | CSP still permits `unsafe-inline` and `unsafe-eval` | Move to nonces/hashes and confirm Mapbox/Sentry compatibility |
| SEC-12 | P2 | Full npm audit reports 9 high dev-tool findings | Upgrade once official lint plugins support the patched graph or document time-boxed exception |
| SEC-13 | P2 | Broad authenticated-read pilot RLS policies require data-owner validation | Review by table/role/county against deployed schema |
| SEC-14 | P2 | Migration parity is proved, but no restore execution evidence exists | Approve a disposable target and execute the staging restore drill |
| SEC-15 | P2 | Preview role/RLS enforcement is not dynamically proved; static policies include broad authenticated reads | Run normal-user cross-geography matrix and obtain data-owner approval |
| SEC-16 | P2 | Repository requires Node 20.x while Vercel project setting is 24.x; Vercel warns 20.x support ends 2026-10-01 | Validate supported Node target, update engine/config together, rebuild |
| SEC-17 | P1 | `warehouse_transfer_orders_select USING (true)` exposes all transfer orders to every authenticated role; broad field/geo policies also exceed intended geography | Review and apply pending `20260729220000` only in approved staging, then run normal-user RLS tests |

## Dependency evidence

- Runtime/production audit: **0 vulnerabilities**.
- Full audit: **9 high**, all through ESLint/minimatch/brace-expansion development tooling.
- An ESLint 10 experiment was rejected because the official React lint plugin failed at runtime; correctness was preserved instead of suppressing the gate.

## Deployed evidence

The public site has CSP, HSTS, frame denial, content-type protection, permissions policy, and request IDs. Its HSTS header omits `includeSubDomains`, and its CSP retains unsafe script/style directives. More importantly, `/setup` returns 200 and the deployed login still reflects the pre-remediation build.

## Staging continuation evidence

- Exact Preview identity is direct from Vercel build logs, not inferred from an
  alias: `audit/rc1-360-agentic-qa` at `7f45178`, deployment
  `dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw`, Ready.
- Vercel CLI-authenticated requests prove `/setup` is application 404, health is
  sanitized, and `/command-center` redirects before protected content.
- Browser automation is rejected by Vercel Deployment Protection. No SSO
  credentials or protection bypass secret was available, and protection was not
  disabled.
- Unauthenticated GET probes return 401 for reports index, rice, DDS, executive
  briefing, compliance oversight, and donor programme.
- Static RLS review found `field_reports_read` and `geo_read` role grants without
  a geography predicate and `warehouse_transfer_orders_select` using
  `authenticated using (true)`. The transfer policy is a confirmed all-row
  exposure by policy definition; field/geo impact and the proposed replacement
  remain blocked on normal-user cross-county checks.
- The linked project remains unchanged at 11 remote migrations through
  `20260619120000`; the repository has one intentionally pending RLS migration.
  `analytics_events` is absent (`PGRST205`) and confirmed optional.
- No service-role RLS test, remote migration, user creation, or data mutation was
  performed.

SEC-14 is narrowed: migration parity is now proved, but restore evidence remains
blocked by the lack of an approved disposable destination.

## Pending RLS remediation

Migration `20260729220000_rc1_geography_rls_hardening.sql` is intentionally
unapplied. It:

- removes the globally permissive transfer SELECT and the `FOR ALL` policy;
- separates transfer policies by command;
- requires active profiles;
- scopes warehouse managers by assignment, DAO/CAC by related county, and
  cooperative/exporter reads to their own requested transfers;
- scopes field reports by author, district, county, or intended national/auditor
  oversight;
- scopes geo locations through the related farmer, including DAO district,
  CAC county, CLAN/field registration ownership, and organization boundaries.

Warehouse records have county but no district, so DAO transfer visibility can be
county-scoped only. This residual model limitation requires product/data-owner
acceptance. SQL contract tests are prepared, but live RLS is not passed.

## Workforce identity hardening

Migration `20260729230000_workforce_identity_provisioning.sql` is intentionally
unapplied. It replaces active default-role signup with an inactive/incomplete
profile, removes self-service role/status updates, adds explicit role
assignments and lifecycle fields, and constrains transactional role replacement
to protected service-role server code. Shared login controls and shared demo
credential seeding are disabled. Staging email flow and QA users remain blocked
pending operator approval.

## Optional analytics resolution

`analytics_events` is optional observability infrastructure. Known missing-table
codes (`PGRST205`, `42P01`) now return a quiet 204 `disabled` state; unexpected
permission/provider failures remain logged and return `degraded`. No analytics
migration was created or applied.
