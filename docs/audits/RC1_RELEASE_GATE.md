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
| Local auth/RBAC/browser smoke | PASS | Valid/invalid auth, logout, redirects, role nav |
| Responsive/mobile keyboard QA | PASS | Six exact requested sizes; no overflow; focus trap/Escape/restore |
| Data mutation truthfulness | PASS WITH CAVEAT | Fake actions blocked; DB transaction atomicity still open |
| Staging/production parity | FAIL | Deployed build is stale |
| Production setup route restricted | FAIL | `https://agrivaultdata.com/setup` returns 200 |
| Database migration parity | NOT PROVEN | No linked migration inspection applied in this audit |
| Backup/restore evidence | NOT PROVEN | No safe restore drill attached |
| Offline/GIS/device field QA | PARTIAL | Code/static review only; no field device certification |
| Observability | PARTIAL | Sentry builds pass but adds 88 kB shared JS and emits deprecations; analytics table absent locally and needs staging proof |

## Required actions before pilot approval

1. Resolve the full dependency audit or approve a time-boxed, dev-only exception with owner and expiry.
2. Deploy this exact commit to staging; rerun the agentic/browser suite and prove `/setup` returns 404.
3. Rotate or remove production training credentials and hide demo login controls unless training mode is explicitly enabled.
4. Verify remote migration parity, RLS by role/county, analytics table health, and transactional workflow behavior.
5. Attach a successful backup/restore drill and rollback plan.
6. Run staged axe/Lighthouse and representative offline/GIS device tests.
7. Only after all above pass: merge to `main`, push, deploy, and record the deployment SHA.

## Source-control decision

Controlled local commits on the audit branch are allowed. Merge to `main`, remote push, and deployment are prohibited by this gate until the failures above are closed.
