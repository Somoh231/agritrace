# RC1 Agentic QA Report

## Environments

| Environment | Target | Result |
| --- | --- | --- |
| Local production build | `http://127.0.0.1:3000` | Remediated branch validated |
| Deployed production | `https://agrivaultdata.com` | Stale build; release blocker confirmed |
| Database | Repository migrations only | No remote mutation or certification |

## Automated gates

| Gate | Result |
| --- | --- |
| ESLint | Pass, zero warnings |
| Workflow tests | 29/29 pass |
| Security tests | 11/11 pass |
| Next production build/typecheck | Pass without DSN and with a non-secret Sentry test DSN |
| Production dependency audit | 0 vulnerabilities |
| Full dependency audit | Fail: 9 high, development lint chain |
| Route inventory | 147 records generated |

## Local browser scenarios

1. Public landing shell, landmarks, headings, buttons, and overflow — pass.
2. Protected `/command-center` redirect to login with encoded return path — pass.
3. Invalid authentication error — pass.
4. Ministry demo login and redirect — pass.
5. Logout and session removal — pass.
6. Exporter login/landing — pass.
7. Exporter direct `/admin/users` denial — pass.
8. Exporter sidebar no longer advertises national/admin routes — pass after Wave 2 repair.
9. Mobile navigation dialog focus, Escape, and focus restoration — pass.
10. Exact responsive viewport checks at 1440×900, 1280×800, 1024×768, 768×1024, 390×844, and 360×800 — pass.
11. Verification/CAC/transfer empty live states — stable; no fake mutation executed.
12. Browser console errors/warnings — none on sampled local routes.

Each exact viewport reported the requested `window.innerWidth`/`window.innerHeight`, one H1, one main landmark, zero visible unlabeled buttons, and `scrollWidth === clientWidth`.

## Deployed scenarios

1. Public landing — pass.
2. Protected command-center redirect — pass.
3. Demo authentication — pass.
4. `/setup` production restriction — **fail; returns 200**.
5. Login label semantics — **fail relative to remediated branch**.
6. Security headers — present, but CSP includes unsafe directives and HSTS lacks `includeSubDomains`.

## Browser QA limitations

- No real workflow mutation, file import, user change, or destructive operation was authorized or performed.
- GIS token rendering, offline disconnection/sync replay, PDF download content, and assistive-technology speech output were not fully exercised.
- A complete all-route authenticated crawl was not performed; the generated route matrix supplies static coverage and risk routing.
