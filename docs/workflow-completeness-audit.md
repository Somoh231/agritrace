# Workflow completeness audit

**Date:** 2026-07-02  
**Scope:** Operational lifecycle from field capture through food-security analytics  
**Schema changes:** None (uses existing `operational_submissions` + `metadata.dedupe_key`)

## Executive summary

Every major DAO operational form now creates (or idempotently reuses) an `operational_submissions` row via the audited workflow API after domain persistence. Approvals on live rows update `workflow_actions`, audit logs, and directed `workflow_notifications`. Fixture/demo queues are merged with live submissions so reviewers are not blocked on dead-end paths.

## Lifecycle chain

| Stage | Form / entry point | Domain table | Submission type | Workflow bridge |
|-------|-------------------|--------------|-----------------|-----------------|
| Farmer registration | `RegisterFarmerForm` | `farmers` | `farmer_registration` | `dao-workflow-writers` → `ensureOperationalSubmission` |
| Farm boundary capture | `RegisterFarmerForm` (GIS), `RecordFieldInspectionForm`, `BoundaryCaptureStandalone`, offline `sync-queue` | `plots` / `farmer_visits` | `farm_boundary` | Secondary `ensureFarmBoundarySubmission` |
| Field inspection | `RecordFieldInspectionForm` | `farmer_visits` | `field_inspection` | After visit insert |
| DAO review | `RecordFarmerVerificationDecisionForm`, `WorkflowReviewPanel`, verification queue | `farmers` / workflow | — | `approve` / `reject` on linked submission |
| CAC review | `CaoApprovalQueues` | workflow | — | Live rows carry `submissionId`; decisions call workflow API |
| Ministry approval | `WorkflowReviewPanel`, verification queue (live rows) | workflow | — | Stage-gated FSM transitions |
| Warehouse assignment | Implicit via `DaoSubsidyDistributionForm` (`warehouse_id`) | `distribution_logs` | `input_distribution` | Metadata `entity_refs.warehouse_id` |
| Input distribution | `DaoSubsidyDistributionForm` | `distribution_logs` | `input_distribution` | Dedupe per distribution log |
| Harvest reporting | `DaoProductionEstimateForm` | `rice_production_records` | `harvest_report` | Dedupe per production record |
| Food security analytics | `FoodSecurityClient` + `harvest_report` metadata | `rice_production_records` | — | Production records remain analytics source; submissions link audit trail |

## Forms audited

| Form | Creates submission? | Notes |
|------|----------------------|-------|
| `RegisterFarmerForm` | Yes | Also persists plot when boundary captured |
| `RecordFieldInspectionForm` | Yes (+ boundary if GIS present) | |
| `DaoGpsEvidenceForm` | Yes | `gps_verification` |
| `DaoPestDiseaseReportForm` | Yes | `pest_disease_alert` |
| `DaoProductionEstimateForm` | Yes | `harvest_report` |
| `DaoSubsidyDistributionForm` | Yes | `input_distribution` |
| `BoundaryCaptureStandalone` | Yes | Queued plot + boundary submission |
| `RecordStockTransferForm` | Yes | `warehouse_transfer_confirmation` |
| `RecordFarmerVerificationDecisionForm` | Updates | Advances linked `farmer_registration` submission |
| `RecordWarehouseForm` | No | Master data only (warehouse registry) |
| `RecordCooperativeForm` | No | Registry master data |
| `RecordInventoryReceiptForm` | No* | Inventory ledger; transfers covered separately |
| `RecordDonorShipmentForm` | No* | Donor manifest; verification fixtures remain for demo |
| `RecordFieldReportForm` | Via MoA survey kinds | `field_report` through survey writers |
| MoA survey templates (CLAN/DAO/CAC) | Yes | `persistMoaOperationalSurvey` |

\*Future hook: donor receipt → `donor_shipment_verification` when receipt ID returned from insert.

## Audit trail & history

- **Domain audit:** `dao_audit` / `audit_log` on each persist (unchanged).
- **Workflow audit:** `workflow_actions` append-only ledger on every transition.
- **Server audit:** `persistWorkflowAuditLog` on create and decisions.
- **Timelines:** `WorkflowReviewPanel` loads full thread via `fetchWorkflowThread`; live verification rows include `submissionId` for the same history.
- **Notifications:** `workflow_notifications` written on assign / corrections / approve / reject / escalate; `NotificationsMenu` now reads them.

## Deduplication

`metadata.dedupe_key` is set by `buildWorkflowDedupeKey` (e.g. `farmer_registration:{uuid}`).  
`POST /api/ops/workflows/submission` returns the existing non-archived row when the key matches — no duplicate workflow records.

## Remaining risks (pilot)

1. **Verification fixtures** — Demo `VRF-*` rows remain for training; live submissions appear first in the merged queue.
2. **Offline boundary** — Submission is created at queue time (standalone) and again after sync (dedupe by `plot_client_id` prevents duplicates).
3. **Food security UI** — Still blends demo KPIs; underlying `rice_production_records` + `harvest_report` submissions provide auditable harvest lineage.
4. **Donor / inventory receipt forms** — Not yet bridged; low pilot priority.

## Verification commands

```bash
npm run lint
npm run build
npm run test:workflow
```

## Key files

- `src/lib/workflow/submission-bridge.ts` — Client bridge after domain persist
- `src/lib/workflow/submission-types.ts` — Canonical submission type constants
- `src/lib/workflow/operational-submission-queue.ts` — Live ↔ verification/CAC merge
- `src/lib/dao/dao-workflow-writers.ts` — DAO form writers + bridge hooks
- `src/app/api/ops/workflows/submission/route.ts` — Deduping workflow writer
