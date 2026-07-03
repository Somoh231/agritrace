# AgriVault — Ministry Guide

**Audience:** Ministry national staff (`ministry_admin`, `ministry_officer`, `government_officer`, `super_admin`, `admin`)  
**Version:** Pilot 1.0 · July 2026

---

## Your role in the pilot

Ministry staff provide national oversight of the agriculture operational chain. You monitor county and district performance, approve escalated submissions, produce executive reports, and manage pilot-wide configuration.

```
CLAN → DAO → CAC → You (Ministry)
```

---

## Login

1. Navigate to `/login`.
2. Sign in with your Ministry credentials.
3. You land on **`/command-center`** — the national operations desk.

**Demo account (training):** `demo-ministry@agritrace.demo` / `DemoPass!2026` → `/command-center`  
(Requires `npm run seed:demo`.)

---

## Your workspace

| Surface | Route | Purpose |
|---------|-------|---------|
| Ministry workspace | `/workspace/ministry` | National command hub |
| Command center | `/command-center` | Primary KPI dashboard |
| National operations | `/national-operations` | Operational intelligence |
| Verification queue | `/verification-queue` | Final review and escalations |
| Executive briefing | `/executive-briefing` | Cabinet narrative + PDF |
| Activity center | `/activity` | System activity feed |
| Admin console | `/admin` | User and system administration |

**Ministry workspace KPI links:** `/farmers`, `/national-heat-map`, `/inventory`, `/food-security`, `/verification-queue`, `/field-agents`, `/compliance/anomalies`, `/field/sync-queue`, `/command-center`, `/national-operations`, `/executive-briefing`, `/alerts`, `/transfers`.

---

## Daily workflow

### Morning briefing

1. Open **`/command-center`** — review national KPIs and data source badges.
2. Check **`/verification-queue`** for `ministry_review` and `escalated` items.
3. Review **`/national-operations`** for district and county operational feed.
4. Scan **`/alerts`** and **`/compliance/anomalies`** for priority flags.

### During the day

1. **Approve ministry-stage submissions** in the verification queue.
2. **Action escalated items** from CAC and DAO.
3. **Monitor field agent coverage** at `/field-agents`.
4. **Review logistics** at `/inventory`, `/transfers`, `/operations/warehouses`.
5. **Track food security** at `/food-security` and `/national-heat-map`.

### End of day / weekly

1. Generate **executive briefing PDF** from topbar or `/executive-briefing`.
2. Archive completed submissions (`archive` action on terminal items).
3. Review `/reports/ministry` for narrative reports.
4. Update pilot stakeholders using [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) weekly status.

---

## Approvals

### Verification queue (`/verification-queue`)

Shared with DAO and CAC. Ministry actions apply at:

| Status | Available actions |
|--------|---------------------|
| `ministry_review` | Approve, reject, request corrections, comment |
| `escalated` | Approve, reject, archive |
| `ministry_approved` | Archive (terminal) |
| `rejected` | Archive (terminal) |

**Approve at ministry stage** → `ministry_approved` (terminal — record is fully approved).

### Workflow status pipeline

```
draft → submitted → dao_review → dao_approved → cac_review → cac_approved
  → ministry_review → ministry_approved
```

Side paths: corrections requested, rejected, escalated, archived.

All mutations go through `POST /api/ops/workflows/submission` with server-side role validation.

### Submission types you will see

`farmer_registration`, `farm_boundary`, `field_inspection`, `gps_verification`, `pest_disease_alert`, `warehouse_assignment`, `input_distribution`, `harvest_report`, `warehouse_transfer_confirmation`, `donor_shipment_verification`, `field_report`

---

## Reporting

| Surface | Route | Output |
|---------|-------|--------|
| Ministry reports center | `/reports` | Report hub |
| Ministry narrative | `/reports/ministry` | Programme reports |
| Export hub | `/reports/export` | Bulk exports |
| Rice season PDF | `/api/reports/rice` | Season PDF bundle |
| Executive briefing PDF | `/api/reports/executive-briefing` | Cabinet PDF |
| EUDR DDS | `/api/reports/dds` | Compliance export |
| Donor programme | `/api/reports/donor-programme` | Donor-facing report |
| Compliance oversight | `/api/reports/compliance-oversight` | Auditor report |
| Reporting workspace | `/reporting/workspace` | Tabbed operational reports |

**Reporting workspace tabs:** `dao`, `cac`, `drafts`, `submitted`, `review`, `verified`, `escalated`, `archived`.

Always note the **Data Source** badge — command center KPIs may blend LIVE and DEMO sources during pilot.

---

## GPS and national GIS

| Surface | Route | Purpose |
|---------|-------|---------|
| National heat map | `/national-heat-map` | Geographic operational indicators |
| Operational map | `/map` | Farm boundaries and events |
| Geo registry | `/geo-registry` | Pilot GIS registry |
| GIS intelligence | `/gis-intelligence` | Advanced national GIS (Ministry + CAC) |
| Field sync health | `/field/sync-queue` | CLAN offline sync status link |

Ministry can view all captured boundaries but primary capture remains a CLAN field activity.

---

## Offline usage (oversight)

Ministry workflows are online-first. Monitor pilot offline health via:

- **`/field/sync-queue`** — linked from ministry workspace KPIs
- **`/field-agents`** — CLAN technician activity and sync status
- Topbar **Sync Status** indicator when previewing field routes

CLAN offline queue (`agrivault-offline`) and DAO workflow queue (`agrivault-dao-workflows`) sync independently — a backlog in either affects your verification queue depth.

---

## Admin console

Accessible at `/admin` for roles: `super_admin`, `admin`, `ministry_admin`, `ministry_officer`, `government_officer`.

| Section | Path | Purpose |
|---------|------|---------|
| Users | `/admin/users` | Role assignment |
| Demo inquiries | `/admin/demo-inquiries` | Inbound demo requests |

User provisioning: create in Supabase Auth, then insert `profiles` row with correct role.

---

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js App Router                        │
│  middleware.ts — auth + role gates + request IDs              │
├──────────────────────────────────────────────────────────────┤
│  Presentation                                                 │
│  command-center · national-operations · verification-queue    │
│  executive-briefing · ministry workspace                      │
├──────────────────────────────────────────────────────────────┤
│  Workflow engine                                              │
│  status-model.ts · submission-bridge.ts · workflow API        │
│  operational_submissions · workflow_actions · notifications   │
├──────────────────────────────────────────────────────────────┤
│  Data layer (SourcedResult + DataSourceBadge)                 │
│  LIVE (Supabase RLS) · PILOT · OFFLINE · DEMO                 │
├──────────────────────────────────────────────────────────────┤
│  Offline                                                      │
│  agrivault-offline (CLAN) · agrivault-dao-workflows (DAO)     │
│  sync-batch Edge Function                                     │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure                                               │
│  CSP · rate limiting · structured logging · PWA               │
└──────────────────────────────────────────────────────────────┘
```

**Key documentation:**

- [workflow-completeness-audit.md](./workflow-completeness-audit.md) — workflow wiring audit
- [data-source-inventory.md](./data-source-inventory.md) — data provenance
- [production-readiness.md](./production-readiness.md) — CSP, rate limits, smoke tests
- [security-hardening-notes.md](./security-hardening-notes.md) — API security

---

## Routes and access summary

**Ministry exclusive:**

- `/workspace/ministry`
- `/command-center`
- `/national-operations`
- `/activity` (also `call_center_agent`)

**Shared with CAC:**

- `/executive-briefing`
- `/gis-intelligence`
- `/county-dashboard` (Ministry can view)

**Shared with DAO/CAC:**

- `/verification-queue`
- `/registration-approvals`
- `/reporting`

**Operational chain (read-through):**

- `/district-dashboard`, `/field/*`, `/national-heat-map`, `/food-security`

---

## Common errors

| Problem | What to do |
|---------|------------|
| KPI numbers differ from verification queue | Check Data Source badge — LIVE vs DEMO blend on command center |
| Cannot approve escalated item | Confirm status is `escalated`; refresh queue |
| PDF export unauthorized | Must be signed in as Ministry or CAC |
| Transfer counts mismatch inventory | Known pilot risk — dual transfer model; see [pilot-readiness-qa.md](./pilot-readiness-qa.md) |
| Verification queue shows demo items only | Live submissions empty — normal early in pilot |
| 429 on API | Rate limit triggered — wait and retry |
| Activity center empty | Limited to ministry + call center roles |
| AI assistant unavailable | Disabled for pilot — use reporting exports instead |

---

## Quick reference

| Task | Path |
|------|------|
| Sign in | `/login` |
| National desk | `/command-center` |
| Review escalations | `/verification-queue` |
| Executive PDF | `/executive-briefing` or topbar export |
| National intel | `/national-operations` |
| Ministry workspace | `/workspace/ministry` |
| User admin | `/admin/users` |
| Heat map | `/national-heat-map` |

See also: [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) · [CAC_GUIDE.md](./CAC_GUIDE.md) · [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) · [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md)
