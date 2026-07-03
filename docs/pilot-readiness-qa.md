# Pilot Readiness QA Report

**Date:** 2026-07-02  
**Scope:** Operational workflow QA (CLAN → DAO → CAC → Ministry) — code review, route inventory, auth policy audit, build validation. No feature additions or UI redesign.

---

## Routes tested (inventory + static validation)

| Route | Page exists | Middleware auth | Role gate | Notes |
|-------|-------------|-----------------|-----------|-------|
| `/login` | ✅ | Public | — | Redirects authenticated users via app logic |
| `/workspace/clan` | ✅ | ✅ | Workspace assert | CLAN/DAO/CAC/Ministry preview |
| `/field/boundary-capture` | ✅ | ✅ | `/field` policy | Full-bleed map layout |
| `/field/mobile` | ✅ | ✅ | `/field` policy | Field report capture |
| `/field/inspections` | ✅ | ✅ | `/field` policy | Inspection queue |
| `/field/sync-queue` | ✅ | ✅ | `/field` policy | Offline queue surface |
| `/workspace/dao` | ✅ | ✅ | Workspace assert | DAO review hub |
| `/district-dashboard` | ✅ | ✅ | District assert | CLAN/DAO/CAC/Ministry |
| `/workspace/cac` | ✅ | ✅ | Workspace assert | CAC verification hub |
| `/county-dashboard` | ✅ | ✅ | County assert | CAC + Ministry |
| `/workspace/ministry` | ✅ | ✅ | Ministry only | National command |
| `/command-center` | ✅ | ✅ | Ministry national | |
| `/national-operations` | ✅ | ✅ | Ministry national | |
| `/national-heat-map` | ✅ | ✅ | Operational chain | No donor/auditor |
| `/map` | ✅ | ✅ | Pilot GIS | Mapbox token gated in UI |
| `/farmers` | ✅ | ✅ | Non-donor | Registry grid |
| `/cooperatives` | ✅ | ✅ | Non-donor | |
| `/inventory` | ✅ | ✅ | Logistics roles | |
| `/operations/warehouses` | ✅ | ✅ | Logistics roles | |
| `/transfers` | ✅ | ✅ | Logistics roles | Workflow API |
| `/food-security` | ✅ | ✅ | Operational chain | |
| `/reporting/workspace` | ✅ | ✅ | Reporting hub | Tab query `?tab=` |
| `/verification-queue` | ✅ | ✅ | DAO/CAC/Ministry | Workflow buttons |
| `/admin/users` | ✅ | ✅ | Admin console | `admin/layout` guard |
| `/activity` | ✅ | ✅ | Ministry + call center | |

**Sidebar link audit:** All `ministry-nav.ts` hrefs resolve to existing `page.tsx` routes (automated check — 0 missing).

---

## Role workflows reviewed

### CLAN (`clan_technician` / `field_agent`)
- Landing: `/field/mobile` (middleware `pilotRoleLandingPath`)
- Workspace quick actions → boundary capture, farmers registry, field mobile
- Field routes allowed via `isDaoWorkspaceRole` (includes CLAN)
- Verification queue **denied** (correct — review is DAO+)
- Offline queue linked from workspace + reporting drafts tab

### DAO (`dao_officer` / `district_officer`)
- Landing: `/district-dashboard`
- Workspace queues → verification, inspections, registration approvals, reporting tabs
- Verification workflow buttons gated by `OperationalActor` persona + server API
- Cannot access `/command-center` (redirect to district dashboard)

### CAC (`county_agriculture_coordinator` / `county_officer`)
- Landing: `/county-dashboard`
- Workspace → verification queue, county dashboard, escalations, executive briefing
- County dashboard + national heat map accessible
- Ministry workspace denied (redirect to county dashboard)

### Ministry (`ministry_admin` / `ministry_officer`)
- Landing: `/command-center`
- Full national command, ministry workspace, activity center, admin (if admin role)
- Verification + transfers + reporting workspace accessible

### Donor / Auditor
- Donor → `/donor-dashboard`; auditor → `/audit-tools`
- Denied national command, verification queue, logistics (middleware)
- Farmers/cooperatives readable for donor (policy); workflow mutations server-enforced

### Demo-role switching
- Topbar `WorkspaceRoleSwitcher` → `/api/workspace-demo-role` (auth required, httpOnly cookie)
- Effective role drives sidebar + `OperationalActorProvider` for UI permissions
- Server APIs always use session profile (not client role)

---

## Checklist results

| # | Area | Result |
|---|------|--------|
| 1 | Auth & role redirects | ✅ Policy consistent in `middleware.ts` + page asserts |
| 2 | Sidebar links | ✅ All hrefs valid |
| 3 | Topbar actions | ✅ Fixed PDF export target (see bugs) |
| 4 | Workflow buttons | ✅ Fixed actor context (see bugs) |
| 5 | Offline queue states | ✅ Surfaces present; sync via `SyncStatusIndicator` + `/field/sync-queue` |
| 6 | GPS/boundary layout | ✅ `layout-mode` map + dynamic import SSR off |
| 7 | Map rendering | ✅ Token guard + loading skeletons; no duplicate map panels |
| 8 | Form submission | ✅ Boundary capture queues to IndexedDB; API auth on mutations |
| 9 | Loading states | ✅ Verification queue skeleton; map pulse loaders |
| 10 | Empty states | ✅ Verification `EmptyState`; grid empty copy |
| 11 | Error states | ✅ Dashboard + global `error.tsx`; verification `AlertCard` |
| 12 | Export/download | ✅ Fixed executive briefing PDF route |
| 13 | Mobile/tablet layout | ✅ Topbar mobile nav drawer; responsive grids |
| 14 | Console errors | ✅ Removed spurious dashboard `console.error` noise |
| 15 | Hydration warnings | ✅ Fixed CLAN workspace session/network SSR mismatch |
| 16 | API errors | ✅ Generic errors on data routes (prior hardening pass) |
| 17 | Broken links | ✅ Fixed `briefing-snapshot` 404 |
| 18 | Permission leaks | ✅ Executive briefing PDF now requires auth |
| 19 | Donor/auditor read-only | ✅ Middleware + UI alerts on verification desk |
| 20 | Demo-role switching | ✅ Cookie httpOnly + auth on API (prior hardening pass) |

---

## Bugs found

| ID | Severity | Description |
|----|----------|-------------|
| QA-1 | **High** | `OperationalActorProvider` was commented out in `DashboardShell` while `VerificationQueueWorkspace` and `MinistryTransfersWorkspace` call `useOperationalActor()`. UI defaulted to `demoOperationalActor()` (`national_admin`), causing incorrect workflow button enable/disable for DAO/CAC desks. |
| QA-2 | **High** | Topbar PDF export pointed to non-existent `/api/reports/briefing-snapshot` → 404. |
| QA-3 | **Medium** | `/api/reports/executive-briefing` served PDF without authentication. |
| QA-4 | **Medium** | CLAN workspace rendered `Date.now()` session ID and `navigator.onLine` during SSR, risking hydration mismatch. |
| QA-5 | **Low** | Dashboard shell logged `console.error` on every mount for “crash isolation” — polluted browser console during demos. |

---

## Bugs fixed

| ID | Fix | Files |
|----|-----|-------|
| QA-1 | Re-enabled `OperationalActorProvider` with `resolveOperationalActor(profile)` including workspace preview role | `src/components/layout/DashboardShell.tsx` |
| QA-2 | Export PDF href → `/api/reports/executive-briefing` | `src/components/layout/DashboardShell.tsx` |
| QA-3 | Require authenticated session on executive briefing PDF GET | `src/app/api/reports/executive-briefing/route.ts` |
| QA-4 | Defer session ID + online status to `useEffect` (client-only) | `src/components/workspace/ClanWorkspaceClient.tsx` |
| QA-5 | Removed debug `console.error` effects from dashboard shell | `src/components/layout/DashboardShell.tsx` |

---

## Unresolved risks (documented — not fixed in this pass)

| Risk | Impact | Mitigation for demo |
|------|--------|---------------------|
| Verification queue data is client-assembled (demo + canonical) | Queue may not reflect live Supabase rows | State “pilot dataset” in narrative; use seeded demo flow |
| Dual transfer model (`warehouse_transfer_orders` vs `inventory_movements`) | Inventory and transfers may show different counts | Demo transfers route only; explain as workflow vs ledger |
| `/field/sync-queue` is informational (no live IndexedDB table UI) | Operators see description, not queue depth | Use CLAN workspace offline KPI + `SyncStatusIndicator` |
| Mapbox requires `NEXT_PUBLIC_MAPBOX_TOKEN` | Maps show token-missing state without env | Set token in Vercel preview + demo env |
| `AiAssistant` still disabled | No in-app AI during demo | Optional; not part of pilot chain |
| Activity center limited to ministry + call center | DAO/CAC redirected if they bookmark `/activity` | Use workspace queues instead |
| No enforced API rate limits | Public `demo-inquiry` could be abused | Monitor; add KV limits post-pilot |
| CSP not configured | Relies on frame deny + same-origin | Acceptable for controlled demo |

---

## Validation run

```bash
npm run lint        # pass
npm run build       # pass (150 routes)
npm run test:workflow  # 21/21 pass
```

---

## Recommended manual test script (demo day)

### Setup (5 min)
1. Confirm `.env.local` / Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`.
2. Seed ministry canonical data if live tables empty: `npm run seed:ministry`.
3. Prepare four browser profiles (or use workspace role switcher on one ministry account).

### Act 1 — CLAN field capture (8 min)
1. Log in as **CLAN** (`clan_technician`).
2. Open `/workspace/clan` — confirm GPS strip, offline queue count, quick actions.
3. `/field/boundary-capture?farmer=<uuid>` — capture 3+ corners, queue offline, confirm toast.
4. `/farmers` — open register drawer, submit farmer (or show queued state).
5. `/field/mobile` — show field report form.
6. `/field/sync-queue` — confirm offline guidance + link to field agents.

### Act 2 — DAO district review (8 min)
1. Switch to **DAO** (`dao_officer`) or log in separately.
2. `/workspace/dao` — open verification queue link.
3. `/verification-queue` — expand row, confirm **Approve / Reject / Escalate** buttons match DAO role (not all disabled).
4. Approve one item — confirm optimistic update + no workflow error banner.
5. `/district-dashboard` — confirm district KPIs load.
6. `/field/inspections` — confirm inspection grid loads.

### Act 3 — CAC county verification (8 min)
1. Switch to **CAC** (`county_agriculture_coordinator`).
2. `/workspace/cac` — county queues and escalations links.
3. `/county-dashboard` — county map + DAO oversight panels.
4. `/verification-queue` — escalate an item; confirm status pipeline updates.
5. `/reporting/workspace?tab=cac` — follow link cards to county surfaces.

### Act 4 — Ministry national command (8 min)
1. Switch to **Ministry** (`ministry_officer`).
2. `/workspace/ministry` — national KPI strip.
3. `/command-center` + `/national-operations` — national posture.
4. `/national-heat-map` + `/map` — confirm Mapbox layers render (or token warning).
5. `/reporting/workspace?tab=escalated` → `/alerts`.
6. Topbar **Export PDF** — confirm PDF download (not 404).
7. `/transfers` — expand custody panel, confirm workflow controls for ministry persona.

### Act 5 — Governance spot checks (5 min)
1. **Donor** login → confirm redirect away from `/verification-queue` to `/donor-dashboard`.
2. **Auditor** → `/audit-tools`; confirm read-only posture.
3. `/admin/users` as ministry admin — grid loads.
4. Toggle workspace preview role in topbar → confirm sidebar updates, then reset to authentic role.

### Regression smoke (2 min)
- Hard refresh `/workspace/clan` — no hydration warning in console.
- Offline: DevTools → Network offline → CLAN workspace shows “Offline — drafts saved”.

---

## Commit

`chore: pilot readiness QA pass`
