# RC1 Release Gate

## Verdict

**GO FOR INTERNAL DEMO. NO-GO for controlled pilot and production promotion.**

## Gate table

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| Clean release branch and known baseline | PASS | Dedicated audit branch at `c69b459` |
| Lint | PASS | Zero warnings |
| Typecheck/production build | PASS | Next 15.5.21; 134 static-generation steps; with and without Sentry DSN |
| Workflow/security unit checks | PASS | 29 + 11 |
| Production dependency audit | PASS | 0 vulnerabilities |
| Full dependency audit | FAIL | 9 high findings in development lint chain |
| Local core browser regression | PASS | 22 Playwright checks across desktop/mobile; setup, health, login keyboard, redirect, axe, unauth exports |
| Preview browser authentication | BLOCKED | Vercel/GitHub browser sessions are signed out and no bypass secret is available |
| Authenticated role matrix | NOT PROVEN | 62 route cases are harnessed but skip without designated environment-only credentials |
| Controlled-pilot prerequisites | BLOCKED | `PREVIEW_BASE_URL`, bypass secret, all eight QA credential pairs, and approved restore target are absent |
| Responsive/mobile keyboard QA | PASS | Six exact requested sizes; no overflow; focus trap/Escape/restore |
| Data mutation truthfulness | PASS WITH CAVEAT | Fake actions blocked; DB transaction atomicity still open |
| Preview identity | PASS | Ready deployment logs directly identify branch and commit `893860b` |
| Preview application core | PASS VIA CLI | CLI-authenticated `/setup` 404, health 200, login/home 200, command center 307 |
| Interactive preview console/network | BLOCKED | Browser reaches Vercel SSO, not AgriVault |
| Staging/production parity | FAIL | Production deployment is stale |
| Production setup route restricted | FAIL | `https://agrivaultdata.com/setup` returns 200 |
| Deployed database migration parity | PASS | Linked project remains 11/11 through `20260619120000` |
| Repository migration parity | PENDING | 12 local/11 remote after preparing unapplied RLS migration `20260729220000` |
| RLS behavior | FAIL / PENDING FIX | `USING (true)` exposes every transfer order to authenticated users; scoped migration prepared, not applied or live-tested |
| Backup/restore evidence | BLOCKED | Drill defined; no approved disposable AgriVault restore target |
| Offline replay/dedupe | NOT PROVEN | Requires authenticated CLAN preview context and authorized synthetic mutation |
| GIS/Mapbox | PARTIAL | Preview env/token and health config present; interactive rendering/CSP network behavior blocked |
| Protected exports | PARTIAL | Unauthenticated methods protected; unauthorized/authorized role matrix and files unproved |
| Observability | PARTIAL | Sentry builds pass but adds 88 kB shared JS and emits deprecations; analytics table absent locally and needs staging proof |
| Optional usage analytics | PASS LOCALLY | Missing table returns quiet 204 `disabled`; unexpected failures remain logged |

## Required actions before pilot approval

1. Resolve the full dependency audit or approve a time-boxed, dev-only exception with owner and expiry.
2. Provide browser access to the protected preview and designated scoped `QA_*` accounts; execute all 62 authenticated route cases plus role actions.
3. Rotate or remove production training credentials and hide demo login controls unless training mode is explicitly enabled.
4. Resolve or approve broad RLS policies and prove geography/read-only/fail-closed behavior using normal users; reconcile the absent analytics table.
5. Approve a disposable restore target and attach a successful drill with measured RTO.
6. Run staged axe/Lighthouse and representative offline replay/dedupe/GIS device tests.
7. Only after all above pass: merge to `main`, push, deploy, and record the deployment SHA.
8. Review and approve the pending RLS migration, apply it only to an approved
   disposable/staging project, run the SQL contract and normal-user two-geography
   matrix, then reconcile migration history.

## Source-control decision

Controlled commits and pushes to the audit branch are allowed for protected Preview verification. Merge or push to `main`, production deployment, and promotion are prohibited until the failures above are closed.
