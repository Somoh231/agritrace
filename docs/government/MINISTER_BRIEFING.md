# Minister of Agriculture — Executive Briefing

**Classification:** Cabinet-in-Confidence  
**Platform:** AgriVault (`agritrace`) · Release Candidate 1 (0.1.0-rc1)  
**Date:** July 2026  
**Prepared for:** Honourable Minister of Agriculture, Republic of Liberia  
**Prepared by:** Ministry Programme Office

**Related:** [../product/VISION.md](../product/VISION.md) · [../business/PLATFORM_OVERVIEW.md](../business/PLATFORM_OVERVIEW.md) · [CABINET_BRIEF.md](./CABINET_BRIEF.md)

---

## Table of contents

1. [Purpose](#purpose)
2. [The problem](#the-problem)
3. [The AgriVault solution](#the-agrivault-solution)
4. [Pilot status (RC1)](#pilot-status-rc1)
5. [Request for approval](#request-for-approval)
6. [Risks and mitigations](#risks-and-mitigations)
7. [Next steps](#next-steps)

---

## Purpose

This briefing requests your approval to proceed with a controlled Ministry pilot of AgriVault — the national agricultural operations platform — in two pilot counties during Q3 2026. The pilot will validate the CLAN → DAO → CAC → Ministry approval chain under live field conditions before national scale.

---

## The problem

Liberia's agricultural programmes depend on fragmented paper registers, duplicate spreadsheets, and informal approval channels. Cabinet and donor reports are assembled manually. Field staff cannot register farmers or capture GPS farm boundaries when connectivity fails. There is no single, auditable system of record linking field capture to national planning.

| Current gap | Consequence |
|-------------|-------------|
| No verified digital farmer registry | Programme targeting and subsidy allocation lack traceability |
| Paper-based approvals | Delays, lost records, weak accountability |
| Disconnected donor reporting | Partners cannot verify programme outcomes from operational data |
| No GPS-verified boundaries | Weak foundation for land use, cocoa compliance, and EUDR readiness |

Full problem framing: [../product/VISION.md](../product/VISION.md) § Problem statement.

---

## The AgriVault solution

AgriVault is the Ministry's operational system of record for field agriculture. It connects field technicians (CLAN), district officers (DAO), county coordinators (CAC), and Ministry national staff in a single verified workflow — from farmer registration and GPS boundary capture through multi-level approval to cabinet-ready reporting.

```mermaid
flowchart LR
  CLAN[CLAN<br/>Field capture] --> DAO[DAO<br/>District review]
  DAO --> CAC[CAC<br/>County verify]
  CAC --> MIN[Ministry<br/>National approve]
  MIN --> CMD[Command Center<br/>Executive briefing]
```

**Key capabilities (RC1):**

| Capability | Benefit |
|------------|---------|
| Offline-first field capture (PWA) | Operations continue without connectivity |
| GPS farm boundary capture (Mapbox) | Verified geospatial registry |
| Finite-state approval workflow | Auditable CLAN → DAO → CAC → Ministry chain |
| Executive briefing PDF | Cabinet-ready reports from live data |
| Donor observer access | Read-only programme visibility for partners |

Platform scope: [../business/PLATFORM_OVERVIEW.md](../business/PLATFORM_OVERVIEW.md).

---

## Pilot status (RC1)

Release Candidate 1 (0.1.0-rc1) is **approved for Ministry pilot deployment** in controlled county environments. Engineering verification completed 3 July 2026: build, lint, and 29/29 workflow tests pass. RC1 is **not** approved for unrestricted public production without post-pilot hardening.

| Milestone | Status |
|-----------|--------|
| Workflow chain (11 submission types) | Complete |
| Offline sync (IndexedDB + Edge Function) | Complete |
| Role-based access (18 roles) | Complete |
| Production HTTP hardening (CSP, rate limits) | Complete |
| Pilot user guides (CLAN, DAO, CAC, Ministry) | Complete |
| Ministry pilot go/no-go sign-off | **Pending your approval** |

Pilot counties (subject to Steering Committee confirmation): **Bong** and **Lofa**. Detail: [COUNTY_ROLLOUT_PLAN.md](./COUNTY_ROLLOUT_PLAN.md).

---

## Request for approval

The Ministry Programme Office requests the Honourable Minister's approval to:

1. **Authorise pilot deployment** of AgriVault RC1 in Bong and Lofa counties for a four-week operational pilot (Q3 2026).
2. **Endorse the national governance model** — National Steering Committee, county programme boards, district operational teams — as set out in [NATIONAL_GOVERNANCE_MODEL.md](./NATIONAL_GOVERNANCE_MODEL.md).
3. **Direct procurement** to proceed with the framework procurement package in [PROCUREMENT_PACKAGE.md](./PROCUREMENT_PACKAGE.md), subject to Public Procurement and Concessions Commission (PPCC) procedures.
4. **Confirm donor data-sharing boundaries** per [DATA_SHARING_FRAMEWORK.md](./DATA_SHARING_FRAMEWORK.md) and [DONOR_GUIDE.md](./DONOR_GUIDE.md).

---

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low field adoption | Medium | High | Structured training; change management per [../business/CHANGE_MANAGEMENT.md](../business/CHANGE_MANAGEMENT.md) |
| Connectivity gaps | High | Medium | Offline-first PWA; sync reconciliation SOP |
| Data quality at scale | Medium | High | County data stewards; evaluation framework |
| Post-pilot security gaps | Medium | High | Q4 hardening phase; [../TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) |
| Procurement delay | Medium | Medium | Framework contract; phased scope |

Full risk register: [../business/RISK_REGISTER.md](../business/RISK_REGISTER.md).

---

## Next steps

| Step | Owner | Target |
|------|-------|--------|
| Minister approval (this briefing) | Honourable Minister | July 2026 |
| Cabinet memorandum submission | Permanent Secretary | July 2026 |
| Steering Committee charter | Programme lead | Week −4 |
| County readiness (Bong, Lofa) | County CACs | Week −2 |
| Pilot go-live | Programme office | Q3 2026 |
| Pilot evaluation and go/no-go | Evaluation team | End Q3 2026 |

Implementation timeline: [IMPLEMENTATION_TIMELINE.md](./IMPLEMENTATION_TIMELINE.md).  
Evaluation criteria: [PILOT_EVALUATION_FRAMEWORK.md](./PILOT_EVALUATION_FRAMEWORK.md).

---

*AgriVault — Ministry of Agriculture, Republic of Liberia · RC1 · July 2026*
