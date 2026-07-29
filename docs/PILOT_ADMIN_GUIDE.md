# AgriVault Ministry Pilot — Administrator Guide

**Audience:** Pilot administrators, IT leads, and Ministry programme managers
**Version:** Pilot 1.0 · July 2026
**Application:** AgriVault (`agritrace`)

---

## Purpose

This guide helps administrators prepare, launch, and support the Ministry agriculture pilot. AgriVault connects field capture (CLAN) through district review (DAO), county verification (CAC), and national oversight (Ministry) in a single auditable workflow.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Ministry (National)                       │
│  /command-center · /national-operations · /verification-queue   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ escalations · ministry_review
┌───────────────────────────────▼─────────────────────────────────┐
│                    CAC — County Agriculture Coordinator            │
│  /county-dashboard · /workspace/cac · CaoApprovalQueues          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ cac_review · cac_approved
┌───────────────────────────────▼─────────────────────────────────┐
│                    DAO — District Agriculture Officer              │
│  /district-dashboard · /workspace/dao · verification queue       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ dao_review · dao_approved
┌───────────────────────────────▼─────────────────────────────────┐
│              CLAN — Clan Agriculture Crops Technician              │
│  /field/mobile · /field/boundary-capture · /field/sync-queue     │
└───────────────────────────────────────────────────────────────────┘
```

**Stack:** Next.js 14 (App Router) · Supabase Auth + Postgres · Mapbox GL · IndexedDB offline queues · PWA installable shell

**Data layers** (see [data-source-inventory.md](./data-source-inventory.md)):

| Badge | Meaning |
|-------|---------|
| **LIVE** | Supabase operational tables (RLS-scoped) |
| **PILOT** | Ministry pilot fixtures / canonical CSV data |
| **OFFLINE** | Device-local IndexedDB queues |
| **DEMO** | Illustrative training data |

Every surface that merges sources shows a **Data Source** badge — never assume a number is live without checking the badge.

---

## Login and user provisioning

### Login URL

```
https://<your-deployment>/login
```

Deep-link return after auth:

```
/login?redirectTo=/district-dashboard
```

### Provisioning new pilot users

1. Create the user in **Supabase Auth** (email + password).
2. Insert a matching row in the `profiles` table with the correct `role`.
3. Confirm the user can sign in and lands on the role-appropriate home page.

### Pilot roles

| Role (DB value) | Operational group | Default landing |
|-----------------|-------------------|-----------------|
| `clan_technician`, `field_agent` | CLAN (field) | `/field/mobile` |
| `dao_officer`, `district_officer` | DAO (district) | `/district-dashboard` |
| `county_agriculture_coordinator`, `county_officer` | CAC (county) | `/county-dashboard` |
| `ministry_admin`, `ministry_officer`, `government_officer` | Ministry | `/command-center` |
| `super_admin`, `admin` | Admin console | `/command-center` |

Additional roles (`warehouse_manager`, `cooperative_manager`, `exporter`, `donor_observer`, `auditor`) exist for logistics and oversight but are outside the core CLAN→DAO→CAC→Ministry chain.

### Unique training accounts (training only)

Run `Admin Users & Roles invitation workflow` on the deployment environment, then use:

| Account | Password | Lands on |
|---------|----------|----------|
| `unique Ministry presenter account` | `user-selected private password` | `/command-center` |
| `unique DAO presenter account` | `user-selected private password` | `/district-dashboard` |
| `unique Exporter presenter account` | `user-selected private password` | `/cocoa/lots` |
| `unique Cooperative presenter account` | `user-selected private password` | `/cocoa/farmers` |

**Important:** Server APIs always use the session profile role from the database. The topbar **Workspace Role Switcher** is a UI preview only — it does not change server permissions.

---

## Environment requirements

| Variable | Required for |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, data, workflow API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | GPS boundary capture, operational maps |

Without a Mapbox token, map surfaces show a token-missing state — GPS capture will not function.

See [production-readiness.md](./production-readiness.md) for CSP, rate limiting, and staging smoke tests.

---

## Daily administrator workflow

### Before field day

- [ ] Confirm all pilot users exist in Supabase Auth + `profiles`
- [ ] Verify Mapbox token is set on staging/production
- [ ] Run `Admin Users & Roles invitation workflow` if using unique training accounts for training
- [ ] Confirm Supabase Edge Function `sync-batch` is deployed (offline sync)
- [ ] Brief CLAN technicians on PWA install (see [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md))

### During pilot week

- Monitor `/verification-queue` for backlog (DAO/CAC/Ministry)
- Check `/field/sync-queue` guidance surfaces and topbar **Sync Status** indicator
- Review `/admin/users` for role assignments (admin roles only)
- Watch for **OFFLINE** and **PILOT** badges on dashboards — clarify data provenance in reports

### End of week

- Export executive briefing PDF from Ministry topbar or `/executive-briefing`
- Archive escalated items via Ministry workflow actions
- Capture pilot feedback using [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md)

---

## Approvals chain (administrator view)

Workflow state is stored in `operational_submissions` and progresses:

```
draft → submitted → dao_review → dao_approved → cac_review → cac_approved
  → ministry_review → ministry_approved
```

Side paths: `dao_corrections_requested`, `cac_corrections_requested`, `rejected`, `escalated`, `archived`

Submission types include: farmer registration, farm boundary, field inspection, GPS verification, pest/disease alert, harvest report, warehouse transfer confirmation, and others.

Each role guide covers day-to-day actions:

- [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) — capture and submit
- [DAO_GUIDE.md](./DAO_GUIDE.md) — district review
- [CAC_GUIDE.md](./CAC_GUIDE.md) — county approval queues
- [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) — national oversight

---

## Offline usage (administrator summary)

| Store | IndexedDB name | Contents |
|-------|----------------|----------|
| Field capture | `agrivault-offline` | Pending farmers, plots, production records |
| DAO workflows | `agrivault-dao-workflows` | Draft and pending-sync DAO forms |

Sync runs via `processSyncQueue()` (triggered from the topbar **Sync Status** indicator). After **5 failed retries**, items move to `manual_review` status.

CLAN technicians should install the PWA from the login page (**Install for Offline Use**) before going to low-connectivity areas.

---

## GPS (administrator summary)

- Primary capture: `/field/boundary-capture` (Mapbox + device GPS)
- Farmer-scoped: `/field/boundary-capture?farmer=<uuid>`
- DAO evidence: GPS point/field evidence form on district dashboard
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN` and device location permission

---

## Reporting (administrator summary)

| Surface | Path | Audience |
|---------|------|----------|
| Reporting workspace | `/reporting/workspace?tab=dao\|cac` | DAO, CAC |
| Ministry reports | `/reports`, `/reports/ministry` | Ministry |
| Executive briefing PDF | `/api/reports/executive-briefing` | Ministry, CAC |
| Rice season PDF | `/api/reports/rice` | Ministry |

Reporting workspace tabs: `dao`, `cac`, `drafts`, `submitted`, `review`, `verified`, `escalated`, `archived`.

---

## Common errors and resolutions

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| Redirect loop or "access denied" after login | Role mismatch in `profiles` | Fix role in Supabase; user must re-login |
| Map shows "token missing" | `NEXT_PUBLIC_MAPBOX_TOKEN` unset | Add token to environment; redeploy |
| Sync never completes | Edge function `sync-batch` unavailable | Deploy function; check Supabase logs |
| Workflow buttons disabled | Session role cannot act at current stage | Confirm correct user is logged in (not role switcher preview) |
| Queue counts differ between screens | Mixed LIVE + PILOT + DEMO sources | Check Data Source badge on each surface |
| PDF export fails | Auth required on `/api/reports/executive-briefing` | Ensure user is signed in with Ministry/CAC role |
| 429 Too Many Requests | Rate limit on public endpoints | Wait 1 minute; see [production-readiness.md](./production-readiness.md) |
| Offline items stuck after 5 retries | Network or validation failure | Review in sync queue; re-submit manually from DAO dashboard |

See [pilot-readiness-qa.md](./pilot-readiness-qa.md) for the full QA audit and known pilot risks.

---

## Demo and training

Use [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a structured walkthrough of the full operational chain.

Use [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) for pre-launch, daily, and post-pilot checklists.

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) | Field technician operations |
| [DAO_GUIDE.md](./DAO_GUIDE.md) | District officer operations |
| [CAC_GUIDE.md](./CAC_GUIDE.md) | County coordinator operations |
| [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) | National command operations |
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Live demonstration script |
| [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) | Launch checklist |
| [workflow-completeness-audit.md](./workflow-completeness-audit.md) | Workflow engine audit |
| [data-source-inventory.md](./data-source-inventory.md) | Data provenance reference |
| [production-readiness.md](./production-readiness.md) | Infrastructure hardening |
| [security-hardening-notes.md](./security-hardening-notes.md) | API security notes |
