# AgriVault Ministry Pilot — Checklist

**Version:** Pilot 1.0 · July 2026  
**Owner:** Pilot administrator / Ministry programme lead

Use this checklist across three phases: **Pre-launch**, **During pilot**, and **Post-pilot**.

---

## Architecture overview (reference)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CLAN     │ ──► │     DAO     │ ──► │     CAC     │ ──► │   Ministry  │
│ Field capture│     │District review│   │County verify│     │National approve│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │                   │
      ▼                    ▼                   ▼                   ▼
 IndexedDB            DAO workflow         CaoApproval        Command center
 agrivault-offline     queue + forms        Queues             + PDF exports
      │                    │                   │                   │
      └────────────────────┴───────────────────┴───────────────────┘
                                    │
                          operational_submissions
                          (Supabase + workflow API)
```

**Stack:** Next.js 14 · Supabase · Mapbox · IndexedDB · PWA  
**Docs:** [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) · [production-readiness.md](./production-readiness.md)

---

## Phase 1 — Pre-launch

### Infrastructure

- [ ] Deployment URL confirmed and shared with pilot users
- [ ] Supabase project provisioned (Auth + Postgres + Edge Functions)
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] Edge Function `sync-batch` deployed (offline sync)
- [ ] CSP verified on staging — Mapbox and Supabase domains allowed ([production-readiness.md](./production-readiness.md))
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run test:workflow` passes (29+ checks)

### User provisioning

- [ ] CLAN accounts created (`clan_technician` / `field_agent`)
- [ ] DAO accounts created (`dao_officer` / `district_officer`)
- [ ] CAC accounts created (`county_agriculture_coordinator` / `county_officer`)
- [ ] Ministry accounts created (`ministry_officer` / `ministry_admin`)
- [ ] All users have matching `profiles` rows in Supabase
- [ ] Demo accounts seeded (`npm run seed:demo`) for training
- [ ] Role landing paths verified (each role reaches correct home page)

### Device and field readiness

- [ ] CLAN devices identified (Android/iOS with GPS)
- [ ] PWA install instructions shared ([CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md))
- [ ] Location permission guidance provided
- [ ] Offline sync procedure understood by CLAN and DAO leads
- [ ] Backup connectivity plan (mobile data hotspots) for sync days

### Documentation and training

- [ ] [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) distributed to administrators
- [ ] [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) distributed to field technicians
- [ ] [DAO_GUIDE.md](./DAO_GUIDE.md) distributed to district officers
- [ ] [CAC_GUIDE.md](./CAC_GUIDE.md) distributed to county coordinators
- [ ] [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) distributed to Ministry staff
- [ ] [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) rehearsed with presenter
- [ ] Support contact established for field issues

### Go / no-go criteria

- [ ] Login works for all four role groups
- [ ] At least one end-to-end workflow test: CLAN submit → DAO approve → CAC approve → Ministry approve
- [ ] GPS boundary capture works with Mapbox token
- [ ] Offline capture + sync tested on at least one CLAN device
- [ ] Executive briefing PDF exports successfully
- [ ] Data Source badges visible on key dashboards

**Go decision signed by:** _________________ **Date:** _________

---

## Phase 2 — During pilot (daily / weekly)

### Daily — Field operations

- [ ] CLAN technicians synced overnight data (pending count = 0)
- [ ] No items stuck in `manual_review` offline status
- [ ] GPS captures completing without token errors
- [ ] Field reports submitted for the day

### Daily — DAO desk

- [ ] Verification queue `dao_review` backlog reviewed
- [ ] Registration approvals processed
- [ ] Field agent monitoring checked (`/field-agents`)
- [ ] DAO workflow queue flushed (no `pending_sync` items)

### Daily — CAC desk

- [ ] CaoApprovalQueues tabs reviewed
- [ ] No items stuck in `cac_review` overnight
- [ ] Pest escalations actioned
- [ ] Alerts reviewed

### Daily — Ministry desk

- [ ] Command center KPIs reviewed (note Data Source badges)
- [ ] `ministry_review` and `escalated` items actioned
- [ ] Anomalies and compliance flags checked

### Weekly

- [ ] Executive briefing PDF generated and shared
- [ ] Reporting workspace tabs reviewed (`verified`, `escalated`, `archived`)
- [ ] Pilot feedback collected from each role group
- [ ] Supabase logs reviewed for sync errors
- [ ] Rate limit / 429 incidents checked ([production-readiness.md](./production-readiness.md))
- [ ] Offline sync success rate tracked (CLAN devices)

### Weekly — Risk watchlist

Known pilot risks ([pilot-readiness-qa.md](./pilot-readiness-qa.md)):

- [ ] Verification queue data source understood (demo + live merge)
- [ ] Transfer count discrepancies documented if observed
- [ ] Mapbox token validity confirmed
- [ ] No unauthorized access to executive briefing PDF endpoint

---

## Phase 3 — Post-pilot

### Data and reporting

- [ ] Final executive briefing PDF archived
- [ ] All `ministry_approved` items counted and reported
- [ ] Escalated/rejected items reviewed with stakeholders
- [ ] Data source inventory documented for each KPI used in reporting ([data-source-inventory.md](./data-source-inventory.md))
- [ ] LIVE vs PILOT vs DEMO breakdown included in final report

### Technical review

- [ ] Workflow completeness audit reviewed ([workflow-completeness-audit.md](./workflow-completeness-audit.md))
- [ ] Security hardening notes addressed or deferred with rationale ([security-hardening-notes.md](./security-hardening-notes.md))
- [ ] Production readiness gaps logged ([production-readiness.md](./production-readiness.md))
- [ ] Offline sync reliability assessed (% success, manual_review count)
- [ ] Performance and CSP issues logged

### Stakeholder outcomes

- [ ] Pilot outcomes presentation delivered to Ministry leadership
- [ ] CLAN/DAO/CAC feedback synthesized
- [ ] Scale-up requirements documented (users, counties, infrastructure)
- [ ] Go/no-go for expanded rollout decided

**Post-pilot decision:** ☐ Scale  ☐ Extend pilot  ☐ Pause  
**Signed by:** _________________ **Date:** _________

---

## Role quick-reference

| Role | Login lands on | Primary approval surface | Offline capable |
|------|---------------|--------------------------|-----------------|
| CLAN | `/field/mobile` | Submit only | Yes (IndexedDB) |
| DAO | `/district-dashboard` | `/verification-queue` | Yes (DAO queue) |
| CAC | `/county-dashboard` | CaoApprovalQueues | Draft only |
| Ministry | `/command-center` | `/verification-queue` | No |

---

## Common errors — escalation matrix

| Error | First responder | Escalate to |
|-------|-----------------|-------------|
| Login / role issue | Pilot admin | Supabase admin |
| Mapbox / GPS failure | Pilot admin | Infrastructure team |
| Offline sync failure | DAO lead | Pilot admin |
| Workflow action fails | Role supervisor | Pilot admin |
| PDF export fails | Ministry user | Pilot admin |
| Data count mismatch | Presenter notes badge | Data team |
| 429 rate limit | Wait 60s | Infrastructure team |
| Security concern | Pilot admin | Security review |

---

## Validation commands

Run before launch and after any deployment:

```bash
npm run lint
npm run build
npm run test:workflow
```

---

## Document index

| Document | Purpose |
|----------|---------|
| [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) | Administrator operations |
| [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) | Field technician guide |
| [DAO_GUIDE.md](./DAO_GUIDE.md) | District officer guide |
| [CAC_GUIDE.md](./CAC_GUIDE.md) | County coordinator guide |
| [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) | Ministry national guide |
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Live demonstration script |
| [pilot-readiness-qa.md](./pilot-readiness-qa.md) | QA audit report |
| [workflow-completeness-audit.md](./workflow-completeness-audit.md) | Workflow engine audit |
| [data-source-inventory.md](./data-source-inventory.md) | Data provenance |
| [production-readiness.md](./production-readiness.md) | Infrastructure hardening |
| [security-hardening-notes.md](./security-hardening-notes.md) | API security |
