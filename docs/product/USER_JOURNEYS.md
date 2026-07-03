# AgriVault User Journeys

**Version:** 1.0 · 2026-07-03  
**Related:** [ROLE_CATALOG.md](./ROLE_CATALOG.md) · [ENTITY_CATALOG.md](./ENTITY_CATALOG.md) · [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) · [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) · [../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) · [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)

---

## Table of contents

1. [Overview](#overview)
2. [Journey index](#journey-index)
3. [J1 — Farmer Registration](#j1--farmer-registration)
4. [J2 — GPS Boundary Capture](#j2--gps-boundary-capture)
5. [J3 — Field Inspection](#j3--field-inspection)
6. [J4 — Pest Alert](#j4--pest-alert)
7. [J5 — Subsidy Distribution](#j5--subsidy-distribution)
8. [J6 — Harvest Report](#j6--harvest-report)
9. [J7 — Warehouse Transfer](#j7--warehouse-transfer)
10. [J8 — Executive Briefing](#j8--executive-briefing)
11. [Cross-journey patterns](#cross-journey-patterns)

---

## Overview

User journeys describe **end-to-end operational flows** from field capture through national visibility. Each journey maps actors, steps, workflow status transitions, and UI surfaces (routes).

All journeys that mutate operational state follow the CLAN → DAO → CAC → Ministry chain documented in [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md). Offline capture is supported where noted per [../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md).

---

## Journey index

| ID | Journey | Submission type | Primary actors | Terminal status |
|----|---------|-----------------|----------------|-----------------|
| J1 | Farmer Registration | `farmer_registration` | CLAN → DAO → CAC → Ministry | `ministry_approved` |
| J2 | GPS Boundary | `farm_boundary` | CLAN → DAO → CAC → Ministry | `ministry_approved` |
| J3 | Field Inspection | `field_inspection` | CLAN → DAO → CAC → Ministry | `ministry_approved` |
| J4 | Pest Alert | `pest_disease_alert` | CLAN → DAO → CAC → Ministry | `ministry_approved` |
| J5 | Subsidy Distribution | `input_distribution` | DAO → CAC → Ministry | `ministry_approved` |
| J6 | Harvest Report | `harvest_report` | DAO → CAC → Ministry | `ministry_approved` |
| J7 | Warehouse Transfer | `warehouse_transfer_confirmation` | Warehouse → DAO → Ministry | `ministry_approved` |
| J8 | Executive Briefing | — (read aggregate) | Ministry, CAC | N/A (report output) |

---

## J1 — Farmer Registration

### Purpose

Register a new farmer in the national registry so they become eligible for programmes, subsidies, and verified boundary capture.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| CLAN Technician | `clan_technician`, `field_agent` | Capture farmer demographics and location |
| DAO Officer | `dao_officer`, `district_officer` | Verify identity and district assignment |
| CAC Coordinator | `county_agriculture_coordinator`, `county_officer` | County-level validation |
| Ministry Officer | `ministry_officer`, `ministry_admin` | National sign-off |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | CLAN | Open farmer registration form | `/farmers` | — |
| 2 | CLAN | Enter name, phone, county, district, village | `RegisterFarmerForm` | Draft in form state |
| 3 | CLAN | Submit (online or offline) | `/farmers` | `farmers` row upsert; `client_id` if offline |
| 4 | System | Bridge to workflow | `ensureOperationalSubmission()` | `operational_submissions` type `farmer_registration`, status `submitted` |
| 5 | DAO | Review in verification queue | `/verification-queue` | Assign reviewer → `dao_review` |
| 6 | DAO | Approve or request corrections | `RecordFarmerVerificationDecisionForm` | `dao_approved` or `dao_corrections_requested` |
| 7 | CAC | Review county queue | `/workspace/cac`, `/county-dashboard` | `cac_review` → `cac_approved` |
| 8 | Ministry | Final review | `/command-center`, `/workspace/ministry` | `ministry_approved` |
| 9 | System | Notify author | `workflow_notifications` | In-app notification |

### Status transitions

```
draft → submitted → dao_review → dao_approved → cac_review → cac_approved → ministry_review → ministry_approved
```

Correction loop: `dao_corrections_requested` → (author resubmit) → `submitted`

**Surfaces:** `/farmers`, `/workspace/clan`, `/verification-queue`, `/registration-approvals`

---

## J2 — GPS Boundary Capture

### Purpose

Capture an operational farm boundary polygon for area calculation, programme eligibility, and GIS analytics.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| CLAN Technician | `clan_technician` | Walk perimeter, mark GPS corners |
| DAO Officer | `dao_officer` | Verify boundary plausibility |
| CAC Coordinator | `county_officer` | County GIS validation |
| Ministry Officer | `ministry_officer` | National registry acceptance |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | CLAN | Select registered farmer | `/field/boundary-capture?farmer={id}` | Load farmer context |
| 2 | CLAN | Walk perimeter, tap corners | `BoundaryCaptureStandalone` | Points array in component state |
| 3 | CLAN | Finalize boundary | Same | `plots` row with `polygon_geojson`, `area_hectares` (Turf) |
| 4 | CLAN | Save offline (if no connectivity) | IndexedDB `agrivault-offline` | Queued plot with `client_id` |
| 5 | System | Sync when online | `/field/sync-queue`, topbar sync | `sync-batch` Edge Function upsert |
| 6 | System | Workflow bridge | `ensureOperationalSubmission()` | Type `farm_boundary`, dedupe `farm_boundary:{client_id}` |
| 7 | DAO | Review on map / queue | `/map`, `/verification-queue` | Approve → `dao_approved` |
| 8 | CAC | County review | `/gis-intelligence`, `/county-dashboard` | `cac_approved` |
| 9 | Ministry | National acceptance | `/command-center` | `ministry_approved` |
| 10 | System | Plot visible on heat map | `/national-heat-map` | Aggregate GIS layer |

### Status transitions

```
submitted → dao_review → dao_approved → cac_review → cac_approved → ministry_review → ministry_approved
```

Escalation path: any review stage → `escalated` → Ministry direct approval.

**Surfaces:** `/field/boundary-capture`, `/field/sync-queue`, `/geo-registry`, `/map`, `/gis-intelligence`

Offline: [../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) · GIS: [../GIS_ARCHITECTURE.md](../GIS_ARCHITECTURE.md)

---

## J3 — Field Inspection

### Purpose

Document a structured field visit verifying farmer circumstances, plot condition, and programme compliance.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| CLAN Technician | `clan_technician` | Conduct visit, capture notes and GPS |
| DAO Officer | `dao_officer` | Validate inspection findings |
| CAC Coordinator | `county_officer` | County aggregation |
| Ministry Officer | `ministry_officer` | National record |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | CLAN | Open inspections | `/field/inspections` | Load assigned farmers |
| 2 | CLAN | Complete inspection form | `RecordFieldInspectionForm` | `farmer_visits` row |
| 3 | CLAN | Submit for review | Form submit | `field_inspection` submission |
| 4 | DAO | Triage queue | `/verification-queue` | `dao_review` |
| 5 | DAO | Approve / correct / reject | Queue action panel | State transition |
| 6 | CAC | County review | `/workspace/cac` | `cac_approved` |
| 7 | Ministry | Archive-ready approval | `/workspace/ministry` | `ministry_approved` |

### Status transitions

```
submitted → dao_review → dao_approved → cac_review → cac_approved → ministry_review → ministry_approved
```

**Surfaces:** `/field/inspections`, `/field/mobile`, `/workspace/dao`, `/workspace/cac`

---

## J4 — Pest Alert

### Purpose

Report pest or disease outbreak for rapid district and county response coordination.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| CLAN Technician | `clan_technician` | Observe and report symptoms, location |
| DAO Officer | `dao_officer` | Triage severity, coordinate response |
| CAC Coordinator | `county_officer` | County-wide alert escalation |
| Ministry Officer | `ministry_officer` | National food security visibility |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | CLAN | Open pest reports | `/field/pest-reports` | — |
| 2 | CLAN | Submit alert with crop, symptoms, GPS | `DaoPestDiseaseReportForm` | `pest_disease_alert` submission |
| 3 | System | High-priority notification | `workflow_notifications` | DAO assignee notified |
| 4 | DAO | Review and approve | `/verification-queue`, `/alerts` | `dao_approved` |
| 5 | CAC | County escalation if needed | `/county-dashboard`, `/alerts` | `cac_approved` or `escalated` |
| 6 | Ministry | National alert visibility | `/command-center`, `/food-security` | `ministry_approved` |
| 7 | System | Heat map overlay | `/national-heat-map` | Alert layer (where LIVE data available) |

### Status transitions

```
submitted → dao_review → dao_approved → cac_review → cac_approved → ministry_approved
                    └→ escalated → ministry_approved (fast path for severe outbreaks)
```

**Surfaces:** `/field/pest-reports`, `/alerts`, `/food-security`, `/national-heat-map`

---

## J5 — Subsidy Distribution

### Purpose

Record distribution of agricultural inputs (seed, fertilizer) from warehouse to verified farmer, linking inventory to registry.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| DAO Officer | `dao_officer` | Authorize and log distribution |
| Warehouse Manager | `warehouse_manager` | Confirm stock deduction |
| CAC Coordinator | `county_officer` | County programme oversight |
| Ministry Officer | `ministry_officer` | National subsidy reporting |
| Farmer | (indirect) | Receives inputs |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | DAO | Open subsidy distribution | `/subsidies/distribution` | Load farmer + warehouse |
| 2 | DAO | Select farmer, item, quantity | `DaoSubsidyDistributionForm` | Form validation |
| 3 | DAO | Submit distribution | Form submit | `distribution_logs` insert |
| 4 | System | Workflow bridge | `ensureOperationalSubmission()` | Type `input_distribution` |
| 5 | Warehouse | Confirm stock levels | `/inventory` | `warehouse_stock` adjustment |
| 6 | DAO | Self-review or peer assign | `/verification-queue` | `dao_approved` |
| 7 | CAC | County validation | `/subsidies/verification` | `cac_approved` |
| 8 | Ministry | National reporting | `/subsidies/analytics` | `ministry_approved` |

### Status transitions

```
submitted → dao_approved → cac_review → cac_approved → ministry_review → ministry_approved
```

**Surfaces:** `/subsidies/distribution`, `/subsidies/vouchers`, `/inventory/seed-distribution`, `/subsidies/analytics`

---

## J6 — Harvest Report

### Purpose

Capture seasonal rice production data for food security planning and loss analysis.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| DAO Officer | `dao_officer` | Record or validate harvest data |
| CLAN Technician | `clan_technician` | Field yield estimate (optional co-capture) |
| CAC Coordinator | `county_officer` | County production totals |
| Ministry Officer | `ministry_officer` | National food security indicators |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | DAO | Open production form | `/production/rice`, `/rice/production` | Load farmer/plot |
| 2 | DAO | Enter season, yields, losses | `DaoProductionEstimateForm` | `rice_production_records` row |
| 3 | System | Workflow bridge | `ensureOperationalSubmission()` | Type `harvest_report` |
| 4 | DAO | Submit for review | `/verification-queue` | `submitted` |
| 5 | CAC | County validation | `/production/county` | `cac_approved` |
| 6 | Ministry | National aggregation | `/food-security`, `/rice/reports` | `ministry_approved` |
| 7 | System | Loss hotspot analysis | `/production/loss-hotspots` | Analytics (LIVE/PILOT) |

### Status transitions

```
submitted → dao_review → dao_approved → cac_review → cac_approved → ministry_review → ministry_approved
```

**Surfaces:** `/rice/production`, `/production/county`, `/production/loss-hotspots`, `/food-security`

---

## J7 — Warehouse Transfer

### Purpose

Move inventory between warehouses with dispatch, in-transit tracking, and receipt confirmation.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| Warehouse Manager | `warehouse_manager` | Initiate and confirm transfers |
| DAO Officer | `dao_officer` | District logistics oversight |
| Ministry Officer | `ministry_officer` | National stock visibility |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | Warehouse | Create transfer request | `/inventory/transfers`, `/transfers` | `warehouse_transfer_orders` status `requested` |
| 2 | DAO/Ministry | Approve transfer | `/operations/warehouses` | Status `approved` |
| 3 | Warehouse | Dispatch stock | `RecordStockTransferForm` | Status `dispatched` / `in_transit` |
| 4 | System | Workflow bridge | `ensureOperationalSubmission()` | Type `warehouse_transfer_confirmation` |
| 5 | Receiving warehouse | Confirm receipt | `/logistics` | Status `delivered` |
| 6 | DAO | Review confirmation | `/verification-queue` | `dao_approved` |
| 7 | Ministry | National visibility | `/national-operations` | `ministry_approved` |

### Status transitions

**Transfer order pipeline:**
```
requested → approved → dispatched → in_transit → delivered
```

**Workflow submission:**
```
submitted → dao_review → dao_approved → ministry_review → ministry_approved
```

**Surfaces:** `/transfers`, `/logistics`, `/inventory/warehouse/{code}`, `/operations`

Known limitation: [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) TD-005

---

## J8 — Executive Briefing

### Purpose

Generate a cabinet-ready PDF summarizing national operational KPIs for Ministry leadership.

### Actors

| Actor | Role(s) | Responsibility |
|-------|---------|----------------|
| Ministry Officer | `ministry_officer`, `ministry_admin` | Request and present briefing |
| CAC Coordinator | `county_agriculture_coordinator` | County-level briefing variant |
| Ministry Leadership | (consumer) | Decision-making from report |

### Steps

| Step | Actor | Action | Surface | System effect |
|------|-------|--------|---------|---------------|
| 1 | Ministry | Open executive briefing | `/executive-briefing` | Load KPI data service |
| 2 | System | Aggregate LIVE/PILOT metrics | `ministry-data-service.ts` | Farmers, boundaries, distributions, queue depth |
| 3 | Ministry | Review data source badges | `DataSourceBadge` components | Provenance disclosure per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) |
| 4 | Ministry | Generate PDF | `/reports/pdf` or briefing CTA | `POST /api/reports/executive-briefing` |
| 5 | System | Server-side PDF render | `@react-pdf/renderer` | PDF download (authenticated session required) |
| 6 | Leadership | Review offline | PDF file | Decision input |

No workflow submission — **read aggregate** journey.

**Surfaces:** `/executive-briefing`, `/reports/ministry`, `/reports/pdf`, `/command-center`

---

## Cross-journey patterns

| Pattern | Journeys | Implementation |
|---------|----------|----------------|
| Offline capture | J1, J2, J6 | IndexedDB → `sync-batch` → `client_id` upsert ([../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md)) |
| Workflow dedupe | J1–J7 | `metadata.dedupe_key` on `operational_submissions` |
| Review queue | J1–J7 | `/verification-queue` → `POST /api/ops/workflows/submission` |
| Notifications | J1–J7 | `workflow_notifications` + topbar `NotificationsMenu` |
| Provenance | All | `DataSourceBadge` per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 6 |

Architecture: [../ARCHITECTURE.md#data-flow](../ARCHITECTURE.md#data-flow) · Entities: [ENTITY_CATALOG.md](./ENTITY_CATALOG.md)
