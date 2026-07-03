# AgriVault RC1 — Known Limitations

**Version:** 0.1.0-rc1  
**Date:** 2026-07-03  
**Scope:** Constraints accepted for Ministry pilot deployment

These are documented behaviors, not bugs to fix during the pilot unless they block operations.

---

## Authentication and authorization

### CLAN post-login landing mismatch

- **Behavior:** `postLoginHomeForRole()` sends CLAN users to `/district-dashboard`; denial redirects use `/field/mobile`.
- **Impact:** CLAN technicians land on the DAO desk after login instead of the field mobile view.
- **Workaround:** Navigate to `/field/mobile` or `/workspace/clan` after login. Administrator can share bookmark.

### Call center agent landing conflict

- **Behavior:** `call_center_agent` post-login targets `/verification-queue`, but middleware denies verification queue access for this role.
- **Impact:** User is redirected away immediately after login.
- **Workaround:** Assign `activity` or `search` as manual landing; fix planned post-pilot.

### Exporter cocoa route conflict

- **Behavior:** `exporter` post-login targets `/cocoa/lots`, but `/cocoa/*` requires `canAccessSubsidiesAndProduction()` which excludes `exporter`.
- **Impact:** Exporter users may be redirected on cocoa routes.
- **Workaround:** Use `/farmers` directly; exporter is outside core pilot chain.

### Workspace role switcher is UI-only

- **Behavior:** Topbar role preview sets an httpOnly cookie; server APIs use session profile role only.
- **Impact:** Switching role in UI does not change server permissions — workflow buttons may appear enabled but API rejects.
- **Workaround:** Sign in with the correct demo/production account for each role demo.

### Supabase-unset auth bypass

- **Behavior:** If `NEXT_PUBLIC_SUPABASE_URL` or anon key is missing, middleware skips authentication entirely.
- **Impact:** Local dev without env vars has no auth gate.
- **Workaround:** Never deploy without Supabase env vars configured.

### Permissive compliance and farmers routes

- **Behavior:** `/compliance`, `/farmers`, `/cooperatives`, `/farm-profiles` allow any authenticated non-donor user.
- **Impact:** CLAN users can view registry data beyond their capture scope.
- **Workaround:** Acceptable for pilot; tighten post-pilot if needed.

### Reports routes lack role gate

- **Behavior:** `/reports/*` pages require authentication but no role-specific middleware gate.
- **Impact:** Any authenticated user can navigate to report URLs directly.
- **Workaround:** Nav hides reports from unauthorized roles; server PDF auth varies by endpoint.

---

## Workflow and data

### Verification queue merges demo and live data

- **Behavior:** `VerificationQueueWorkspace` assembles demo `VRF-*` fixtures with live `operational_submissions` client-side.
- **Impact:** Queue may show training items alongside real submissions; counts may not match Supabase row count.
- **Workaround:** Check **Data Source** badge on each row; prioritize items with LIVE badge and real UUID `submissionId`.

### Dual transfer model

- **Behavior:** Transfer counts may come from `warehouse_transfer_orders`, `inventory_movements`, or canonical fixtures depending on surface.
- **Impact:** Transfer totals on different dashboards may not match.
- **Workaround:** Use one authoritative surface per report; note source in briefing materials.

### Demo fixtures in CAC approval queues

- **Behavior:** `CaoApprovalQueues` merges seeded demo items with live submissions.
- **Impact:** Approve actions on demo-only items (no real UUID) do not persist.
- **Workaround:** Only action items with valid `submissionId` UUIDs during live pilot.

### Donor and inventory receipt forms not workflow-bridged

- **Behavior:** `RecordInventoryReceiptForm` and `RecordDonorShipmentForm` do not create `operational_submissions`.
- **Impact:** Receipt events lack workflow audit trail.
- **Workaround:** Use transfer confirmation workflow for warehouse movements; donor verification via fixtures for demo.

### Food security UI blends demo KPIs

- **Behavior:** `/food-security` displays blended demo and live production data.
- **Impact:** KPI numbers may include DEMO source.
- **Workaround:** Cross-reference with `harvest_report` submissions and Data Source badge.

### Warehouse/cooperative/exporter workflow stage

- **Behavior:** `warehouse_manager`, `cooperative_manager`, `exporter` map to `"donor"` workflow stage (read-only).
- **Impact:** These roles cannot approve workflow items even if they reach verification queue URLs.
- **Workaround:** Expected — logistics roles are outside approval chain.

---

## Offline

### Sync queue page is informational

- **Behavior:** `/field/sync-queue` provides guidance but no live IndexedDB queue table.
- **Impact:** Users cannot inspect individual pending items on this page.
- **Workaround:** Use topbar **Sync Status** indicator for pending count; CLAN workspace shows offline KPI.

### Edge Function dependency

- **Behavior:** Offline sync requires Supabase Edge Function `sync-batch` deployed.
- **Impact:** Sync fails silently or retries if function unavailable.
- **Workaround:** Confirm Edge Function deployment before field week; monitor Supabase logs.

### Five-retry manual review

- **Behavior:** After 5 failed sync attempts, items flag as `manual_review`.
- **Impact:** Items do not auto-retry further.
- **Workaround:** DAO re-submits from district dashboard or administrator clears queue.

### Offline boundary double-bridge (deduped)

- **Behavior:** Boundary submission created at queue time and again after sync.
- **Impact:** None if dedupe key present; duplicate workflow row if dedupe key missing.
- **Workaround:** Ensure plot has `client_id` before offline capture.

---

## GIS

### Mapbox token required

- **Behavior:** Without `NEXT_PUBLIC_MAPBOX_TOKEN`, map surfaces show token-missing state.
- **Impact:** GPS boundary capture and operational maps non-functional.
- **Workaround:** Configure token before pilot; test on staging.

### GIS intelligence is experimental

- **Behavior:** `/gis-intelligence` limited to Ministry + CAC; marked advanced/experimental.
- **Impact:** Not part of core CLAN/DAO pilot workflow.
- **Workaround:** Use `/map` and `/geo-registry` for standard GIS needs.

### GPS accuracy in field

- **Behavior:** Device GPS accuracy varies; warnings shown below 10 m threshold.
- **Impact:** Boundaries may be imprecise under tree cover.
- **Workaround:** Capture in open areas; re-capture if accuracy poor.

---

## Reports and exports

### Four PDF routes lack authentication

| Route | Risk |
|-------|------|
| `GET /api/reports/compliance-oversight` | Unauthenticated PDF generation |
| `GET /api/reports/donor-programme` | Unauthenticated PDF generation |
| `POST /api/reports/rice` | Unauthenticated PDF/CSV generation |
| `POST /api/reports/dds` | Unauthenticated PDF generation |

- **Impact:** Anyone with the URL can generate PDFs if deployed publicly.
- **Workaround:** Do not expose these URLs in public materials; add auth post-pilot. Executive briefing PDF **is** authenticated.

### No data-source badge on executive briefing

- **Behavior:** Executive briefing may blend LIVE and DEMO KPIs without per-metric badge.
- **Impact:** Briefing numbers may include illustrative data.
- **Workaround:** Verbal disclaimer during pilot presentations; cross-check command center badges.

---

## Security

### Partial rate limiting

- **Behavior:** Rate limits enforced on 5 routes only; in-memory store (not distributed).
- **Impact:** Abuse possible on unprotected API routes; limits reset per Vercel instance.
- **Workaround:** Monitor logs; add KV store post-pilot.

### No CAPTCHA on demo inquiry

- **Behavior:** `POST /api/demo-inquiry` is public with 10/min rate limit only.
- **Impact:** Spam submissions possible.
- **Workaround:** Acceptable for pilot staging; add CAPTCHA before public marketing launch.

### No global error boundary

- **Behavior:** `global-error.tsx` not implemented.
- **Impact:** Unhandled root errors may show generic Next.js error page.
- **Workaround:** Route-level `error.tsx` exists for dashboard; low pilot risk.

### AI assistant disabled

- **Behavior:** `AiAssistant` component disabled for pilot.
- **Impact:** No in-app AI help.
- **Workaround:** Use role guides and demo script.

---

## Performance

### Heavy dashboard pages

- **Behavior:** `/county-dashboard` (212 kB) and `/gis-intelligence` (196 kB) First Load JS.
- **Impact:** Slower initial load on low-bandwidth field connections for county/GIS users.
- **Workaround:** Pre-load on Wi-Fi; PWA caches shell after first visit.

### No Lighthouse performance budget

- **Behavior:** No CI enforcement of Core Web Vitals thresholds.
- **Impact:** Performance regressions not automatically caught.
- **Workaround:** Manual Lighthouse run before scale-up.

### Unused Workbox dependencies

- **Behavior:** `workbox-*` packages in `package.json` but custom `public/sw.js` used instead.
- **Impact:** Slightly larger `node_modules`; no runtime impact.
- **Workaround:** Remove unused deps post-pilot.

---

## Testing

### Single test file

- **Behavior:** Only `workflow.spec.ts` (29 checks); no E2E, integration, or RLS tests.
- **Impact:** UI regressions and Supabase policy gaps not automatically detected.
- **Workaround:** Manual QA per [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md).

### No Playwright or Jest suite

- **Behavior:** No browser automation or component tests.
- **Impact:** Route and role gate regressions require manual verification.
- **Workaround:** Re-run build + pilot checklist after each deploy.

---

## Environment-specific

### Activity center limited roles

- **Behavior:** `/activity` accessible to Ministry national + `call_center_agent` only.
- **Impact:** DAO/CAC cannot view national activity feed.
- **Workaround:** Use role-specific dashboards for operational awareness.

### County operations route ungated

- **Behavior:** `/county-operations` requires auth but no role-specific middleware gate.
- **Impact:** Any authenticated user can access.
- **Workaround:** Low pilot traffic; tighten post-pilot.

---

## Summary matrix

| Category | Limitation count | Pilot blocking? |
|----------|-----------------|-----------------|
| Auth / roles | 6 | No (workarounds exist) |
| Workflow / data | 6 | No |
| Offline | 4 | No (Edge Function must be deployed) |
| GIS | 3 | Yes if Mapbox token missing |
| Reports | 2 | No for pilot (auth gap is post-pilot) |
| Security | 4 | No for controlled pilot |
| Performance | 3 | No |
| Testing | 2 | No (manual QA compensates) |

**Pilot go/no-go:** Proceed if Mapbox token and Supabase Edge Function are configured. All other limitations have documented workarounds.
