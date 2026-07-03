# AgriVault — Post-Pilot Roadmap

**Version:** 0.1.0-rc1 baseline  
**Date:** 2026-07-03  
**Horizon:** Q3 2026 – Q1 2027  
**Audience:** Ministry leadership, programme managers, engineering

This roadmap assumes a successful Ministry pilot (1–2 counties, 4 role groups, 2–4 week duration) and maps the path from RC1 to national scale.

---

## Vision

AgriVault becomes Liberia's auditable agriculture operations platform — connecting every field capture to a verified national record, with offline resilience for rural connectivity and cabinet-ready reporting for Ministry leadership.

---

## Phase 0 — Pilot (Now → Week 4)

**Goal:** Validate CLAN → DAO → CAC → Ministry chain in live conditions.

| Milestone | Deliverable | Owner |
|-----------|-------------|-------|
| Week 0 | RC1 deployed; env vars + Mapbox + Edge Function confirmed | Admin |
| Week 0 | User provisioning complete; role guides distributed | Admin |
| Week 1 | First live submissions through full approval chain | CLAN/DAO/CAC |
| Week 1 | Offline sync tested on ≥2 CLAN devices | Field lead |
| Week 2 | Executive briefing PDF delivered to leadership | Ministry |
| Week 3 | Pilot feedback collected from all role groups | Programme manager |
| Week 4 | Go/no-go decision for county scale-up | Ministry |

**Success metrics:**

- ≥80% CLAN sync success rate (excluding connectivity outages)
- ≥90% DAO review within 24 hours of submission
- Zero unresolved `manual_review` items at week end
- Executive briefing generated from ≥50% LIVE-sourced KPIs

**Exit criteria:** [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) Phase 3 complete.

---

## Phase 1 — Pilot hardening (Weeks 5–8)

**Goal:** Close P0 technical debt before adding counties.

| Workstream | Items | Outcome |
|------------|-------|---------|
| Security | TD-001 PDF auth, TD-002 distributed rate limits | All exports authenticated; abuse-resistant APIs |
| Auth | TD-003 role landing fixes | Correct home page for every role |
| Testing | TD-004 Playwright E2E suite | Automated pilot chain smoke on every deploy |
| Data | TD-006 live-only queue mode | Production reviewers see only real submissions |

**Deliverables:**

- RC2 release with security fixes
- CI pipeline: lint + build + test:workflow + Playwright smoke
- Pilot retrospective document

**Readiness target:** Production readiness score 85+.

---

## Phase 2 — County scale-up (Months 3–4)

**Goal:** Expand from pilot counties to 5–8 counties with live Supabase data.

| Workstream | Scope |
|------------|-------|
| Data model | TD-005 unified transfer model; live warehouse signals |
| Offline | TD-007 sync queue inspection UI; sync reliability monitoring |
| Workflow | TD-008 donor/inventory receipt bridge |
| Reporting | TD-012 data-source badges on executive briefing |
| GIS | County boundary validation; plot overlap detection |
| Admin | Bulk user import; county-scoped RLS policies |

**New features:**

- SMS/push notification for pending approvals (beyond in-app `workflow_notifications`)
- County performance dashboard with week-over-week trends
- Farmer self-registration QR flow (CLAN verification required)
- Rice season automated PDF scheduling

**Infrastructure:**

- Supabase RLS audit for multi-county isolation
- Staging environment mirroring production schema
- Backup and point-in-time recovery runbook

**Success metrics:**

- 5+ counties onboarded
- ≥500 LIVE farmer registrations
- ≥200 approved farm boundaries
- Dashboard KPIs ≥80% LIVE-sourced

---

## Phase 3 — National rollout (Months 5–8)

**Goal:** All 15 counties on platform; Ministry daily operational use.

| Workstream | Scope |
|------------|-------|
| Performance | TD-018 code splitting; TD-017 Lighthouse CI |
| Security | TD-011 CSP nonces; TD-009 CAPTCHA; penetration test |
| Compliance | Full audit log export; EUDR DDS production workflow |
| Integration | MoA legacy system CSV import; donor API feeds |
| Mobile | Evaluate native wrapper (Capacitor) if PWA limits hit |

**New features:**

- National subsidy allocation engine with county quotas
- Predictive food security alerts (seasonal forecasting model)
- Donor programme portal with scoped read access
- Sw/local language field forms (Kpelle, Bassa pilot)

**Governance:**

- Data retention policy (archived submissions → cold storage)
- Role provisioning SOP for county HR
- Incident response playbook

**Success metrics:**

- All counties active with ≥1 DAO and ≥1 CLAN per district
- Ministry command center used daily by national staff
- ≤4 hour median approval cycle (submit → ministry_approved)

---

## Phase 4 — Platform maturity (Months 9–12)

**Goal:** General availability; donor and export chain integration.

| Workstream | Scope |
|------------|-------|
| AI | TD-016 re-enable AiAssistant with role-scoped context |
| Analytics | National heat map real-time; loss hotspot ML |
| Export | Cocoa/EUDR full chain; exporter self-service portal |
| Open data | Anonymized aggregate API for research partners |
| Sustainability | Cost model; Supabase scale plan; Mapbox usage budget |

**New features:**

- Cooperative manager workflow stage (TD-020)
- Warehouse manager mobile scanning (barcode/QR)
- Inter-county transfer approval chain
- Public transparency dashboard (aggregate, no PII)

---

## Roadmap timeline

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

## Investment areas

| Area | Pilot (RC1) | Scale-up | National |
|------|-------------|----------|----------|
| Engineering | 1 FTE | 2 FTE | 3 FTE |
| Field support | 1 coordinator | 2 coordinators | County helpdesk |
| Infrastructure | Vercel + Supabase Pro | + KV/Redis | + dedicated Supabase |
| Training | 4 role guides | County train-the-trainer | Video library |
| GIS | Mapbox standard | + offline tiles cache | + satellite overlay |

---

## Decision gates

| Gate | When | Question | Go criteria |
|------|------|----------|-------------|
| G1 | End of pilot week 4 | Scale to more counties? | ≥80% sync success; leadership sign-off |
| G2 | End of Phase 1 | Production-ready for 5 counties? | RC2 deployed; E2E tests green; PDF auth fixed |
| G3 | End of Phase 2 | National rollout? | 5 counties live; RLS audit pass |
| G4 | End of Phase 3 | General availability? | 15 counties; pen test pass; SLA defined |

---

## Dependencies and risks

| Risk | Mitigation | Phase |
|------|------------|-------|
| Rural connectivity | Offline-first PWA; sync queue monitoring | 0–2 |
| Mapbox cost at scale | Tile caching; usage alerts | 2–3 |
| User adoption | Train-the-trainer; DAO desk embedded in existing workflow | 0–2 |
| Data quality | Corrections workflow; registration approval flags | 0–3 |
| Supabase RLS gaps | Policy audit before multi-county | 2 |
| Political reporting pressure | Data-source badges; LIVE/DEMO disclosure | 0–4 |

---

## Technical debt alignment

| Roadmap phase | Debt items |
|---------------|------------|
| Phase 1 | TD-001, TD-002, TD-003, TD-004, TD-006 |
| Phase 2 | TD-005, TD-007, TD-008, TD-012, TD-013 |
| Phase 3 | TD-009, TD-010, TD-011, TD-017, TD-018 |
| Phase 4 | TD-014, TD-015, TD-016, TD-019, TD-020 |

Full register: [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELEASE_NOTES_RC1.md](./RELEASE_NOTES_RC1.md) | RC1 verification and scores |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Accepted RC1 constraints |
| [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) | Launch checklist |
| [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) | Administrator operations |
| [production-readiness.md](./production-readiness.md) | Infrastructure detail |

---

## Review schedule

| Review | Date | Participants |
|--------|------|--------------|
| Pilot kickoff | Week 0 | Admin, Ministry lead |
| Week 2 checkpoint | Week 2 | All role leads |
| Pilot retrospective | Week 4 | Ministry + engineering |
| Scale-up planning | Week 5 | Ministry leadership |
| Quarterly roadmap | Every 90 days | Programme board |
