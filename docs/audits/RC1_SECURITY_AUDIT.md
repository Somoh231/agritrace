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
| SEC-14 | P2 | No linked backup/restore or migration parity evidence | Produce staging restore drill and migration list |

## Dependency evidence

- Runtime/production audit: **0 vulnerabilities**.
- Full audit: **9 high**, all through ESLint/minimatch/brace-expansion development tooling.
- An ESLint 10 experiment was rejected because the official React lint plugin failed at runtime; correctness was preserved instead of suppressing the gate.

## Deployed evidence

The public site has CSP, HSTS, frame denial, content-type protection, permissions policy, and request IDs. Its HSTS header omits `includeSubDomains`, and its CSP retains unsafe script/style directives. More importantly, `/setup` returns 200 and the deployed login still reflects the pre-remediation build.

