# ADR 0010: Verification Queue Architecture

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

DAO, CAC, and Ministry staff review farmer registrations, inspections, GPS evidence, and subsidy verifications through approval queues. During the pilot, not every county has live submissions in Supabase. Training walkthroughs require fixture rows that demonstrate queue UX without seeding production data. Live and fixture rows must merge without duplicate IDs, and approval actions on real submissions must route through the audited workflow API.

CAC approval queues (`CaoApprovalQueues`) and the national verification workspace share this merge pattern. A critical bug class is applying workflow mutations to fixture rows that lack real `operational_submissions` UUIDs.

---

## Decision

Implement a **verification queue architecture** that merges live `operational_submissions` with canonical fixtures, exposes unified rows via `SourcedResult`, and gates workflow mutations on valid submission UUIDs.

### Repository layer

**File:** `src/features/verification/repositories/verification-repository.ts`

```typescript
fetchUnifiedVerificationQueue(): Promise<SourcedResult<VerificationGridRow[]>>
```

Flow:

1. Load canonical fixtures via `buildUnifiedVerificationQueue()` (`src/lib/ops/ministry-verification-queue-data.ts`)
2. Fetch live submissions via `fetchOperationalSubmissions()` (workflow client)
3. If live fetch fails → return fixtures only with `pilotSource("Live submissions unavailable → ...")`
4. Merge via `mergeVerificationQueueWithSubmissions(fixtures, live.submissions)`
5. Resolve display source: live + pilot when both contribute; pilot-only when no live rows have `submissionId`

### Queue merge module

**File:** `src/lib/workflow/operational-submission-queue.ts`

| Function | Role |
|----------|------|
| `mergeVerificationQueueWithSubmissions()` | Join fixtures with live submissions by type/county |
| `submissionsToCaoApprovalItems()` | Map workflow rows to CAC approval item shape |

Live rows carry `_detail.submissionId` linking to `operational_submissions.id`.

### CAC approval queues

**File:** `src/components/cao/CaoApprovalQueues.tsx`

- Initial state: `seedCaoApprovalItems(county)` fixtures filtered by county
- On mount: fetch live submissions; prepend `submissionsToCaoApprovalItems()` when available
- Tabbed queues: farmer_registration, farm_inspection, subsidy_verification, pest_escalation, district_summary, warehouse_replenishment

### UUID gate for mutations

Approval decisions call `postWorkflowAction()` **only** when:

```typescript
row.submissionId && UUID_RE.test(row.submissionId)
```

UUID regex enforces RFC 4122 variant (version nibble `[1-8]`, variant `[89ab]`).

| Row type | Mutation behavior |
|----------|-------------------|
| Live submission (valid UUID) | `postWorkflowAction({ action, submissionId, note })` — audited |
| Fixture seed (no UUID) | Optimistic UI patch only — demo/training state |
| Server rejection | Revert optimistic patch; display error |

This prevents workflow API errors from fixture IDs and makes training vs production behavior explicit.

### Verification workspace UI

**File:** `src/components/operations/VerificationQueueWorkspace.tsx`

- Consumes `useVerificationQueue()` React Query hook
- Renders `DataSourceBadge` from `SourcedResult.source`
- Grid rows show live vs fixture provenance in detail column

### Data source disclosure

Per ADR 0007:

- Live available: `resolveDisplaySource([liveSource(...), pilotSource(...)])`
- Live unavailable: `pilotSource("Canonical verification fixtures — ...")`
- Never silent fallback — `source.detail` explains merge path

---

## Consequences

### Positive

- Training walkthroughs work without live data in every county.
- Live submissions appear at top of merged queues when available.
- UUID gate prevents corrupt workflow mutations on fixture rows.
- `SourcedResult` wrapper ensures badge disclosure on verification surfaces.
- County-scoped fixture seeds align with CAC jurisdiction filtering.

### Negative

- Merged queues can confuse users if badge is missed — fixture rows look like live pending items.
- Optimistic UI on fixture rows simulates approval without persistence — state lost on refresh.
- Merge logic must update when new submission types added.
- Two queue implementations (verification grid + CaoApprovalQueues) share merge module but differ in UI.

### Neutral

- Fixture data maintained in seed modules (`cao-approval-seed.ts`, ministry verification data).
- React Query caches verification results with standard stale-time.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Live-only queues (no fixtures)** | Blocks training; empty queues in new pilot counties |
| **Fixtures only until go-live flag** | Binary switch hides merge complexity; risks go-live surprise |
| **Apply workflow API to all rows** | Fixture IDs cause 404/validation errors |
| **Separate training route** | Duplicates queue UI; users won't find it |
| **Server-side merge endpoint** | Adds API surface; client merge sufficient for RC1 volume |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Merge vs toggle | Always merge with disclosure | Single UX; badge explains composition |
| Prepend live vs append | Live prepended | Real work items prioritized |
| UUID gate vs server ignore | Client UUID gate | Prevents unnecessary API calls and error noise |
| Optimistic fixture UI vs disabled actions | Optimistic for training | Demonstrates approval UX in walkthroughs |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — module map, data flow
- [WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) — verification queue integration section
- [data-source-inventory.md](../data-source-inventory.md) — verification queue disclosure
- [SECURITY.md](../SECURITY.md) — workflow API authorization
- ADR [0002](./0002-workflow-engine.md) — workflow statuses and actions
- ADR [0007](./0007-data-source-strategy.md) — SourcedResult and badges
- ADR [0009](./0009-operational-submission-bridge.md) — submission creation
- Source: `src/features/verification/`, `src/components/cao/CaoApprovalQueues.tsx`, `src/lib/workflow/operational-submission-queue.ts`
