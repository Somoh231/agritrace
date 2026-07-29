# RC1 Release Gate

## Verdict

**GO FOR INTERNAL DEMO. NO-GO for controlled pilot and production promotion.**

## Gate table

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| Clean release branch and known baseline | PASS | Dedicated audit branch at `c69b459` |
| Lint | PASS | Zero warnings |
| Typecheck/production build | PASS | Next 15.5.21; 134 static-generation steps; with and without Sentry DSN |
| Workflow/security unit checks | PASS | 29 + 16 |
| Production dependency audit | PASS | 0 vulnerabilities |
| Full dependency audit | FAIL | 9 high findings in development lint chain |
| Local core browser regression | PASS | 26 Playwright checks across desktop/mobile; setup, health, login keyboard, redirect, axe, unauth exports |
| Preview browser authentication | BLOCKED | Vercel/GitHub browser sessions are signed out and no bypass secret is available |
| Authenticated role matrix | NOT PROVEN | 62 route cases are harnessed but skip without designated environment-only credentials |
| Controlled-pilot prerequisites | BLOCKED | `PREVIEW_BASE_URL`, bypass secret, all eight QA credential pairs, and approved restore target are absent |
| Responsive/mobile keyboard QA | PASS | Six exact requested sizes; no overflow; focus trap/Escape/restore |
| Data mutation truthfulness | PASS WITH CAVEAT | Fake actions blocked; DB transaction atomicity still open |
| Preview identity | PASS | Ready deployment `dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw` directly identifies branch and commit `7f45178` |
| Preview application core | PASS VIA CLI | CLI-authenticated `/setup` 404, health 200, command center 307, six unauthenticated reports 401, analytics 204 `disabled` |
| Interactive preview console/network | BLOCKED | Browser reaches Vercel SSO, not AgriVault |
| Staging/production parity | FAIL | Production deployment is stale |
| Production setup route restricted | FAIL | `https://agrivaultdata.com/setup` returns 200 |
| Deployed database migration parity | PASS | Linked project remains 11/11 through `20260619120000` |
| Repository migration parity | PENDING | 13 local/11 remote after preparing unapplied RLS `20260729220000` and workforce identity `20260729230000` migrations |
| RLS behavior | FAIL / PENDING FIX | `USING (true)` exposes every transfer order to authenticated users; scoped migration prepared, not applied or live-tested |
| Backup/restore evidence | BLOCKED | Drill defined; no approved disposable AgriVault restore target |
| Offline replay/dedupe | NOT PROVEN | Requires authenticated CLAN preview context and authorized synthetic mutation |
| GIS/Mapbox | PARTIAL | Preview env/token and health config present; interactive rendering/CSP network behavior blocked |
| Protected exports | PARTIAL | Unauthenticated methods protected; unauthorized/authorized role matrix and files unproved |
| Observability | PARTIAL | Sentry builds pass but adds 88 kB shared JS and emits deprecations |
| Optional usage analytics | PASS PREVIEW | Missing table returns quiet 204 `disabled` with an explicit status header; unexpected failures remain logged |
| Workforce identity architecture | PASS LOCALLY / PENDING MIGRATION | Invitation-only server flow, explicit roles, fail-closed readiness, activation/deactivation, recovery and audit coverage implemented; staging schema/email flow unproved |

## Required actions before pilot approval

1. Resolve the full dependency audit or approve a time-boxed, dev-only exception with owner and expiry.
2. Provide browser access to the protected preview and designated scoped `QA_*` accounts; execute all 62 authenticated route cases plus role actions.
3. Rotate or remove production training credentials and hide demo login controls unless training mode is explicitly enabled.
4. Review the pending RLS migration, apply it only to approved disposable/staging infrastructure, and prove geography/read-only/fail-closed behavior using normal users.
5. Approve a disposable restore target and attach a successful drill with measured RTO.
6. Run staged axe/Lighthouse and representative offline replay/dedupe/GIS device tests.
7. Only after all above pass: merge to `main`, push, deploy, and record the deployment SHA.
8. Review and approve the pending RLS migration, apply it only to an approved
   disposable/staging project, run the SQL contract and normal-user two-geography
   matrix, then reconcile migration history.
9. Review and apply `20260729230000_workforce_identity_provisioning.sql` only to
   approved staging, configure exact Auth redirects/SMTP, provision unique QA
   users, and execute `RC1_WORKFORCE_IDENTITY.md`.

## Source-control decision

Controlled commits and pushes to the audit branch are allowed for protected Preview verification. Merge or push to `main`, production deployment, and promotion are prohibited until the failures above are closed.
