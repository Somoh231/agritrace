# AgriVault Live Demo Runbook

**Duration:** 30–45 minutes  
**Audience:** Ministry leadership, county agriculture teams, donor partners, technical reviewers  
**Version:** RC1 · 2026-07-03  
**Presenter:** Pilot administrator or programme lead

This runbook is the operator script for a live session. For a longer narrative demo (45–60 min), see [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

---

## Table of contents

1. [Narrative arc](#narrative-arc)
2. [Pre-demo setup](#pre-demo-setup)
3. [Browser and device checklist](#browser-and-device-checklist)
4. [Login roles](#login-roles)
5. [Route order and timing](#route-order-and-timing)
6. [Act-by-act script](#act-by-act-script)
7. [Talking points](#talking-points)
8. [Known limitations to acknowledge](#known-limitations-to-acknowledge)
9. [Fallback plans](#fallback-plans)
10. [Closing questions for the Ministry](#closing-questions-for-the-ministry)

---

## Narrative arc

> A CLAN technician captures farmer data in the field — offline if needed. The DAO reviews at district level. The CAC verifies at county level. Ministry approves nationally and produces cabinet-ready reports. Every step is auditable.

```
CLAN capture → DAO review → CAC verify → Ministry approve → Executive report
```

---

## Pre-demo setup

Complete **24 hours before** the session.

| # | Task | Verify |
|---|------|--------|
| 1 | Deployment URL loads (`/health` returns green) | ☐ |
| 2 | `npm run seed:demo` run on target environment | ☐ |
| 3 | `NEXT_PUBLIC_MAPBOX_TOKEN` set and maps load on staging | ☐ |
| 4 | Supabase Edge Function `sync-batch` deployed | ☐ |
| 5 | Executive briefing PDF downloads when logged in as Ministry | ☐ |
| 6 | At least one item in `/verification-queue` with LIVE badge and UUID `submissionId` (submit from DAO form if empty) | ☐ |
| 7 | Projector / second screen tested | ☐ |
| 8 | Backup slides or screenshots of map + queue (if live demo risky) | ☐ |
| 9 | CAC and CLAN pilot accounts provisioned **or** plan to use Ministry account for county/field routes | ☐ |
| 10 | Presenter bookmarks prepared (see [Login roles](#login-roles)) | ☐ |

**Engineering smoke:** `npm run lint && npm run build && npm run test:workflow` — see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## Browser and device checklist

**30 minutes before** the session.

| Item | Recommendation |
|------|----------------|
| Browser | Chrome or Edge (latest) — required for PWA install demo |
| Window layout | Presenter laptop → projector; optional phone for field view |
| Tabs pre-opened | Login, command center, district dashboard, county dashboard, verification queue |
| Location permission | Granted for presenter device (GPS demo) |
| Network | Wi-Fi primary; phone hotspot as backup |
| Zoom / font | 110–125% if audience is at distance |
| Incognito | **Do not use** — breaks session cookies between role switches |
| Log out | Clear all demo sessions before audience arrives |

**Optional field prop:** Android phone with PWA installed for offline segment (Act 2).

---

## Login roles

### Seeded demo accounts (`npm run seed:demo`)

Password for all: `DemoPass!2026`

| Role | Email | Lands on | Use in demo |
|------|-------|----------|-------------|
| Ministry Officer | `demo-ministry@agritrace.demo` | `/command-center` | Acts 1, 5, 6; can open county + field routes |
| DAO Officer | `demo-field@agritrace.demo` | `/district-dashboard` | Acts 3–4 (district review) |
| Exporter | `demo-exporter@agritrace.demo` | `/cocoa/lots` | Skip — outside pilot chain |
| Cooperative | `demo-coop@agritrace.demo` | `/cocoa/farmers` | Skip — outside pilot chain |

### CAC and CLAN accounts

No CAC/CLAN demo accounts are seeded by default. Choose one:

| Option | How |
|--------|-----|
| **A (recommended)** | Provision `county_agriculture_coordinator` and `clan_technician` profiles before demo; bookmark `/county-dashboard` and `/field/mobile` |
| **B** | Stay logged in as Ministry — Ministry can access `/county-dashboard`, `/field/mobile`, `/field/boundary-capture` |
| **C** | Narrate CAC/CLAN steps from DAO or Ministry screen without switching accounts |

**Do not rely on the topbar role switcher for live approvals** — it is UI-only; server APIs use the session profile. See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).

### Presenter bookmarks

```
/login
/command-center
/national-operations
/county-dashboard
/district-dashboard
/verification-queue
/field/mobile
/field/boundary-capture
/field/sync-queue
/executive-briefing
/workspace/clan
```

---

## Route order and timing

| Min | Act | Account | Routes (in order) |
|-----|-----|---------|-------------------|
| 0–5 | 1 — National picture | Ministry | `/command-center` → `/national-operations` → `/national-heat-map` |
| 5–12 | 2 — Field capture | CLAN or Ministry | `/login` (PWA) → `/workspace/clan` → `/field/mobile` → `/field/boundary-capture` → `/field/sync-queue` |
| 12–20 | 3 — District review | DAO | `/district-dashboard` → `/verification-queue` → `/field-agents` |
| 20–27 | 4 — County verify | CAC or Ministry | `/county-dashboard` (CaoApprovalQueues) → `/verification-queue` |
| 27–35 | 5 — Ministry approve + report | Ministry | `/verification-queue` → `/executive-briefing` → PDF export |
| 35–40 | 6 — Close | Ministry | `/workspace/ministry` — recap chain + data badges |
| 40–45 | Q&A | — | See [closing questions](#closing-questions-for-the-ministry) |

---

## Act-by-act script

### Act 1 — National picture (5 min)

**Login:** `demo-ministry@agritrace.demo`

1. **`/command-center`** — Point to KPI cards. Say: *"This is the national operations desk. Numbers come from Supabase where available."*
2. **Data Source badge** — Pause on any badge. Say: *"LIVE means operational database. PILOT or DEMO means training fixtures — we never present those as live without saying so."*
3. **`/national-operations`** — Scroll operational feed. Say: *"District and county activity rolls up here."*
4. **`/national-heat-map`** — Say: *"Geographic view of county indicators."*

---

### Act 2 — Field capture (7 min)

**Login:** CLAN pilot account **or** stay as Ministry and open field routes.

1. **`/login`** — Show **Install for Offline Use**. Say: *"No app store. Technicians install once and capture offline."*
2. **`/workspace/clan`** — Quick actions: boundary, farmers, mobile report, sync. Say: *"CLAN home — built for touch and low connectivity."*
3. **`/field/mobile`** — Open daily field report form. Say: *"Structured capture replaces paper registers."*
4. **`/field/boundary-capture`** — Capture 3–4 corners (if GPS + Mapbox work). Say: *"Walk the farm perimeter. Area calculated automatically. Submission enters DAO queue on sync."*
5. **`/field/sync-queue`** + topbar **Sync Status** — Say: *"Pending items stay on device until connectivity returns. Five failed retries flag for manual review."*

**If time is short:** Skip steps 4–5; narrate from `/workspace/clan`.

---

### Act 3 — District review (8 min)

**Logout → Login:** `demo-field@agritrace.demo`

1. **`/district-dashboard`** — Open operations drawer. Say: *"DAO desk — forms and KPIs in one place."*
2. **`/verification-queue`** — Find row with **LIVE** badge and `dao_review` (or `submitted`). Say: *"CLAN submissions land here. DAO approves, requests corrections, rejects, or escalates."*
3. **Live approve** (if UUID submission exists) — Click Approve. Say: *"Status moves to `dao_approved` — next stop is county."*
4. **`/field-agents`** — Say: *"DAO monitors CLAN coverage and sync health."*

**If approve is disabled:** Row is likely a PILOT fixture. Say: *"Training rows are labeled — live pilot actions require a LIVE submission with a real ID."* Submit a farmer registration from the district drawer if pre-staged.

---

### Act 4 — County verify (7 min)

**Logout → Login:** CAC account **or** Ministry.

1. **`/county-dashboard`** — Open **CaoApprovalQueues** tabs: farmer registration, farm inspection, subsidy verification, pest escalation. Say: *"County quality gate before national sign-off."*
2. **Approve** one DAO-approved item (LIVE + UUID only). Say: *"CAC approval advances to `ministry_review`."*
3. **`/verification-queue`** (optional) — Show same item at `cac_review` / `ministry_review` for technical audience.

---

### Act 5 — Ministry approve and report (8 min)

**Login:** `demo-ministry@agritrace.demo`

1. **`/verification-queue`** — Filter `ministry_review` or `escalated`. Approve one item. Say: *"`ministry_approved` is terminal — fully auditable."*
2. **`/executive-briefing`** — Walk KPI narrative. Say: *"CAC and Ministry use this for leadership meetings."*
3. **PDF export** — Topbar or `/api/reports/executive-briefing`. Say: *"Server-generated PDF — authentication required."*

---

### Act 6 — Close (5 min)

**`/workspace/ministry`**

Recap:

```
CLAN → DAO → CAC → Ministry
```

- Offline-first field capture  
- Server-validated workflow (29 automated checks)  
- Data source disclosure on every merged surface  
- Role separation enforced in middleware and database  

Point technical reviewers to [ARCHITECTURE.md](./ARCHITECTURE.md) and [RELEASE_NOTES_RC1.md](./RELEASE_NOTES_RC1.md).

---

## Talking points

### GPS boundary capture

| Point | Detail |
|-------|--------|
| What is captured | Polygon vertices + accuracy per corner; area in hectares via Turf.js |
| Offline | Queued in IndexedDB; syncs via `sync-batch` Edge Function |
| Workflow | Creates `farm_boundary` operational submission after sync |
| Accuracy | Warn below 10 m; discourage capture under heavy tree cover |
| Requirement | `NEXT_PUBLIC_MAPBOX_TOKEN` — see [GIS_ARCHITECTURE.md](./GIS_ARCHITECTURE.md) |

**One-liner:** *"The boundary is the legal footprint of the farm record — captured once, verified through DAO and CAC, stored with full audit trail."*

### Workflow approval

| Stage | Actor | Status | Action |
|-------|-------|--------|--------|
| Submit | CLAN/DAO | `submitted` | Enters queue |
| District | DAO | `dao_review` → `dao_approved` | Approve / corrections / reject |
| County | CAC | `cac_review` → `cac_approved` | County verify |
| National | Ministry | `ministry_review` → `ministry_approved` | Final approve |

**One-liner:** *"No one skips a level. Corrections return to the field with a documented reason."*

Reference: [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md)

### Data source disclosure

| Badge | Meaning | Say to audience |
|-------|---------|-----------------|
| **LIVE** | Supabase operational data | *"This is live pilot data."* |
| **PILOT** | Ministry canonical fixtures | *"Training or seed data — not counted in official reports."* |
| **OFFLINE** | Device queue not yet synced | *"Captured but not yet uploaded."* |
| **DEMO** | Illustrative story | *"Demo narrative only."* |

**One-liner:** *"If you do not see LIVE on a KPI, ask before citing it in a cabinet paper."*

Reference: [data-source-inventory.md](./data-source-inventory.md) · [product/PRODUCT_PRINCIPLES.md](./product/PRODUCT_PRINCIPLES.md)

### Offline / PWA

| Step | Demo action |
|------|-------------|
| Install | Login page → **Install for Offline Use** |
| Capture | Submit field report while browser shows offline (optional: disable Wi-Fi briefly) |
| Queue | Topbar sync indicator shows pending count |
| Sync | Re-enable network → tap sync → count returns to zero |

**One-liner:** *"Connectivity failure does not stop field work — it delays upload until the technician is back on network."*

Reference: [OFFLINE_ARCHITECTURE.md](./OFFLINE_ARCHITECTURE.md)

---

## Known limitations to acknowledge

State these proactively — builds trust with technical reviewers.

| Limitation | Honest acknowledgment |
|------------|----------------------|
| Verification queue mixes LIVE + PILOT rows | *"Training fixtures sit alongside live submissions. We action only LIVE rows with real IDs during pilot."* |
| No seeded CAC/CLAN demo logins | *"We provision county and field accounts per county — not generic demo users."* |
| Role switcher is UI-only | *"Separation of duties is enforced server-side — one person cannot approve their own capture."* |
| CLAN lands on district dashboard after login | *"Technicians bookmark `/field/mobile` — post-login path is being aligned in RC2."* |
| Four PDF routes lack auth (not executive briefing) | *"Cabinet PDF is protected. Secondary export routes are not public-facing in pilot."* |
| AI assistant disabled | *"Human approval only — no automated decisions on subsidies or registrations."* |
| Transfer counts may differ across screens | *"We use one authoritative surface per report during pilot; unification is on the RC2 roadmap."* |
| RC1 not unrestricted public GA | *"Approved for controlled Ministry pilot — hardening tracked in [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)."* |

Full list: [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## Fallback plans

### Mapbox token missing or map blank

1. Say: *"Maps require a configured Mapbox token — present in production deployment."*
2. Open **`/map`** or show pre-captured screenshot of boundary polygon.
3. Continue workflow demo — boundary approval does not require live map for DAO/CAC/Ministry acts.
4. Reference: [GIS_ARCHITECTURE.md](./GIS_ARCHITECTURE.md)

### GPS unavailable or poor accuracy

1. Say: *"Accuracy below 10 metres is required for official capture — tree cover and indoor venues block GPS."*
2. Narrate corner capture; show existing plot on **`/geo-registry`** or **`/farmers`**.
3. Do not fake coordinates — explain field procedure instead.

### Internet failure mid-demo

| Segment | Fallback |
|---------|----------|
| Acts 1, 3–6 | Phone hotspot; or pre-loaded tabs in cache |
| Act 2 offline | Show PWA install + **`/field/sync-queue`** guidance; narrate IndexedDB queue |
| Workflow approve | Requires connectivity — skip live approve; walk through statuses on screenshot |
| PDF export | Show **`/executive-briefing`** page only; note PDF needs session |

### Login failure

1. Re-run `npm run seed:demo` on environment.
2. Verify Supabase Auth dashboard — users exist.
3. Fall back to narrated demo using [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) screenshots.

### No items in verification queue

1. Submit farmer registration from **`/district-dashboard`** drawer before demo.
2. Or use PILOT rows — explain badge: *"This is a training row; live pilot uses LIVE badge."*

### Approve button disabled

1. Confirm logged-in role matches stage (DAO cannot approve at `ministry_review`).
2. Confirm row has UUID `submissionId` (not `VRF-*` fixture only).
3. Refresh page; retry.

---

## Closing questions for the Ministry

Ask these in the final 5 minutes. Capture answers for [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) and [government/PILOT_EVALUATION_FRAMEWORK.md](./government/PILOT_EVALUATION_FRAMEWORK.md).

### Operational

1. Which **two counties** should lead Wave 1 pilot deployment?
2. How many **CLAN technicians per district** should we provision in month one?
3. What is the acceptable **DAO review turnaround** — same day or 24 hours?

### Data and reporting

4. Which KPIs must be **LIVE-only** before they appear in cabinet materials?
5. Who is the **data steward** for farmer registry sign-off at national level?

### Governance

6. Who chairs the **weekly pilot steering** meeting — Ministry or county?
7. What is the escalation path when a county refuses to adopt digital capture?

### Technical

8. Is **offline-first** sufficient, or is a native app store application required within 12 months?
9. What **existing systems** (if any) must AgriVault export to in year one?

### Donor and partners

10. Which donor programmes need **read-only dashboard access** (`donor_observer` role)?

### Go / no-go

11. What **three metrics** would convince you to scale from 2 counties to 8?
12. What would constitute a **stop** condition for the pilot?

---

## Related documents

| Document | Use |
|----------|-----|
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Extended 45–60 min narrative |
| [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) | Pre-launch verification |
| [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) | Field operator reference |
| [DAO_GUIDE.md](./DAO_GUIDE.md) | District operator reference |
| [CAC_GUIDE.md](./CAC_GUIDE.md) | County operator reference |
| [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) | Ministry operator reference |
| [operations/SOP_FIELD_OPERATIONS.md](./operations/SOP_FIELD_OPERATIONS.md) | CLAN daily SOP |
