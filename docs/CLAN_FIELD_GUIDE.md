# AgriVault — CLAN Field Guide

**Audience:** Clan Agriculture Crops Technicians (`clan_technician`, `field_agent`)  
**Version:** Pilot 1.0 · July 2026

---

## Your role in the pilot

You are the first link in the Ministry operational chain. You capture farmer data, GPS boundaries, field reports, and pest alerts in the field. Your submissions flow to the District Agriculture Officer (DAO) for review, then to the County Agriculture Coordinator (CAC), and finally to Ministry national staff.

```
You (CLAN) → DAO → CAC → Ministry
```

---

## Login

1. Open the AgriVault URL provided by your administrator.
2. Go to `/login`.
3. Enter your email and password.
4. After sign-in you land on **`/field/mobile`** — the daily field report.

**First-time setup:** Install the app before going to the field.

- On the login page, tap **Install for Offline Use**.
- This adds AgriVault to your home screen as a PWA (Progressive Web App).
- Drafts saved offline stay on your device until you reconnect and sync.

---

## Your workspace

**Home:** `/workspace/clan`

Quick actions from the CLAN workspace:

| Action | Route | Purpose |
|--------|-------|---------|
| GPS boundary capture | `/field/boundary-capture` | Walk farm perimeter with GPS |
| Farmer registration | `/farmers` | Register or look up farmers |
| Daily field report | `/field/mobile` | Log today's field activity |
| Offline sync | `/field/sync-queue` | Sync guidance and status |

Additional field routes:

| Route | Purpose |
|-------|---------|
| `/field` | Mobile field home — register farmer, create lot, log movement |
| `/field/inspections` | Inspection queue |
| `/field/pest-reports` | Pest and disease reports |
| `/field/extension-reports` | Extension service reports |

---

## Daily workflow

### Start of day

1. Open AgriVault (installed PWA preferred).
2. Check connectivity — topbar shows online/offline status.
3. Open **`/field/mobile`** and review today's assignments.
4. If offline, confirm **"Offline — drafts saved"** appears on the workspace — you can still capture data.

### In the field

1. **Register a farmer** (`/farmers`) if not already in the system.
2. **Capture farm boundary** (`/field/boundary-capture?farmer=<uuid>`) — walk the perimeter and mark corners.
3. **Submit a field report** (`/field/mobile`) — activity, observations, GPS stamp.
4. **Report pests** (`/field/pest-reports`) if needed — escalates through DAO and CAC.

### End of day

1. Return to connectivity (mobile data or Wi-Fi).
2. Tap the **Sync Status** indicator in the topbar (or visit `/field/sync-queue`).
3. Wait for pending items to upload — the badge count should reach zero.
4. Confirm submissions appear in your reporting drafts tab: `/reporting/workspace?tab=drafts`.

---

## GPS and boundary capture

### Boundary capture (`/field/boundary-capture`)

1. Allow location permission when prompted.
2. Select or link a farmer (use `?farmer=<uuid>` if directed).
3. Walk the farm perimeter; tap **Capture corner** at each vertex.
4. Review the polygon on the map.
5. Submit — online submissions go directly to Supabase; offline submissions queue locally.

### GPS in field reports

The daily field report and MoA operational survey forms include GPS capture buttons that record:

- `gps_latitude`
- `gps_longitude`
- `gps_accuracy_m`

**Tips:**

- Wait for accuracy below 10 m before capturing a point.
- Avoid capturing under heavy tree cover — weak signal warnings appear on the map.
- Maps require a configured Mapbox token — contact your administrator if maps do not load.

### Maps you can access

- `/field/boundary-capture` — primary GPS tool
- `/map` — operational map
- `/geo-registry` — pilot GIS registry

You **cannot** access `/gis-intelligence` (Ministry/CAC only).

---

## Offline usage

### What works offline

- Farmer registration drafts
- GPS boundary capture (stored locally)
- Field reports and pest reports
- Production record capture

### Local storage

AgriVault stores pending items in IndexedDB (`agrivault-offline`):

- `pending_farmers`
- `pending_plots`
- `pending_production_records`

### Syncing

1. The topbar **Sync Status** indicator shows pending count.
2. When online, tap to trigger sync — items batch-upload via the `sync-batch` Edge Function.
3. Successful plot syncs create an `operational_submission` of type `farm_boundary`.
4. After **5 failed retries**, items move to `manual_review` — contact your DAO officer.

### Offline guidance page

`/field/sync-queue` provides sync instructions. Use the topbar indicator for live queue depth — the sync-queue page is informational.

---

## Reporting

| Route | Purpose |
|-------|---------|
| `/reporting/workspace?tab=drafts` | Your unsynced and draft submissions |
| `/reporting/workspace?tab=submitted` | Items sent for DAO review |

You can access `/reporting` but not verification or approval queues — those belong to DAO and above.

---

## Approvals (what happens after you submit)

Your submission enters the workflow as **`submitted`**:

```
submitted → dao_review → dao_approved → cac_review → cac_approved
  → ministry_review → ministry_approved
```

If DAO or CAC requests corrections, status becomes `dao_corrections_requested` or `cac_corrections_requested`. You will need to update and resubmit.

You **cannot** approve or reject items — capture and submit only.

---

## Routes you cannot access

Middleware redirects you to `/field/mobile` if you try to open:

- `/verification-queue`
- `/command-center`, `/national-operations`
- `/county-dashboard` (CAC home)
- `/field-agents` (DAO monitoring)
- `/inventory`, `/transfers`, `/gis-intelligence`

This is by design — your role is field capture.

---

## Common errors

| Problem | What to do |
|---------|------------|
| Map blank / "token missing" | Report to administrator — Mapbox token not configured |
| GPS weak signal warning | Move to open area; wait for accuracy to improve |
| "Offline — drafts saved" but sync fails | Check mobile data; retry sync; contact DAO after 5 failures |
| Cannot open verification queue | Expected — DAO handles review |
| Submission not visible to DAO | Confirm sync completed (pending count = 0) |
| Wrong page after login | Contact admin to verify your `profiles.role` is `clan_technician` or `field_agent` |
| Hydration warning on workspace | Safe to ignore — refresh the page |

---

## Architecture (field perspective)

```
Your device
  ├── PWA shell (installable)
  ├── IndexedDB (agrivault-offline) — offline queue
  └── Mapbox GL — GPS boundary capture
         │
         ▼ (when online)
  Supabase Edge Function (sync-batch)
         │
         ▼
  operational_submissions → DAO review queue
```

Data source badges on dashboards tell you whether numbers are **LIVE**, **PILOT**, **OFFLINE**, or **DEMO**. Your captures become **LIVE** after successful sync.

---

## Quick reference

| Task | Path |
|------|------|
| Sign in | `/login` |
| Daily report | `/field/mobile` |
| GPS boundary | `/field/boundary-capture` |
| Register farmer | `/farmers` |
| Sync status | Topbar indicator / `/field/sync-queue` |
| Your workspace | `/workspace/clan` |
| Draft reports | `/reporting/workspace?tab=drafts` |

For administrator setup, see [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md).  
For the full demo walkthrough, see [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).
