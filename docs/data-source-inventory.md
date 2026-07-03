# Data source inventory

**Date:** 2026-07-03  
**Goal:** Remove ambiguity between demo, canonical/pilot, offline, and live Supabase data.

## Taxonomy

| Kind | Badge | Meaning | Typical origin |
|------|-------|---------|----------------|
| **LIVE** | `LIVE` | Operational Supabase tables scoped by RLS | `farmers`, `rice_production_records`, `warehouses`, `operational_submissions`, `inventory_movements`, … |
| **PILOT** | `PILOT` | Ministry pilot tables or CSV canonical fixtures | `pilot_dao_officers`, `pilot_operational_events`, `MINISTRY_*` arrays |
| **OFFLINE** | `OFFLINE` | Device-local IndexedDB / localStorage queues | `agrivault-offline`, `agrivault-dao-workflows`, transfer localStorage |
| **DEMO** | `DEMO` | Illustrative national story for training | `agriculture-pilot-data.ts` |

## Unified layer

| Module | Role |
|--------|------|
| `src/lib/data/data-source.ts` | Types (`DataSourceKind`, `SourcedResult`), helpers, `resolveDisplaySource` merge |
| `src/lib/data/index.ts` | Barrel — single import path `@/lib/data` |
| `src/lib/data/ministry-data-service.ts` | Browser Supabase reads → explicit `SourcedResult` |
| `src/lib/logistics/transfer-repository.ts` | `listTransferOrdersSourced()` — remote + offline + canonical |
| `src/lib/logistics/movement-timeline.ts` | `fetchNationalMovementTimelineSourced()` |
| `src/components/enterprise/DataSourceBadge.tsx` | Shared badge + `DataSourceNotice` banner |

**Rule:** No silent fallback. Every fallback sets `source.detail` explaining the path taken.

## Ministry data service — fallbacks

| Function | Live table | Fallback | `source.kind` |
|----------|------------|----------|---------------|
| `fetchDaoOversightRows` | `pilot_dao_officers` | `MINISTRY_DAO_OFFICERS` | live / pilot |
| `fetchOperationalFeedItems` | `pilot_operational_events` | `MINISTRY_OPERATIONAL_EVENTS` | live / pilot |
| `fetchCountyWarehouseSignals` | `warehouses` | `MINISTRY_WAREHOUSES` | live / pilot |
| `fetchPilotCountyMetricRows` | `pilot_county_metrics` | `MINISTRY_COUNTY_METRICS` | live / pilot |

## Transfer & movement services

| Function | Layers merged | Disclosure |
|----------|---------------|------------|
| `listTransferOrdersSourced` | Supabase `warehouse_transfer_orders` + localStorage + canonical TRF fixtures | `resolveDisplaySource` across contributors |
| `fetchNationalMovementTimelineSourced` | `inventory_movements` → `MINISTRY_INVENTORY_MOVEMENTS` | pilot when empty/unreachable |

## Repositories & hooks

| Module | Returns | Badge consumer |
|--------|---------|----------------|
| `fetchUnifiedVerificationQueue` | `SourcedResult<VerificationGridRow[]>` | Verification queue workspace |
| `useVerificationQueue` | React Query → `VerificationQueueResult` | Verification queue workspace |
| `useTransferOrders` | React Query → `TransferOrdersResult` | Transfers workspace, GIS map room |
| `useNationalAISLive` | `{ dataSource: DataSourceMeta, … }` | Command center, national intel strip |

## Pages with disclosure badges

| Surface | Component | Primary source |
|---------|-----------|----------------|
| Verification queue | `VerificationQueueWorkspace` | Live submissions + pilot VRF fixtures |
| National transfers | `MinistryTransfersWorkspace` | Transfer sourced merge |
| County officer dashboard | `CountyOfficerDashboard` | DAO + warehouse signals |
| Ministry command center | `MinistryCommandCenter` | Live vs demo KPI blend |
| National intel strip | `NationalOperationalIntelStrip` | Mixed live + demo |
| Farmers registry | `FarmersRegistryClient` | Live farmers or demo sample |
| Food security | `FoodSecurityClient` | Demo only |
| Inventory operations | `InventoryOperationsClient` | Demo only |
| Donor dashboard | `DonorDashboardClient` | Pilot canonical |
| Reporting workspace | `ReportingWorkspaceView` | Demo + offline disclaimer |
| County / field / reports pilot | `PilotDatasetNotice` | Demo |
| GIS map room | `GisIntelligenceWorkspace` | Pilot base + verification + transfers |
| Logistics command | `LogisticsCommandCenter` | Transfers + stock + canonical alerts |
| Movement timeline | `LogisticsMovementTimelineSection` | Live movements or pilot fixtures |
| Operational workflow pipeline | `OperationalWorkflowPipeline` | Demo counts + pilot corridor depth |
| CLAN workspace | `ClanWorkspaceClient` | Demo tasks + real IndexedDB pending count |
| Operational activity rail | `OperationalActivityRail` | Feed + blended demo |
| CAC activity timeline | `CaoActivityTimeline` | Feed + synthetic |

## Demo-only surfaces (always DEMO badge)

- `CountyOperationsClient`, `FieldAgentsClient`, `ReportsCenterClient`
- `FoodSecurityClient`, `InventoryOperationsClient`
- Ministry workspace hero KPIs (`workspace/ministry/page.tsx` → demo metrics)

## Offline paths (real)

| Path | Storage | Badge |
|------|---------|-------|
| Field sync queue | `agrivault-offline` IndexedDB | `SyncStatusIndicator` + CLAN workspace OFFLINE when pending > 0 |
| DAO workflow queue | `agrivault-dao-workflows` | DAO drawer queue UI |
| Transfer local queue | `localStorage` | Included in transfer `SourcedResult` as OFFLINE |

## Mixed-source merge rule

`resolveDisplaySource([...])` picks the most disclosure-worthy kind:

`demo` > `pilot` > `offline` > `live`

When multiple kinds contribute, badge label becomes `Mixed · …` with `mixed[]` listing contributors.

## Remaining gaps (low priority)

1. **GenericTablePage routes** — live Supabase grids without badges (acceptable: empty grid ≠ demo fallback).
2. **Executive briefing** — canonical snapshot; badge not yet on page header.
3. **Warehouse detail** — partial live reads with canonical enrichment; subtitle-only disclosure.
4. **Donor export fallback** — demo CSV row when Supabase empty (export action only, not page data).

## Validation

```bash
npm run lint
npm run build
npm run test:workflow   # includes data-source merge checks
```

## Key files

- `src/lib/data/data-source.ts`
- `src/lib/data/ministry-data-service.ts`
- `src/lib/logistics/transfer-repository.ts`
- `src/lib/logistics/movement-timeline.ts`
- `src/components/enterprise/DataSourceBadge.tsx`
- `docs/data-source-inventory.md`
