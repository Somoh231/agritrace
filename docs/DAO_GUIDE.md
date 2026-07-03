# AgriVault — DAO Guide

**Audience:** District Agriculture Officers (`dao_officer`, `district_officer`)  
**Version:** Pilot 1.0 · July 2026

---

## Your role in the pilot

As the District Agriculture Officer (DAO), you review CLAN field submissions, complete district operational forms, monitor field agents, and advance approved records to the County Agriculture Coordinator (CAC).

```
CLAN → You (DAO) → CAC → Ministry
```

---

## Login

1. Navigate to `/login`.
2. Sign in with your district officer credentials.
3. You land on **`/district-dashboard`** — your primary operations desk.

**Demo account (training):** `demo-field@agritrace.demo` / `DemoPass!2026` → `/district-dashboard`  
(Requires `npm run seed:demo` on the environment.)

---

## Your workspace

| Surface | Route | Purpose |
|---------|-------|---------|
| DAO workspace | `/workspace/dao` | Review hub and quick links |
| District dashboard | `/district-dashboard` | KPIs + operational forms |
| Verification queue | `/verification-queue` | Approve/reject CLAN submissions |
| Field agents | `/field-agents` | Monitor CLAN technician activity |
| Registration approvals | `/registration-approvals` | Flagged farmer registrations |
| Reporting | `/reporting/workspace?tab=dao` | District reporting hub |

Additional access: `/field/inspections`, `/operations/warehouses`, `/alerts`, `/compliance/anomalies`, `/map`, `/geo-registry`, `/national-heat-map`, `/food-security`.

---

## Daily workflow

### Morning

1. Open **`/district-dashboard`** — review overnight submissions and KPI cards.
2. Check **`/verification-queue`** — filter for `dao_review` status items.
3. Review **`/field-agents`** — confirm CLAN technicians synced overnight field data.
4. Check **`/registration-approvals`** for flagged registrations.

### During the day

1. **Review CLAN submissions** in the verification queue:
   - Approve → advances to `dao_approved`, then `cac_review`
   - Request corrections → returns to CLAN as `dao_corrections_requested`
   - Reject → `rejected`
   - Escalate → `escalated` (Ministry can action)
2. **Complete district forms** on the district dashboard (see Forms below).
3. **Follow up on inspections** at `/field/inspections`.
4. **Monitor alerts** at `/alerts` for pest escalations and anomalies.

### End of day

1. Flush any pending DAO workflow queue items (see Offline section).
2. Review `/reporting/workspace?tab=dao` for district summary.
3. Confirm no items stuck in `dao_review` before close of business.

---

## District dashboard forms

Forms on the district dashboard persist domain data and create `operational_submissions` via the submission bridge:

| Form | Submission type |
|------|-----------------|
| Register farmer | `farmer_registration` |
| Farm inspection | `field_inspection` |
| Pest/disease report | `pest_disease_alert` |
| Production estimate | `harvest_report` |
| Subsidy delivery verify | `input_distribution` |
| GPS point/field evidence | `gps_verification` |
| CLAN crop monitoring | `field_report` |
| Field activity report | `field_report` |
| MoA operational survey | `field_report` |

Open forms from the operations drawer on `/district-dashboard`. Drafts can be saved locally before submission.

---

## Approvals

### Verification queue (`/verification-queue`)

This is your primary approval surface. Items arrive from CLAN field capture and district forms.

**Actions available at `dao_review`:**

| Action | Result |
|--------|--------|
| Approve | `dao_approved` → moves to CAC queue |
| Request corrections | `dao_corrections_requested` → CLAN must resubmit |
| Reject | `rejected` (terminal) |
| Escalate | `escalated` → Ministry attention |
| Comment | Thread note (no status change) |

Actions call `POST /api/ops/workflows/submission` — your session role is validated server-side.

### Registration approvals (`/registration-approvals`)

Review flagged farmer registrations separately from the main verification queue when data quality flags are raised.

### Read-only oversight

When CAC or Ministry users view the district dashboard, forms appear read-only (`daoReviewReadOnly`). Your session has full write access.

---

## Offline usage

### DAO workflow queue

District forms use IndexedDB store **`agrivault-dao-workflows`** via `useDaoWorkflowQueue`:

| Status | Label | Meaning |
|--------|-------|---------|
| `draft` | Draft | Saved locally, not queued |
| `pending_sync` | Pending Sync | Queued, awaiting connectivity |
| `submitted` | Submitted | Successfully uploaded |
| `failed` | Sync Failed | Retry needed |

**Operations:**

- **Save draft** — work offline, resume later
- **Queue pending** — mark for sync when online
- **Flush pending** — batch upload all pending items
- **Retry one** — retry a single failed item

The DAO workspace shows a **Live Queue Stat** with real IndexedDB pending count.

### CLAN offline sync (your responsibility to monitor)

CLAN technicians sync via `agrivault-offline`. If a technician's items show `manual_review` after 5 retries, investigate in `/field-agents` and help re-submit from the district dashboard.

---

## GPS

| Surface | Route / location | Purpose |
|---------|------------------|---------|
| GPS evidence form | District dashboard drawer | Point/field evidence → `gps_verification` |
| Boundary review | `/map`, `/geo-registry` | View captured farm boundaries |
| Field agent GPS | `/field-agents` | Monitor CLAN capture activity |

You can access `/field/boundary-capture` for training or assisted capture, but primary boundary capture is a CLAN responsibility.

---

## Reporting

| Route | Tab | Content |
|-------|-----|---------|
| `/reporting/workspace?tab=dao` | DAO | District operational reports |
| `/reporting/workspace?tab=review` | Review | Items awaiting your action |
| `/reporting/workspace?tab=verified` | Verified | Items you approved |
| `/reporting/workspace?tab=escalated` | Escalated | Items sent to Ministry |

Check the **Data Source** badge — verification queue merges LIVE submissions with PILOT fixtures for training.

---

## Routes you cannot access

- `/command-center`, `/national-operations` — Ministry only
- `/county-dashboard` — CAC home (you have `/district-dashboard`)
- `/workspace/ministry`, `/workspace/cac` — higher-tier workspaces
- `/gis-intelligence` — Ministry/CAC experimental GIS

---

## Common errors

| Problem | What to do |
|---------|------------|
| Workflow buttons greyed out | Confirm you are signed in as `dao_officer` — role switcher preview does not affect API |
| Item stuck in `dao_review` | Refresh verification queue; check network; retry approve action |
| Count mismatch on dashboard | Check Data Source badge (LIVE vs PILOT vs DEMO) |
| DAO form won't submit offline | Save as draft; flush pending queue when online |
| CLAN submission missing | Confirm CLAN sync completed; check `/field-agents` |
| Transfer count differs from inventory | Known pilot risk — two transfer models exist; see [pilot-readiness-qa.md](./pilot-readiness-qa.md) |
| 429 on API | Rate limited — wait 60 seconds and retry |

---

## Architecture (district perspective)

```
CLAN capture → operational_submissions (status: submitted)
       │
       ▼
Your verification queue (dao_review)
       │ approve
       ▼
cac_review → CAC approval queues
       │
       ▼
ministry_review → Ministry command center
```

**Key modules:**

- `src/lib/workflow/submission-bridge.ts` — domain form → submission
- `src/lib/workflow/status-model.ts` — transition validation
- `src/hooks/useDaoWorkflowQueue.ts` — offline DAO form queue
- `src/lib/offline/sync-queue.ts` — CLAN offline batch sync

---

## Quick reference

| Task | Path |
|------|------|
| Sign in | `/login` |
| District desk | `/district-dashboard` |
| Review submissions | `/verification-queue` |
| Monitor CLAN | `/field-agents` |
| District reports | `/reporting/workspace?tab=dao` |
| DAO workspace | `/workspace/dao` |
| Flagged registrations | `/registration-approvals` |

See also: [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) · [CAC_GUIDE.md](./CAC_GUIDE.md) · [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
