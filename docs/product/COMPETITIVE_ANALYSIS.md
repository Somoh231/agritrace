# AgriVault Competitive Analysis

**Version:** 1.0 · 2026-07-03  
**Scope:** Liberia Ministry of Agriculture national operations platform  
**Related:** [VISION.md](./VISION.md) · [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) · [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [Evaluation criteria](#evaluation-criteria)
3. [Comparator overview](#comparator-overview)
4. [vs Paper registers and spreadsheets](#vs-paper-registers-and-spreadsheets)
5. [vs Generic FMIS platforms](#vs-generic-fmis-platforms)
6. [vs CommCare](#vs-commcare)
7. [vs DHIS2](#vs-dhis2)
8. [Capability comparison matrix](#capability-comparison-matrix)
9. [Total cost of ownership](#total-cost-of-ownership)
10. [When alternatives may be appropriate](#when-alternatives-may-be-appropriate)
11. [AgriVault positioning statement](#agrivault-positioning-statement)
12. [Sources and methodology](#sources-and-methodology)

---

## Executive summary

AgriVault is purpose-built for **Liberia's Ministry of Agriculture operational chain** — CLAN field capture through DAO, CAC, and Ministry approval — with offline-first PWA architecture and auditable workflow state. It does not compete as a generic data collection tool or a national health information system.

| Comparator | AgriVault advantage | Comparator advantage |
|------------|--------------------|-----------------------|
| Paper registers | Real-time registry, GPS, audit trail | Zero infrastructure cost, no training barrier |
| Generic FMIS | Government hierarchy workflow, Liberia scope | Broader crop modules, established vendor support |
| CommCare | Integrated registry + approval + inventory | Mature mobile forms, lower build cost for surveys |
| DHIS2 | Field-to-farmer operational granularity | National aggregate reporting standard, donor familiarity |

This analysis is **factual positioning** for programme and procurement decisions — not a marketing claim of universal superiority.

---

## Evaluation criteria

Criteria derived from [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) and [VISION.md](./VISION.md):

| Criterion | Weight | Definition |
|-----------|--------|------------|
| **Operational workflow** | High | CLAN → DAO → CAC → Ministry approval with audit trail |
| **Offline field capture** | High | Function without continuous connectivity |
| **Farmer registry + GIS** | High | Individual farmer records with GPS boundaries |
| **Inventory / subsidy traceability** | Medium | Link inputs to verified farmers |
| **Government terminology fit** | High | CLAN, DAO, CAC, Ministry language |
| **National reporting** | Medium | Executive briefing, food security aggregates |
| **Deployment complexity** | Medium | Time to pilot, training burden |
| **Donor reporting integration** | Medium | Programme-level visibility |
| **Total cost of ownership** | Medium | 3-year infrastructure + staffing |
| **Vendor independence** | Low | Open stack, data portability |

---

## Comparator overview

| Solution | Type | Primary use case | Deployment model |
|----------|------|------------------|------------------|
| **Paper registers** | Manual | Field data collection, programme rolls | Physical books, Excel transcription |
| **Generic FMIS** | Commercial/open platform | Farm management information (global) | Cloud SaaS or on-premise |
| **CommCare** | Open-source mobile platform | Structured mobile data collection (global health/development) | Dimagi cloud or self-hosted |
| **DHIS2** | Open-source health information system | Aggregate indicator reporting (WHO-aligned) | HISP-managed server or cloud |
| **AgriVault** | Custom national platform | Liberia MoA operational chain | Vercel + Supabase (RC1) |

---

## vs Paper registers and spreadsheets

### Current state in Liberian agriculture programmes

Many districts still maintain farmer rolls in **bound registers** transcribed to **Excel** for county and Ministry reporting. Signatures and physical vouchers remain common for subsidy distribution.

### Factual comparison

| Dimension | Paper / Excel | AgriVault |
|-----------|---------------|-----------|
| Data duplication | High — re-entry at each administrative level | Single registry with RLS-scoped views |
| GPS boundaries | Not captured or approximate sketches | Mapbox polygon capture with Turf area |
| Approval chain | Phone calls, physical signatures | FSM with `workflow_actions` audit ledger |
| Offline operation | Always "offline" | PWA with IndexedDB sync queue |
| Audit trail | Incomplete — pages can be lost or altered | Append-only `workflow_actions`, `audit_log` |
| Search and lookup | Manual page turning or Excel filter | `/farmers`, `/verification-queue` |
| Cabinet reporting | Manual assembly (days) | Executive briefing PDF (minutes) |
| Infrastructure cost | Minimal | Vercel + Supabase + Mapbox |
| Training requirement | Low (familiar) | Moderate — role guides required |
| Connectivity dependency | None for capture | Sync requires intermittent connectivity |

### Where paper still wins

- **Zero infrastructure** in areas with no mobile data and no device budget
- **No authentication complexity** — no passwords to manage
- **Legal familiarity** — physical signatures accepted by local institutions

### AgriVault mitigation

- Offline-first PWA removes live-connection requirement for capture ([../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md))
- Corrections workflow (`request_corrections`) handles data quality without discarding paper-era records
- Parallel run during pilot: paper register continues while AgriVault validates chain

### Positioning

AgriVault replaces paper not by digitizing the same process, but by **eliminating re-entry** and providing **verifiable provenance** from field to Ministry. The pilot success metric (≥80% CLAN sync rate) acknowledges that paper remains the fallback during connectivity outages.

---

## vs Generic FMIS platforms

### What generic FMIS provides

Farm Management Information Systems (e.g. commercial platforms marketed to African agriculture ministries) typically offer: crop planning modules, market price feeds, extension content libraries, and generic farmer CRM functionality. Many are cloud-hosted with per-seat licensing.

### Factual comparison

| Dimension | Generic FMIS | AgriVault |
|-----------|--------------|-----------|
| Government hierarchy workflow | Generic approval or none | CLAN → DAO → CAC → Ministry FSM |
| Liberia administrative units | Configurable but not pre-built | Counties, districts, MoA roles pre-mapped |
| Terminology | "Users", "approvers", "tickets" | CLAN, DAO, CAC per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) |
| Offline PWA | Varies — many require connectivity | Core architecture decision (Principle 2) |
| Inventory + subsidy linkage | Module add-on | Integrated `distribution_logs` → workflow |
| Cocoa/EUDR export chain | Uncommon | `/cocoa` module in RC1 |
| Customization cost | Configuration fees | Engineering FTE (roadmap phases) |
| Data sovereignty | Vendor-hosted | Supabase — Ministry-controlled project |
| Multi-country reuse | High | Low — Liberia-specific by design |

### Where generic FMIS wins

- **Faster initial deployment** for simple farmer CRM without approval chain
- **Vendor SLAs** and dedicated support teams
- **Broader crop libraries** and market integrations out of the box
- **Proven training materials** across multiple countries

### AgriVault differentiation

AgriVault is not a configurable FMIS — it is an **operational system of record** where the approval chain *is* the product. Generic FMIS platforms would require substantial customization to replicate:

- 13-state workflow FSM with county-bound reviewers
- Submission bridge from 11 domain form types
- Four workspace hubs (`/workspace/clan|dao|cac|ministry`)

See [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) and [ENTITY_CATALOG.md](./ENTITY_CATALOG.md).

---

## vs CommCare

### What CommCare provides

[CommCare](https://www.commcarehq.org/) (Dimagi) is an open-source mobile data collection platform widely used in global health and agriculture programmes. It offers form builder, case management, offline mobile app, and basic workflow (approval flags).

### Factual comparison

| Dimension | CommCare | AgriVault |
|-----------|----------|-----------|
| Form builder | ✅ Drag-and-drop, no code | ❌ Engineering required for new forms |
| Offline mobile | ✅ Native Android app | ✅ PWA (no app store required) |
| Case management | ✅ Patient/farmer "cases" | ✅ `farmers` + `plots` registry |
| Approval workflow | 🔶 Basic flags, limited FSM | ✅ 13-state FSM, 8 actions, county scope |
| GIS boundaries | 🔶 GPS points, limited polygon | ✅ Full polygon capture + Turf area |
| Inventory module | ❌ Not core | ✅ Warehouses, transfers, distributions |
| National dashboard | 🔶 Excel export + external BI | ✅ Command center, executive briefing |
| Multi-programme reuse | ✅ High — form changes in hours | 🔶 Requires engineering per module |
| Hosting | Dimagi cloud or self-hosted | Vercel + Supabase |
| Cost model | Per-user licensing (cloud) | Infrastructure + engineering FTE |
| Government role mapping | Custom user groups | 18 `UserRole` values with middleware |

### Where CommCare wins

- **Rapid form iteration** — programme managers can modify forms without developers
- **Proven offline Android app** — more mature than PWA on low-end devices
- **Large global community** — training materials, case studies, Dimagi support
- **Lower upfront build cost** for pure survey/data collection use cases

### Where AgriVault wins

- **Integrated approval chain** — not bolted-on flags but server-validated FSM
- **Inventory and subsidy traceability** — `distribution_logs` linked to verified farmers
- **Ministry command center** — national operational desk, not export-to-Excel
- **Data sovereignty** — full PostgreSQL schema under Ministry Supabase project
- **No per-seat licensing** at scale (infrastructure cost only)

### Positioning

Choose CommCare when the primary need is **flexible mobile surveys** with basic case tracking. Choose AgriVault when the primary need is a **government operational system** with hierarchy approval, inventory linkage, and national reporting.

AgriVault does not replicate CommCare's form builder — and per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 5, will not sacrifice workflow integrity for form flexibility.

---

## vs DHIS2

### What DHIS2 provides

[DHIS2](https://dhis2.org/) is the WHO-aligned open-source health information system used by many African ministries for **aggregate indicator reporting** — facility counts, disease surveillance, immunization coverage. Some agriculture programmes use DHIS2 for crop production aggregates.

### Factual comparison

| Dimension | DHIS2 | AgriVault |
|-----------|-------|-----------|
| Data granularity | Aggregate (facility/district level) | Individual farmer and plot level |
| Primary users | Epidemiologists, statisticians | CLAN technicians, DAO officers |
| Offline capture | 🔶 Android capture app (aggregate) | ✅ PWA individual record capture |
| Workflow approval | ❌ Not designed for operational approval | ✅ Core FSM |
| GIS farm boundaries | ❌ Not core | ✅ Polygon capture and registry |
| Inventory tracking | ❌ Not core | ✅ Warehouse module |
| Donor familiarity | Very high (health programmes) | Building (agriculture-specific) |
| Interoperability standard | ADX, FHIR (health) | REST API (pilot), CSV export (Phase 3) |
| National aggregate reporting | ✅ Excellent | 🔶 Executive briefing (developing) |
| Liberia existing deployment | MoH DHIS2 instance exists | MoA greenfield |

### Where DHIS2 wins

- **National aggregate reporting** — proven indicator engine, donor dashboards
- **Existing Liberia health infrastructure** — technical capacity exists in-country
- **WHO/donor alignment** — familiar to health-focused partners
- **Mature analytics** — charts, maps, scorecards out of the box

### Where AgriVault wins

- **Farmer-level operational records** — who received what input, where, when
- **GPS-verified boundaries** — not representable in DHIS2 aggregate model
- **CLAN → Ministry approval** — operational governance, not just reporting
- **Subsidy distribution audit** — individual traceability for anti-fraud

### Complementary positioning

AgriVault and DHIS2 are **not direct substitutes**. A mature national architecture may:

1. Use AgriVault for **operational capture and approval** (farmer registry, distributions)
2. Aggregate approved data to DHIS2 **indicators** for donor reporting (Phase 3 integration)

AgriVault Phase 3 includes "donor API feeds" and CSV import — potential DHIS2 aggregate export path.

---

## Capability comparison matrix

| Capability | Paper | Generic FMIS | CommCare | DHIS2 | AgriVault |
|------------|-------|--------------|----------|-------|-----------|
| Individual farmer registry | 🔶 | ✅ | ✅ | ❌ | ✅ |
| GPS farm boundaries | ❌ | 🔶 | 🔶 | ❌ | ✅ |
| Offline field capture | ✅ | 🔶 | ✅ | 🔶 | ✅ |
| CLAN→DAO→CAC→Ministry workflow | ❌ | ❌ | 🔶 | ❌ | ✅ |
| County-bound reviewer scope | ❌ | 🔶 | 🔶 | N/A | ✅ |
| Warehouse / inventory | 🔶 | 🔶 | ❌ | ❌ | ✅ |
| Subsidy distribution traceability | 🔶 | 🔶 | 🔶 | ❌ | ✅ |
| Executive / cabinet reporting | ❌ | 🔶 | ❌ | ✅ | ✅ |
| Audit trail (immutable) | ❌ | 🔶 | 🔶 | 🔶 | ✅ |
| Form builder (no-code) | N/A | 🔶 | ✅ | ✅ | ❌ |
| National aggregate indicators | ❌ | 🔶 | ❌ | ✅ | 🔶 |
| Liberia MoA terminology | ✅ | ❌ | ❌ | N/A | ✅ |
| Cocoa/EUDR export chain | ❌ | 🔶 | ❌ | ❌ | ✅ |
| Deployment time (pilot) | Immediate | 2–6 months | 2–8 weeks | 3–12 months | RC1 deployed |

**Legend:** ✅ Strong · 🔶 Partial · ❌ Weak or not applicable

---

## Total cost of ownership

Indicative 3-year comparison for **5-county scale** (not binding quotes):

| Cost category | Paper | CommCare Cloud | DHIS2 (self-hosted) | AgriVault |
|---------------|-------|----------------|---------------------|-----------|
| Software licensing | — | $15–40K/year (est. users) | — | — |
| Infrastructure | — | Included | $20–50K setup + hosting | $5–15K/year (Supabase Pro + Vercel) |
| Engineering | — | Low (config) | Medium (customization) | 2–3 FTE (roadmap) |
| Training | Low | Medium | High | Medium (role guides) |
| Devices | — | Android smartphones | Android/data entry | Android (PWA) |
| Map/GIS | — | — | — | $2–5K/year Mapbox |
| **Relative TCO** | Lowest | Medium | Medium–High | Medium |

AgriVault trades **higher initial engineering** for **no per-seat licensing** and **full data ownership**. CommCare cloud licensing can exceed infrastructure costs at national user scale.

---

## When alternatives may be appropriate

| Scenario | Recommended approach |
|----------|---------------------|
| One-off baseline survey (no ongoing registry) | CommCare or Kobo Toolbox |
| National crop production aggregates only (no farmer IDs) | DHIS2 indicators |
| Single cooperative internal management | Generic FMIS or spreadsheet |
| Area with zero devices and zero connectivity budget | Paper register (AgriVault not viable) |
| Full MoA operational chain with subsidy traceability | AgriVault |
| Cabinet-ready reporting from verified field data | AgriVault |
| EUDR cocoa export compliance chain | AgriVault `/cocoa` module |

---

## AgriVault positioning statement

> **AgriVault is Liberia's auditable agriculture operations platform** — not a survey tool, not a health information system, and not a generic farm management product. It connects every CLAN field capture to a Ministry-verified national record through the government's own operational hierarchy, with offline resilience for rural districts and provenance disclosure for leadership reporting.

### Strategic moat

| Moat element | Why alternatives struggle to replicate |
|--------------|----------------------------------------|
| Workflow FSM | 13 states × 4 stages × county scope — months of domain engineering |
| Role × route matrix | 18 roles × 30+ gated routes — Liberian government structure |
| Offline → workflow bridge | Dedupe keys, sync-batch, submission bridge — integrated pipeline |
| Programme trust | Data-source badges, audit ledger — governance requirement |

### Honest limitations (RC1)

| Limitation | Roadmap |
|------------|---------|
| No no-code form builder | Engineering per form type — acceptable for national SOR |
| PWA vs native app | Capacitor evaluation Phase 3 |
| PILOT/DEMO data mixing | LIVE-only mode Phase 1; badges throughout |
| AI assistant disabled | Phase 4 with human-approval guardrails |

See [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) and [ROADMAP.md](./ROADMAP.md).

---

## Sources and methodology

| Source | Use |
|--------|-----|
| AgriVault RC1 codebase | Feature and architecture facts |
| [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) | Capability inventory |
| [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) | Workflow differentiation |
| CommCare public documentation | CommCare capability baseline |
| DHIS2 public documentation | DHIS2 capability baseline |
| Liberia MoA pilot requirements | Evaluation criteria weighting |

This document will be updated at each roadmap phase gate (G1–G4). Competitive claims are limited to **verifiable architectural differences** — not user satisfaction or performance benchmarks (no RC1 production benchmark data yet).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [VISION.md](./VISION.md) | Strategic outcomes AgriVault pursues |
| [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) | Non-negotiable design constraints |
| [ROADMAP.md](./ROADMAP.md) | Capability maturity timeline |
| [../business/PLATFORM_OVERVIEW.md](../business/PLATFORM_OVERVIEW.md) | Stakeholder-facing platform summary |
