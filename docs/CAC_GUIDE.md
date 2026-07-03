# AgriVault — CAC Guide

**Audience:** County Agriculture Coordinators (`county_agriculture_coordinator`, `county_officer`)  
**Version:** Pilot 1.0 · July 2026

---

## Your role in the pilot

As the County Agriculture Coordinator (CAC), you verify district-approved submissions, manage county-level approval queues, monitor food security indicators, and prepare executive briefings for county leadership.

```
CLAN → DAO → You (CAC) → Ministry
```

---

## Login

1. Navigate to `/login`.
2. Sign in with your county coordinator credentials.
3. You land on **`/county-dashboard`** — your county operations desk.

Your administrator creates your account in Supabase Auth with role `county_agriculture_coordinator` or `county_officer` in the `profiles` table.

---

## Your workspace

| Surface | Route | Purpose |
|---------|-------|---------|
| CAC workspace | `/workspace/cac` | County verification hub |
| County dashboard | `/county-dashboard` | KPIs + CaoApprovalQueues |
| Verification queue | `/verification-queue` | Cross-cutting review workspace |
| Executive briefing | `/executive-briefing` | County leadership narrative + PDF |
| Reporting | `/reporting/workspace?tab=cac` | County reporting hub |
| Registration approvals | `/registration-approvals` | Flagged registrations |
| Food security | `/food-security` | County food security indicators |
| Compliance | `/compliance` | Compliance overview |
| Alerts | `/alerts` | Operational alerts |

Additional access: `/district-dashboard` (read-only DAO oversight), `/national-heat-map`, `/map`, `/geo-registry`, `/gis-intelligence`.

---

## Daily workflow

### Morning

1. Open **`/county-dashboard`** — review county KPIs and approval queue tabs.
2. Process **`CaoApprovalQueues`** — focus on items in `cac_review` status.
3. Check **`/verification-queue`** for escalated or cross-district items.
4. Review **`/alerts`** for pest escalations and warehouse signals.

### During the day

1. **Approve county-level items** in CaoApprovalQueues (see Approval Queues below).
2. **Review DAO-approved submissions** advancing from district review.
3. **Monitor district dashboards** (`/district-dashboard`) for read-only oversight.
4. **Prepare briefing materials** at `/executive-briefing` if leadership review is scheduled.

### End of day

1. Confirm no items remain in `cac_review`.
2. Export executive briefing PDF if needed (topbar or `/executive-briefing`).
3. Review `/reporting/workspace?tab=cac` for county summary status.

---

## CaoApprovalQueues

Embedded in **`/county-dashboard`**, this is your primary approval surface.

### Queue tabs

| Tab | Submission focus |
|-----|------------------|
| Farmer registration | New farmer registrations from CLAN/DAO |
| Farm inspection | Field inspection reports |
| Subsidy verification | Input distribution confirmations |
| Pest escalation | Pest/disease alerts requiring county action |
| District summary | Aggregated district operational summaries |
| Warehouse replenishment | Warehouse restocking requests |

### Data sources

Queues merge:

- Seeded demo/PILOT items for training
- Live `operational_submissions` from Supabase

Check the **Data Source** badge before acting on training vs live items.

### Actions

For items with a real UUID `submissionId`:

| Action | Result |
|--------|--------|
| Approve | `cac_approved` → advances to `ministry_review` |
| Reject | `rejected` |
| Request corrections | `cac_corrections_requested` → returns to CLAN via DAO |
| Escalate | `escalated` → Ministry priority queue |
| Comment | Thread note |

Actions call `POST /api/ops/workflows/submission`.

---

## Approvals (verification queue)

`/verification-queue` provides a unified grid view shared with DAO and Ministry.

**Your actions at `cac_review`:**

- Approve → `cac_approved`
- Request corrections → `cac_corrections_requested`
- Reject → `rejected`
- Escalate → `escalated`

Ministry staff handle `ministry_review` and `escalated` items. You cannot access `/command-center` or `/national-operations`.

---

## Offline usage

CAC workflows are primarily online. County dashboard forms that use `useDaoWorkflowQueue` support the same offline draft pattern as DAO:

- Draft → Pending Sync → Submitted → Sync Failed

If you lose connectivity during form completion, save as draft and flush when back online.

CLAN offline sync is not your direct responsibility, but monitor `/field/sync-queue` KPI links from the county dashboard for district sync health.

---

## GPS and GIS

| Surface | Route | Access |
|---------|-------|--------|
| Operational map | `/map` | View captured boundaries |
| Geo registry | `/geo-registry` | Pilot GIS registry |
| GIS intelligence | `/gis-intelligence` | Advanced county GIS (CAC + Ministry) |
| National heat map | `/national-heat-map` | County-level heat indicators |
| District GPS evidence | `/district-dashboard` | Read-only review of DAO GPS submissions |

---

## Reporting

| Route | Purpose |
|-------|---------|
| `/reporting/workspace?tab=cac` | County operational reports |
| `/reporting/workspace?tab=review` | Items awaiting county action |
| `/reporting/workspace?tab=verified` | County-approved items |
| `/reporting/workspace?tab=escalated` | Escalated to Ministry |
| `/executive-briefing` | Leadership narrative dashboard |
| `GET /api/reports/executive-briefing` | Cabinet-ready PDF export |

Export PDF from the executive briefing page or the topbar export action (requires authenticated CAC or Ministry session).

Additional report centers (Ministry-led): `/reports`, `/reports/ministry`.

---

## Executive briefing

`/executive-briefing` is shared with Ministry national staff. As CAC you can:

- View county-scoped KPIs and operational narrative
- Export PDF for county leadership meetings
- Link to `/national-heat-map` and `/food-security` for context

---

## Routes you cannot access

- `/command-center`, `/national-operations` — Ministry national only
- `/workspace/ministry` — Ministry workspace
- `/admin/*` — Admin console (unless you also hold an admin role)
- `/activity` — Ministry activity center

CLAN-only routes like `/field/mobile` are accessible for training but not your primary desk.

---

## Common errors

| Problem | What to do |
|---------|------------|
| Approval action fails | Confirm item has a real UUID (not demo-only fixture) |
| Queue shows PILOT items only | Live Supabase may be empty — normal during early pilot |
| Executive briefing PDF 404 | Ensure you are authenticated; use `/api/reports/executive-briefing` |
| Count mismatch vs Ministry dashboard | Different data source blends — check badges |
| Cannot open command center | Expected — your landing is `/county-dashboard` |
| Workflow buttons disabled | Verify session role is `county_agriculture_coordinator` |
| Escalated item not visible to Ministry | Refresh verification queue; confirm status is `escalated` |

---

## Architecture (county perspective)

```
DAO approves (dao_approved)
       │
       ▼
CaoApprovalQueues — cac_review
       │ approve
       ▼
ministry_review → Ministry command center
       │
       ▼
ministry_approved (terminal)
```

**Key components:**

- `src/components/cao/CaoApprovalQueues.tsx` — county queue UI
- `src/components/dashboard/CountyOfficerDashboard.tsx` — county desk
- `src/lib/workflow/client.ts` — fetch submissions, post actions
- `src/lib/data/ministry-data-service.ts` — county warehouse signals (LIVE/PILOT)

---

## Quick reference

| Task | Path |
|------|------|
| Sign in | `/login` |
| County desk | `/county-dashboard` |
| Approval queues | `/county-dashboard` (CaoApprovalQueues tabs) |
| Verification grid | `/verification-queue` |
| County reports | `/reporting/workspace?tab=cac` |
| Executive briefing | `/executive-briefing` |
| CAC workspace | `/workspace/cac` |
| Food security | `/food-security` |

See also: [DAO_GUIDE.md](./DAO_GUIDE.md) · [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) · [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
