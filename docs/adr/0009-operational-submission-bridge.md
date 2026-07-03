# ADR 0009: Operational Submission Bridge

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

Domain forms (farmer registration, field inspection, GPS evidence, pest alerts, harvest estimates, input distribution, farm boundaries, warehouse transfers) persist data to entity-specific Supabase tables. The workflow engine (ADR 0002) operates on a unified `operational_submissions` table. Without a bridge, reviewers would see domain records but no approval queue entries, and offline sync would not trigger the CLAN→DAO→CAC→Ministry chain.

Duplicate submissions from retries (offline sync, form resubmit) must be prevented without blocking legitimate correction resubmissions. Each domain form has different entity reference keys for deduplication.

---

## Decision

Implement an **operational submission bridge** that creates or deduplicates `operational_submissions` rows after domain persist via `ensureOperationalSubmission()`, using stable `dedupe_key` values in submission metadata.

### Bridge module

**File:** `src/lib/workflow/submission-bridge.ts`

| Function | Role |
|----------|------|
| `ensureOperationalSubmission(ctx)` | Primary bridge — POST workflow `submit` action with `create` payload |
| `ensureFarmBoundarySubmission()` | Secondary boundary submission when GIS included |
| `buildWorkflowDedupeKey(ctx)` | Stable idempotency key from entity refs |

Bridge is **best-effort**: never throws; returns `null` on skip or failure (logged via `console.warn`).

### WorkflowPersistContext

```typescript
type WorkflowPersistContext = {
  kind: DaoWorkflowKind | "farm_boundary_capture" | "warehouse_transfer" | ...;
  payload: Record<string, unknown>;
  entityRefs?: Record<string, string>;
};
```

### Submission type mapping

**File:** `src/lib/workflow/submission-types.ts`

| Domain kind | Submission type constant |
|-------------|-------------------------|
| `register_farmer` | `farmerRegistration` |
| `farm_inspection` | `fieldInspection` |
| `gps_field_evidence` | `gpsVerification` |
| `pest_disease_report` | `pestDiseaseAlert` |
| `production_estimate` | `harvestReport` |
| `subsidy_delivery_verify` | `inputDistribution` |
| `farm_boundary_capture` | `farmBoundary` |
| `warehouse_transfer` | `warehouseTransfer` |

### Dedupe key strategy

Stored in `operational_submissions.metadata.dedupe_key`:

| Kind | Key pattern |
|------|-------------|
| Farmer registration | `farmerRegistration:{farmer_id}` |
| Field inspection | `fieldInspection:{visit_id}` or farmer + timestamp |
| GPS evidence | `gpsVerification:{geo_location_id}` or farmer + lat/lng |
| Farm boundary | `farmBoundary:plot:{plot_client_id}` |
| Warehouse transfer | `warehouseTransfer:{movement_id}` |

Server-side deduplication in `/api/ops/workflows/submission` checks existing `metadata->>'dedupe_key'` before insert.

### Domain form wiring

Pattern: (1) persist to domain table, (2) `ensureOperationalSubmission({ kind, payload, entityRefs })`, (3) optional `ensureFarmBoundarySubmission()` for GIS. Wired in `src/components/operations/`, `BoundaryCaptureStandalone`, `RecordStockTransferForm`, and `dao-workflow-writers.ts`.

### Metadata snapshot

`sanitizeSnapshot()` strips heavy geometry (`boundary_geometry`, `boundary_points`) from workflow metadata, retaining area/hectare summaries only.

### API integration

Bridge calls `postWorkflowAction({ action: "submit", create: { ... } })` which hits `POST /api/ops/workflows/submission` with server FSM validation.

---

## Consequences

### Positive

- Every domain persist automatically enters the approval pipeline.
- Dedupe keys prevent duplicate queue rows from offline retries and double-submit.
- Best-effort design ensures domain persist succeeds even if workflow API is temporarily unavailable.
- Secondary boundary submission decouples GIS approval from registration/inspection.
- Entity refs in metadata enable queue UIs to link back to domain records.

### Negative

- Two-step persist adds latency and partial-failure states (domain saved, submission missing).
- Best-effort failures are silent to users unless logging monitored.
- Each new form kind requires dedupe key logic in `buildWorkflowDedupeKey()`.
- Metadata snapshot may omit fields reviewers need (geometry stripped).

### Neutral

- Bridge uses client-side `postWorkflowAction` — session JWT scopes the create request.
- Offline sync calls bridge after Edge Function upsert for plot boundaries.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Database trigger on domain INSERT** | Opaque; hard to set title/summary; no dedupe control |
| **Workflow submission as only store** | Domain tables needed for RLS-scoped entity queries and GIS |
| **Client writes directly to operational_submissions** | Bypasses FSM validation and permission checks |
| **UUID-only dedupe (no semantic key)** | Retries create new UUIDs; duplicates on offline sync |
| **Synchronous server-side bridge in API routes** | Domain forms use browser Supabase client; would require refactor |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Best-effort vs transactional | Best-effort | Field capture must not fail on workflow outage |
| Client vs server bridge call | Client postWorkflowAction | Matches existing form architecture |
| Rich vs stripped metadata | Stripped geometry | Keeps workflow row size bounded |
| Single vs dual submission for GIS | Dual (boundary separate) | Boundary can enter queue independently |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — workflow mutation path, extension points
- [WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) — submission bridge, deduplication, domain wiring
- [OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) — post-sync bridge call
- [API_GUIDE.md](../API_GUIDE.md) — workflow submission endpoint
- ADR [0002](./0002-workflow-engine.md) — FSM and operational_submissions
- ADR [0003](./0003-offline-first.md) — sync-batch → bridge
- ADR [0010](./0010-verification-architecture.md) — queue merge from submissions
- Source: `src/lib/workflow/submission-bridge.ts`, `src/lib/workflow/submission-types.ts`
