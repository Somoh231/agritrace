# AgriVault Feature Catalog

**Version:** 1.0 · 2026-07-03  
**Related:** [ROLE_CATALOG.md](./ROLE_CATALOG.md) · [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) · [USER_JOURNEYS.md](./USER_JOURNEYS.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)

---

## Table of contents

1. [Overview](#overview)
2. [Module index](#module-index)
3. [Field module](#field-module)
4. [District module](#district-module)
5. [County module](#county-module)
6. [Ministry module](#ministry-module)
7. [GIS module](#gis-module)
8. [Inventory module](#inventory-module)
9. [Reporting module](#reporting-module)
10. [Admin module](#admin-module)
11. [Offline module](#offline-module)
12. [Workflow module](#workflow-module)
13. [Cross-module features](#cross-module-features)

---

## Overview

This catalog inventories **shipping features** in AgriVault RC1 (0.1.0-rc1), organized by operational module. Each feature lists its route, primary actors, data source, and workflow integration where applicable.

Route access is enforced by `assertPilotRouteAccess()` — see [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md).

---

## Module index

| Module | Primary roles | Hub route | Workflow integrated |
|--------|---------------|-----------|---------------------|
| Field | CLAN | `/workspace/clan` | ✅ Capture |
| District | DAO | `/workspace/dao` | ✅ Review L1 |
| County | CAC | `/workspace/cac` | ✅ Review L2 |
| Ministry | Ministry national | `/workspace/ministry` | ✅ Review L3 |
| GIS | DAO, CAC, Ministry | `/map` | ✅ Boundary submissions |
| Inventory | Warehouse, DAO, Ministry | `/inventory` | ✅ Transfer confirmation |
| Reporting | DAO, CAC, Ministry | `/reporting` | 👁 Reads workflow state |
| Admin | Ministry admin | `/admin` | Configuration only |
| Offline | CLAN | `/field/sync-queue` | ✅ Post-sync bridge |
| Workflow | DAO, CAC, Ministry | `/verification-queue` | ✅ Core engine |

---

## Field module

**Audience:** CLAN Technicians (`clan_technician`, `field_agent`)  
**Principles:** Offline-first ([PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 2)

| Feature | Route | Description | Workflow type | Offline |
|---------|-------|-------------|---------------|---------|
| CLAN workspace | `/workspace/clan` | Quick actions: boundary, registration, sync | — | ✅ |
| Mobile field report | `/field/mobile` | Daily structured activity log | `field_report` | ✅ |
| Field home | `/field` | Register farmer, create lot, log movement | Various | ✅ |
| Farmer registration | `/farmers` | National registry CRUD | `farmer_registration` | ✅ |
| GPS boundary capture | `/field/boundary-capture` | Walk-perimeter polygon capture | `farm_boundary` | ✅ |
| Field inspections | `/field/inspections` | Inspection queue and forms | `field_inspection` | ✅ |
| Pest reports | `/field/pest-reports` | Pest/disease alert submission | `pest_disease_alert` | 🔶 |
| Extension reports | `/field/extension-reports` | Extension service documentation | `field_report` | 🔶 |
| Offline sync queue | `/field/sync-queue` | Pending upload status and retry | — | ✅ |
| Farm profiles | `/farm-profiles` | Farmer detail read | — | 👁 |

| Component | Path |
|-----------|------|
| `BoundaryCaptureStandalone` | `src/components/field/BoundaryCaptureStandalone.tsx` |
| `ClanWorkspaceClient` | `src/components/workspace/ClanWorkspaceClient.tsx` |
| `FarmersRegistryClient` | `src/components/pilot/FarmersRegistryClient.tsx` |

Guide: [../CLAN_FIELD_GUIDE.md](../CLAN_FIELD_GUIDE.md)

---

## District module

**Audience:** DAO Officers (`dao_officer`, `district_officer`)  
**Principles:** First review gate in CLAN → DAO → CAC → Ministry chain

| Feature | Route | Description | Workflow stage |
|---------|-------|-------------|----------------|
| District dashboard | `/district-dashboard` | District KPIs, queue depth, agent activity | `dao` |
| DAO workspace | `/workspace/dao` | Verification, GPS evidence, subsidy forms | `dao` |
| Verification queue | `/verification-queue` | Assign, approve, reject, correct submissions | `dao` |
| Registration approvals | `/registration-approvals` | Farmer registration decision queue | `dao` |
| Field agents monitoring | `/field-agents` | CLAN technician activity oversight | — |
| Subsidy distribution | `/subsidies/distribution` | Log input distribution to farmers | `input_distribution` |
| Subsidy vouchers | `/subsidies/vouchers` | Voucher tracking | — |
| Production estimates | `/production/rice` | Harvest data entry | `harvest_report` |
| Pest triage | `/alerts` | District alert response | `pest_disease_alert` |
| Reporting drafts | `/reporting/workspace?tab=drafts` | Author submission status | — |

| Component | Path |
|-----------|------|
| `DaoWorkspaceClient` | `src/components/workspace/DaoWorkspaceClient.tsx` |
| `DistrictOfficerDashboard` | `src/components/ais/DistrictOfficerDashboard.tsx` |
| `VerificationQueueWorkspace` | `src/components/operations/VerificationQueueWorkspace.tsx` |
| `dao-workflow-writers` | `src/lib/dao/dao-workflow-writers.ts` |

Guide: [../DAO_GUIDE.md](../DAO_GUIDE.md)

---

## County module

**Audience:** CAC Coordinators (`county_agriculture_coordinator`, `county_officer`)

| Feature | Route | Description | Workflow stage |
|---------|-------|-------------|----------------|
| County dashboard | `/county-dashboard` | County KPIs, district performance | `cac` |
| CAC workspace | `/workspace/cac` | Approval queues, county operations | `cac` |
| CAC approval queues | `/workspace/cac` (embedded) | County-level submission review | `cac` |
| County operations | `/county-operations` | Cross-district coordination | `cac` |
| Executive briefing | `/executive-briefing` | County-variant leadership PDF | — |
| Subsidy verification | `/subsidies/verification` | County subsidy audit | `cac` |
| Production county view | `/production/county` | County yield aggregation | — |
| County officer dashboard | `/county-dashboard` | `CountyOfficerDashboard` widgets | — |

| Component | Path |
|-----------|------|
| `CacWorkspaceClient` | `src/components/workspace/CacWorkspaceClient.tsx` |
| `CaoApprovalQueues` | `src/components/cao/CaoApprovalQueues.tsx` |
| `CountyOfficerDashboard` | `src/components/ais/CountyOfficerDashboard.tsx` |

Guide: [../CAC_GUIDE.md](../CAC_GUIDE.md)

---

## Ministry module

**Audience:** Ministry national roles (`ministry_admin`, `ministry_officer`, `government_officer`, `super_admin`)

| Feature | Route | Description | Workflow stage |
|---------|-------|-------------|----------------|
| Command center | `/command-center` | National operations desk, KPI strip | `ministry` |
| Ministry workspace | `/workspace/ministry` | National hub links and queues | `ministry` |
| National operations | `/national-operations` | Operational intelligence feed | `ministry` |
| National heat map | `/national-heat-map` | Geographic operational overlay | — |
| Executive briefing | `/executive-briefing` | Cabinet-ready PDF generation | — |
| Food security | `/food-security` | National food security indicators | — |
| Ministry transfers | `/operations` | Inter-county transfer oversight | `ministry` |
| Rice programmes | `/rice/programmes` | National rice programme management | — |
| Cocoa chain | `/cocoa` | Commodity export module | — |
| Activity center | `/activity` | National activity search | — |

| Component | Path |
|-----------|------|
| `MinistryCommandCenter` | `src/components/ais/MinistryCommandCenter.tsx` |
| `MinistryWorkspaceClient` | `src/components/workspace/MinistryWorkspaceClient.tsx` |
| `NationalOperationalIntelStrip` | `src/components/operations/NationalOperationalIntelStrip.tsx` |

Guide: [../MINISTRY_GUIDE.md](../MINISTRY_GUIDE.md)

---

## GIS module

**Audience:** DAO, CAC, Ministry (tiered)  
**Architecture:** [../GIS_ARCHITECTURE.md](../GIS_ARCHITECTURE.md)

| Feature | Route | Tier | Description |
|---------|-------|------|-------------|
| Operational map | `/map` | Pilot GIS | Mapbox operational workspace |
| Geo registry | `/geo-registry` | Pilot GIS | Named geo point registry |
| GIS intelligence | `/gis-intelligence` | Advanced | County/ministry analytics workspace |
| National heat map | `/national-heat-map` | Heat map | County choropleth and hotspots |
| Boundary capture | `/field/boundary-capture` | Field capture | CLAN GPS walk (see Field module) |
| County heatmap widget | Embedded in dashboards | Component | `CountyHeatmap` |

| Tier | Roles | `canAccess*` function |
|------|-------|----------------------|
| Field capture | CLAN | Direct route (not gated by primary GIS) |
| Pilot GIS | CLAN, DAO, CAC, Ministry | `canAccessPilotPrimaryGis()` |
| Advanced GIS | CAC, Ministry | `canAccessAdvancedGisIntelligence()` |

| Component | Path |
|-----------|------|
| `MapOperationalWorkspace` | `src/components/maps/MapOperationalWorkspace.tsx` |
| `GisIntelligenceWorkspace` | `src/components/gis/GisIntelligenceWorkspace.tsx` |
| `NationalHeatMapWorkspace` | `src/components/maps/NationalHeatMapWorkspace.tsx` |

---

## Inventory module

**Audience:** Warehouse manager, DAO, CAC, Ministry, cooperative, exporter

| Feature | Route | Description | Workflow type |
|---------|-------|-------------|---------------|
| Inventory hub | `/inventory` | Stock levels overview | — |
| Warehouse detail | `/inventory/warehouse/{code}` | Per-warehouse stock | — |
| Transfers | `/inventory/transfers`, `/transfers` | Transfer order management | `warehouse_transfer_confirmation` |
| Logistics command | `/logistics` | Movement timeline | — |
| Seed distribution | `/inventory/seed-distribution` | Seed programme tracking | — |
| Fertilizer stock | `/inventory/fertilizer` | Fertilizer inventory | — |
| Donor shipments | `/inventory/donor-shipments` | Donor manifest receipt | `donor_shipment_verification` |
| Expiry tracking | `/inventory/expiry` | Near-expiry alerts | — |
| Equipment | `/inventory/equipment` | Equipment registry | — |
| Operations warehouses | `/operations/warehouses` | Ministry warehouse oversight | — |

| Component | Path |
|-----------|------|
| `InventoryOperationsClient` | `src/components/pilot/InventoryOperationsClient.tsx` |
| `LogisticsCommandCenter` | `src/components/logistics/LogisticsCommandCenter.tsx` |
| `RecordStockTransferForm` | `src/components/operations/forms/RecordStockTransferForm.tsx` |
| `transfers-repository` | `src/features/transfers/repositories/transfers-repository.ts` |

---

## Reporting module

**Audience:** DAO, CAC, Ministry (donor/auditor excluded from hub)

| Feature | Route | Description | Output |
|---------|-------|-------------|--------|
| Reporting hub | `/reporting` | Module entry and navigation | — |
| Reporting workspace | `/reporting/workspace` | Drafts, submitted, approved tabs | — |
| Ministry reports | `/reports/ministry` | National report templates | PDF/CSV |
| Executive briefing | `/executive-briefing` | Leadership summary | PDF |
| PDF export | `/reports/pdf` | Generic PDF generation | PDF |
| Export reports | `/reports/export` | Data export interface | CSV |
| Donor reports | `/reports/donor` | Donor-scoped aggregates | PDF |
| Rice reports | `/rice/reports` | Rice programme reporting | PDF |
| Compliance reports | `/compliance/reports` | Compliance summary | PDF |
| Production seasonal | `/production/seasonal` | Seasonal trend charts | — |
| Loss hotspots | `/production/loss-hotspots` | Post-harvest loss analysis | — |
| Subsidy analytics | `/subsidies/analytics` | Distribution analytics | — |

| Component | Path |
|-----------|------|
| `ReportingWorkspaceView` | `src/components/reporting/ReportingWorkspaceView.tsx` |
| API | `POST /api/reports/executive-briefing` |

All reporting surfaces display `DataSourceBadge` per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 6.

---

## Admin module

**Audience:** `isAdminConsoleRole()` — super_admin, admin, ministry_admin, ministry_officer, government_officer

| Feature | Route | Description |
|---------|-------|-------------|
| Admin home | `/admin` | Console dashboard |
| User management | `/admin/users` | Provision and deactivate users |
| Organizations | `/admin/organizations` | Org registry |
| System settings | `/admin/settings` | Application configuration |
| Capabilities | `/admin/capabilities` | Feature flag reference |
| Governance | `/admin/governance` | Policy and ADR links |
| Launch readiness | `/admin/launch-readiness` | Pilot checklist status |
| Demo inquiries | `/admin/demo-inquiries` | Public demo form responses |
| Content blocks | `/admin/content` | CMS content management |
| Analytics | `/admin/analytics` | Platform usage events |
| Import | `/admin/import` | Bulk data import |
| API docs | `/admin/api-docs` | Internal API reference |
| Integrations | `/admin/integrations` | Third-party integration status |

| Component | Path |
|-----------|------|
| `AdminPageShell` | `src/components/admin/AdminPageShell.tsx` |
| `UsersAdminClient` | `src/components/admin/UsersAdminClient.tsx` |

Guide: [../PILOT_ADMIN_GUIDE.md](../PILOT_ADMIN_GUIDE.md)

---

## Offline module

**Audience:** CLAN field roles  
**Architecture:** [../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md)

| Feature | Route / surface | Description |
|---------|-----------------|-------------|
| PWA install | `/login` → Install for Offline Use | Add to home screen |
| IndexedDB queue | `agrivault-offline` store | Farmers, plots, production records |
| Sync batch | `sync-batch` Edge Function | Idempotent server upsert |
| Sync status indicator | Topbar component | Pending count badge |
| Sync queue page | `/field/sync-queue` | Manual retry and status |
| Service worker | `public/sw.js` | Asset caching |
| Post-sync workflow | `submission-bridge.ts` | `ensureOperationalSubmission()` after plot sync |
| Manual review flag | After 5 retries | Surfaces in admin for operator action |

| Entity | Offline write | Sync endpoint |
|--------|---------------|---------------|
| Farmer | ✅ | `sync-batch` farmers |
| Plot | ✅ | `sync-batch` plots |
| Rice production | ✅ | `sync-batch` production |
| Workflow submission | Online only | Created after sync completes |

---

## Workflow module

**Audience:** DAO, CAC, Ministry (review); CLAN (submit)  
**Engine:** [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md)

| Feature | Route / API | Description |
|---------|-------------|-------------|
| Verification queue | `/verification-queue` | Primary review UI |
| Workflow review panel | Embedded component | Thread history, actions |
| Submission API | `POST /api/ops/workflows/submission` | Server-side FSM mutations |
| Submission bridge | `ensureOperationalSubmission()` | Domain form → workflow row |
| Operational queues | `operational-submission-queue.ts` | Grid row adapters |
| Notifications | `workflow_notifications` + `NotificationsMenu` | In-app reviewer alerts |
| Status pipeline UI | `StatusPipeline`, `VerificationStatusPipeline` | Visual FSM state |
| Workflow tests | `npm run test:workflow` | 29 FSM unit tests |

### Submission types (11)

| Type constant | DB value |
|---------------|----------|
| `farmerRegistration` | `farmer_registration` |
| `farmBoundary` | `farm_boundary` |
| `fieldInspection` | `field_inspection` |
| `gpsVerification` | `gps_verification` |
| `pestDiseaseAlert` | `pest_disease_alert` |
| `warehouseAssignment` | `warehouse_assignment` |
| `inputDistribution` | `input_distribution` |
| `harvestReport` | `harvest_report` |
| `warehouseTransfer` | `warehouse_transfer_confirmation` |
| `donorShipment` | `donor_shipment_verification` |
| `fieldReport` | `field_report` |

### Workflow actions (8)

`submit` · `approve` · `reject` · `request_corrections` · `escalate` · `assign_reviewer` · `comment` · `archive`

---

## Cross-module features

| Feature | Route | Module overlap | Notes |
|---------|-------|----------------|-------|
| Cooperatives | `/cooperatives` | Field, Registry | `cooperative_manager` primary |
| Compliance | `/compliance` | All | Audit, anomalies, procurement |
| Donor dashboard | `/donor-dashboard` | External | Read-only donor visibility |
| Audit tools | `/audit-tools` | External | `auditor` role landing |
| AI assistant | Disabled RC1 | — | Planned Phase 4 (TD-016) |
| Role switcher | Topbar | All | UI preview only — no server effect |
| Data source badges | All dashboards | All | LIVE/PILOT/OFFLINE/DEMO |
| Call center | `/verification-queue` | District | `call_center_agent` landing |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | End-to-end flows across modules |
| [ENTITY_CATALOG.md](./ENTITY_CATALOG.md) | Data entities behind features |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | System structure and module map |
| [../DEMO_SCRIPT.md](../DEMO_SCRIPT.md) | Demo walkthrough of key features |
