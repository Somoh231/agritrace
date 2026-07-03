# AgriVault Product Roadmap

**Version:** 1.0 · 2026-07-03  
**Baseline:** 0.1.0-rc1  
**Horizon:** Q3 2026 – Q1 2027  
**Aligned with:** [../ROADMAP_POST_PILOT.md](../ROADMAP_POST_PILOT.md)

**Related:** [VISION.md](./VISION.md) · [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) · [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md)

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [Roadmap principles](#roadmap-principles)
3. [Phase overview](#phase-overview)
4. [Phase 0 — Pilot (Now → Week 4)](#phase-0--pilot-now--week-4)
5. [Phase 1 — Pilot hardening (Weeks 5–8)](#phase-1--pilot-hardening-weeks-58)
6. [Phase 2 — County scale-up (Months 3–4)](#phase-2--county-scale-up-months-34)
7. [Phase 3 — National rollout (Months 5–8)](#phase-3--national-rollout-months-58)
8. [Phase 4 — Platform maturity (Months 9–12)](#phase-4--platform-maturity-months-912)
9. [Feature roadmap by module](#feature-roadmap-by-module)
10. [Decision gates](#decision-gates)
11. [Investment and capacity](#investment-and-capacity)
12. [Risks and dependencies](#risks-and-dependencies)
13. [Review schedule](#review-schedule)

---

## Executive summary

AgriVault's product roadmap progresses from **RC1 pilot validation** (1–2 counties, four role groups, CLAN → Ministry chain) to **national scale** (15 counties, cabinet-ready reporting, donor integration) over four phases spanning Q3 2026 – Q1 2027.

This document translates engineering phases from [../ROADMAP_POST_PILOT.md](../ROADMAP_POST_PILOT.md) into **product outcomes** — what users gain at each stage, which modules mature, and which principles from [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) are strengthened.

---

## Roadmap principles

| Principle | Roadmap implication |
|-----------|---------------------|
| Every action is auditable | Workflow engine ships before scale-up; no bypass shortcuts in Phase 2+ |
| Offline-first | CLAN sync reliability is Phase 0 exit criterion |
| Human approval overrides AI | AI assistant deferred to Phase 4 (TD-016) |
| Data integrity over velocity | Phase 1 hardening before county expansion |
| Explainability before automation | Automated notifications in Phase 2; no auto-approval |

---

## Phase overview

| Phase | Timeline | Product goal | Engineering release |
|-------|----------|--------------|---------------------|
| **0 — Pilot** | Now → Week 4 | Validate operational chain in live conditions | RC1 (current) |
| **1 — Hardening** | Weeks 5–8 | Production-ready for multi-county | RC2 |
| **2 — County scale-up** | Months 3–4 | 5–8 counties on LIVE data | RC3 |
| **3 — National rollout** | Months 5–8 | All 15 counties, daily Ministry use | RC4 |
| **4 — Platform maturity** | Months 9–12 | GA, export chain, donor portal | GA 1.0 |

```
2026 Q3          Q4              2027 Q1
│                │                │
├─ Phase 0 ──────┤                │
   Pilot (RC1)   │                │
                 ├─ Phase 1 ──────┤
                 Hardening (RC2)  │
                 ├─ Phase 2 ──────┼── Phase 3 ──
                 County scale     National rollout
                                  ├─ Phase 4 ──►
                                  GA + export chain
```

---

## Phase 0 — Pilot (Now → Week 4)

**Goal:** Validate CLAN → DAO → CAC → Ministry chain in live field conditions.

### Product deliverables

| Week | Deliverable | User impact | Module |
|------|-------------|-------------|--------|
| 0 | RC1 deployed; role guides distributed | All 18 roles can authenticate to correct landing | Admin |
| 0 | Mapbox + offline PWA confirmed | CLAN can capture boundaries in field | Field, Offline |
| 1 | First live submissions through full chain | DAO/CAC/Ministry review real data | Workflow |
| 1 | Offline sync on ≥2 CLAN devices | Field capture without connectivity | Offline |
| 2 | Executive briefing PDF to leadership | Ministry gets cabinet-ready report | Reporting, Ministry |
| 3 | Feedback from all role groups | UX priorities for Phase 1 | All |
| 4 | Go/no-go for county scale-up | Programme decision | Governance |

### Success metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| CLAN sync success rate | ≥80% | Excluding connectivity outages |
| DAO review SLA | ≥90% within 24h | `submitted` → `dao_approved` |
| Manual review items | Zero unresolved at week end | Offline queue admin |
| Executive briefing LIVE KPIs | ≥50% | `DataSourceBadge` audit |

### Exit criteria

[PILOT_CHECKLIST.md](../PILOT_CHECKLIST.md) Phase 3 complete.

### Journeys validated

| Journey | Must complete in pilot |
|---------|------------------------|
| J1 Farmer Registration | ✅ Required |
| J2 GPS Boundary | ✅ Required |
| J3 Field Inspection | ✅ Required |
| J4 Pest Alert | 🔶 If outbreak occurs |
| J5 Subsidy Distribution | ✅ Required |
| J6 Harvest Report | 🔶 Season-dependent |
| J7 Warehouse Transfer | 🔶 If inventory active |
| J8 Executive Briefing | ✅ Required |

---

## Phase 1 — Pilot hardening (Weeks 5–8)

**Goal:** Close P0 technical debt before adding counties.

### Product deliverables

| Workstream | Product outcome | Debt items |
|------------|-----------------|------------|
| Security | All PDF exports require authenticated session | TD-001 |
| Security | Rate-limited public APIs | TD-002 |
| Auth | Every role lands on correct home page | TD-003 |
| Testing | Automated pilot chain smoke on every deploy | TD-004 |
| Data | Production reviewers see only LIVE submissions | TD-006 |

### Release: RC2

| Feature | Status in RC2 |
|---------|---------------|
| Workflow engine | Stable — no FSM changes |
| Role landing paths | Fixed per `postLoginHomeForRole` |
| CI pipeline | lint + build + test:workflow + Playwright smoke |
| Pilot retrospective | Published |

**Readiness target:** Production readiness score 85+ ([production-readiness.md](../production-readiness.md))

### Module maturity at RC2

| Module | RC1 | RC2 target |
|--------|-----|------------|
| Field | Functional | Sync reliability monitored |
| Workflow | Functional | Live-only queue mode |
| Reporting | PDF auth gap | Authenticated exports |
| Admin | Functional | Launch readiness dashboard |
| GIS | Functional | No change |
| Inventory | Functional | No change |

---

## Phase 2 — County scale-up (Months 3–4)

**Goal:** Expand from pilot counties to 5–8 counties with live Supabase data.

### Product deliverables

| Workstream | Product outcome | Debt items |
|------------|-----------------|------------|
| Data model | Unified transfer tracking | TD-005 |
| Offline | Sync queue inspection UI for admins | TD-007 |
| Workflow | Donor/inventory receipt bridge | TD-008 |
| Reporting | Data-source badges on all briefing KPIs | TD-012 |
| GIS | County boundary validation; plot overlap detection | — |
| Admin | Bulk user import; county-scoped RLS | — |

### New features

| Feature | Module | Actors | Priority |
|---------|--------|--------|----------|
| SMS/push approval notifications | Workflow | DAO, CAC | High |
| County performance dashboard (WoW trends) | County | CAC, Ministry | High |
| Farmer self-registration QR (CLAN verification required) | Field | CLAN, Farmer | Medium |
| Rice season automated PDF scheduling | Reporting | Ministry | Medium |

### Infrastructure

| Item | Product impact |
|------|----------------|
| RLS audit for multi-county | County data isolation guaranteed |
| Staging environment | Safe UAT before county onboarding |
| Backup runbook | Recovery confidence for leadership |

### Success metrics

| Metric | Target |
|--------|--------|
| Counties onboarded | 5+ |
| LIVE farmer registrations | ≥500 |
| Approved farm boundaries | ≥200 |
| Dashboard KPIs LIVE-sourced | ≥80% |

### Release: RC3

---

## Phase 3 — National rollout (Months 5–8)

**Goal:** All 15 counties on platform; Ministry daily operational use.

### Product deliverables

| Workstream | Product outcome | Debt items |
|------------|-----------------|------------|
| Performance | Fast load on low-bandwidth connections | TD-018 |
| Performance | Lighthouse CI gate | TD-017 |
| Security | CSP nonces, CAPTCHA, penetration test | TD-009, TD-011 |
| Compliance | Full audit log export; EUDR DDS production | TD-010 |
| Integration | MoA legacy CSV import; donor API feeds | — |
| Mobile | Capacitor evaluation if PWA limits hit | — |

### New features

| Feature | Module | Description |
|---------|--------|-------------|
| National subsidy allocation engine | Ministry | County quotas with workflow approval |
| Predictive food security alerts | Reporting | Seasonal forecasting model |
| Donor programme portal | External | Scoped read access per programme |
| Local language field forms | Field | Kpelle, Bassa pilot translations |

### Governance deliverables

| Deliverable | Owner |
|-------------|-------|
| Data retention policy | Ministry IT |
| Role provisioning SOP | County HR |
| Incident response playbook | Engineering + Ministry |

### Success metrics

| Metric | Target |
|--------|--------|
| Counties active | All 15 |
| DAO + CLAN per district | ≥1 each |
| Ministry command center daily use | National staff |
| Median approval cycle | ≤4 hours (submit → ministry_approved) |

### Release: RC4

---

## Phase 4 — Platform maturity (Months 9–12)

**Goal:** General availability; donor and export chain integration.

### Product deliverables

| Workstream | Product outcome | Debt items |
|------------|-----------------|------------|
| AI | Role-scoped assistant re-enabled | TD-016 |
| Analytics | Real-time national heat map; loss hotspot ML | TD-014, TD-015 |
| Export | Cocoa/EUDR full chain; exporter self-service | TD-019 |
| Open data | Anonymized aggregate API for researchers | — |
| Sustainability | Cost model; Supabase scale plan | — |

### New features

| Feature | Module | Description |
|---------|--------|-------------|
| Cooperative manager workflow stage | Workflow | TD-020 — cooperative approvals |
| Warehouse mobile scanning | Inventory | Barcode/QR receipt |
| Inter-county transfer approval chain | Inventory | Multi-stage transfer workflow |
| Public transparency dashboard | External | Aggregate data, no PII |

### Release: GA 1.0

---

## Feature roadmap by module

| Module | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|---------|
| **Field** | Core capture | Sync monitoring | QR self-reg | Local languages | — |
| **District** | DAO review | Live-only queue | SMS notify | — | — |
| **County** | CAC review | — | WoW dashboard | — | — |
| **Ministry** | Command center | PDF auth | — | Subsidy engine | — |
| **GIS** | Boundary capture | — | Overlap detection | Satellite overlay | Real-time heat map |
| **Inventory** | Transfers | — | Unified model | Inter-county chain | Mobile scanning |
| **Reporting** | Executive PDF | Auth fix | Auto-schedule | Forecasting | Open data API |
| **Admin** | User provision | E2E CI | Bulk import | Provisioning SOP | Cost model |
| **Offline** | PWA + sync | Retry monitoring | Inspection UI | — | — |
| **Workflow** | Full FSM | Live-only mode | Donor bridge | ≤4h SLA | Cooperative stage |

---

## Decision gates

| Gate | When | Question | Go criteria |
|------|------|----------|-------------|
| **G1** | End of pilot Week 4 | Scale to more counties? | ≥80% sync success; leadership sign-off |
| **G2** | End of Phase 1 | Production-ready for 5 counties? | RC2 deployed; E2E green; PDF auth fixed |
| **G3** | End of Phase 2 | National rollout? | 5 counties live; RLS audit pass |
| **G4** | End of Phase 3 | General availability? | 15 counties; pen test pass; SLA defined |

---

## Investment and capacity

| Area | Phase 0 (Pilot) | Phase 2 (Scale-up) | Phase 3 (National) |
|------|-----------------|--------------------|--------------------|
| Engineering | 1 FTE | 2 FTE | 3 FTE |
| Field support | 1 coordinator | 2 coordinators | County helpdesk |
| Infrastructure | Vercel + Supabase Pro | + KV/Redis | + dedicated Supabase |
| Training | 4 role guides | County train-the-trainer | Video library |
| GIS | Mapbox standard | + offline tiles cache | + satellite overlay |

---

## Risks and dependencies

| Risk | Product impact | Mitigation | Phase |
|------|----------------|------------|-------|
| Rural connectivity | CLAN cannot sync | Offline PWA; sync queue monitoring | 0–2 |
| Mapbox cost at scale | Budget overrun | Tile caching; usage alerts | 2–3 |
| User adoption | Low submission volume | Train-the-trainer; DAO desk embedding | 0–2 |
| Data quality | Unreliable KPIs | Corrections workflow; approval flags | 0–3 |
| Supabase RLS gaps | County data leakage | Policy audit before multi-county | 2 |
| Political reporting pressure | Misleading briefings | Data-source badges; LIVE/DEMO disclosure | 0–4 |

Full debt register: [../TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md)

---

## Review schedule

| Review | Date | Participants | Output |
|--------|------|--------------|--------|
| Pilot kickoff | Week 0 | Admin, Ministry lead | Baseline metrics |
| Week 2 checkpoint | Week 2 | All role leads | Journey status |
| Pilot retrospective | Week 4 | Ministry + engineering | Go/no-go (G1) |
| Scale-up planning | Week 5 | Ministry leadership | Phase 2 scope |
| Quarterly roadmap | Every 90 days | Programme board | Phase adjustments |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [../ROADMAP_POST_PILOT.md](../ROADMAP_POST_PILOT.md) | Engineering-aligned master roadmap |
| [VISION.md](./VISION.md) | 2030 strategic outcomes |
| [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) | Current RC1 feature inventory |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | Operational flows under development |
| [../RELEASE_NOTES_RC1.md](../RELEASE_NOTES_RC1.md) | RC1 verification baseline |
| [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) | Accepted RC1 constraints |
