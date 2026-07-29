# RC1 Agentic QA Report

## Environments

| Environment | Target | Result |
| --- | --- | --- |
| Local production build | `http://127.0.0.1:3000` | Remediated branch validated |
| Protected preview | `dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw` | Ready; final audit-branch core verified; interactive browser blocked by Vercel SSO |
| Deployed production | `https://agrivaultdata.com` | Stale build; release blocker confirmed |
| Linked Supabase | `MOA Farm Traceability` | 11 remote migrations unchanged; one local RLS migration intentionally pending; no remote mutation |

## Automated gates

| Gate | Result |
| --- | --- |
| ESLint | Pass, zero warnings |
| Clean install | Pass; 688 packages installed, Node engine mismatch warning recorded |
| Workflow tests | 29/29 pass |
| Security tests | 13/13 pass |
| Next production build/typecheck | Pass without DSN and with a non-secret Sentry test DSN |
| Production dependency audit | 0 vulnerabilities |
| Full dependency audit | Fail: 9 high, development lint chain |
| Route inventory | 147 records generated |
| RC1 Playwright core | 22/22 pass at 1440×900 and 390×844; 62 authenticated cases skip without `QA_*` credentials |

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

### Protected preview

| Route | Status / redirect | Host and content | Source | Browser result |
| --- | --- | --- | --- | --- |
| `/setup` | 404 | deployment host; `text/html`; title `Agrivault` | AgriVault (`x-matched-path: /setup`), no setup form | Blocked at Vercel authentication |
| `/api/health` | 200 | deployment host; `application/json`; no page title | AgriVault; sanitized app/Supabase/Mapbox checks | Not exercised interactively |
| `/api/analytics` | 204 | deployment host; zero-byte body; explicit `disabled` header | AgriVault optional observability | Not exercised interactively |
| Six report endpoints | 401 | deployment host; `application/json` | AgriVault authentication boundary | Not exercised interactively |
| `/login` | 200 | deployment host; `text/html`; title `Agrivault` | AgriVault | Blocked at Vercel authentication |
| `/` | 200 | deployment host; `text/html`; title `Agrivault Data — National agricultural intelligence` | AgriVault | Blocked at Vercel authentication |
| `/command-center` | 307 → `/login?redirectTo=%2Fcommand-center` | deployment host; no protected body rendered | AgriVault middleware | Blocked at Vercel authentication |

Build logs are direct identity evidence: project `agritrace`, Preview, branch
`audit/rc1-360-agentic-qa`, commit `7f45178`, status Ready, deployment
`dpl_E86xDN1oHoNcbrq6DqQSSCUdJDWw`. Preview environment variable names required
for Supabase and Mapbox are present; values were not printed.

### Production

1. `/setup` restriction — **fail; HTTP 200 on 2026-07-29**.
2. Public/protected routing reflects the stale pre-remediation build.
3. Security headers are present, but CSP includes unsafe directives and HSTS
   lacks `includeSubDomains`.

## Role QA matrix

| Role | Harness coverage | Live preview result |
| --- | --- | --- |
| CLAN | 6 desktop + 6 mobile routes | Blocked: no designated credentials/protected browser access |
| DAO | 4 + 4 routes | Blocked |
| CAC | 3 + 3 routes | Blocked |
| Ministry | 5 + 5 routes | Blocked |
| Admin | 5 + 5 routes | Blocked |
| Auditor | 3 + 3 routes | Blocked |
| Donor | 2 + 2 routes | Blocked |
| Exporter | 3 + 3 routes | Blocked |

These 62 cases are skipped, not passed. No role mutation, synthetic record
creation, or normal-user RLS proof was performed against the linked project.

## Export probes

- Preview GET for reports index, rice, DDS, executive briefing, compliance
  oversight, and donor programme returns 401 JSON.
- The final deployed GET handlers for rice and DDS authenticate/authorize before
  returning their authorized method response; local desktop/mobile regression
  passes.
- Unauthorized and authorized preview role/file matrices remain unproved.

## Browser QA limitations

- No real workflow mutation, file import, user change, or destructive operation was authorized or performed.
- **BLOCKED — VERCEL DEPLOYMENT PROTECTION AUTHENTICATION UNAVAILABLE** for
  interactive preview navigation; the browser reaches Vercel/GitHub sign-in.
- GIS rendering, offline disconnection/sync replay/dedupe, authorized PDF/CSV
  content, Lighthouse, and assistive-technology speech output were not passed.
- CLI-authenticated HTTP results must not be interpreted as browser
  console/network, role, offline, GIS, or accessibility evidence.

## Controlled-pilot prerequisite audit

The following are absent without inspecting or printing values:

- `PREVIEW_BASE_URL` and `VERCEL_AUTOMATION_BYPASS_SECRET`.
- CLAN, DAO, CAC, Ministry, Admin, Auditor, Donor, and Exporter email/password
  pairs.
- An approved disposable AgriVault restore project and restore credentials.

Vercel Preview contains only the application/Supabase/Mapbox/Anthropic variable
names already documented; it has no bypass or `QA_*` variables. Unrelated
Supabase projects were not treated as disposable.

## Unaffected continuation results

- Optional analytics: local production-mode POST returns 204, zero-byte body,
  and `X-Agrivault-Analytics-Status: disabled`; no provider error is logged.
- Transfer policy: `warehouse_transfer_orders_select using (true)` is confirmed
  as all-row exposure to authenticated sessions. The permissive `FOR ALL` write
  policy also contributes to SELECT for its roles.
- A pending migration replaces transfer `FOR ALL` with separate SELECT/INSERT/
  UPDATE/DELETE policies, requires an active profile, and scopes by national
  role, warehouse assignment, related county, or requester as appropriate.
- Field report reads/writes and geo reads/inserts are narrowed to officer,
  district/county, registered farmer, organization, or national/auditor scope.
- Static migration contract passes. The SQL applied-schema contract and live
  normal-user matrix are blocked and the migration was not applied.
