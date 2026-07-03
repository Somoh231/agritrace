# ADR 0002: Workflow Engine

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

Liberia's agricultural pilot requires auditable approval of field submissions from CLAN technicians through District Agriculture Officers (DAO), County Agriculture Coordinators (CAC), and Ministry national staff. Submissions must survive connectivity gaps, support correction loops, and produce an immutable action log for compliance review.

Ad-hoc status columns on domain tables (e.g. `farmers.approval_status`) would fragment logic across forms and make cross-type queues impossible. The platform needs a single finite-state machine (FSM) governing all operational submission types with server-side validation before any PostgreSQL write.

---

## Decision

Implement a **declarative FSM workflow engine** backed by the `operational_submissions` table and validated exclusively on the server.

### Approval chain

```
CLAN (author) → DAO (district) → CAC (county) → Ministry (national)
```

### Thirteen statuses

| Status | Stage |
|--------|-------|
| `draft` | Author working copy |
| `submitted` | Awaiting DAO |
| `dao_review`, `dao_corrections_requested`, `dao_approved` | DAO stage |
| `cac_review`, `cac_corrections_requested`, `cac_approved` | CAC stage |
| `ministry_review`, `ministry_approved` | Ministry stage |
| `rejected`, `escalated`, `archived` | Terminal / exception |

Terminal statuses: `ministry_approved`, `rejected`, `archived`.

### Core modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Status model | `src/lib/workflow/status-model.ts` | Pure FSM: `computeSubmissionTransition()` |
| Roles | `src/lib/workflow/roles.ts` | DB role → workflow stage mapping |
| Server API | `src/app/api/ops/workflows/submission/route.ts` | Mutation handler |
| Permissions | `src/lib/ops/server-permissions.ts` | `requireWorkflowPrincipal()`, county scope |
| Migration | `supabase/migrations/20260619120000_workflow_engine.sql` | Tables, enum, RLS |

### Server validation flow

Every mutation calls `computeSubmissionTransition()` and `checkWorkflowPermission()` before updating `operational_submissions` and inserting into `workflow_actions` and `workflow_notifications`. Client-side status changes are never trusted.

### Database tables

- `operational_submissions` — canonical submission row with `workflow_status`, county, metadata
- `workflow_actions` — append-only transition audit log
- `workflow_comments` — threaded reviewer notes
- `workflow_notifications` — in-app alerts per role/stage

---

## Consequences

### Positive

- Single source of truth for approval state across farmer registration, inspections, boundaries, transfers, and alerts.
- Pure FSM in `status-model.ts` is unit-tested (`npm run test:workflow` — 29 checks).
- County-scoped RLS on workflow tables aligns with DAO/CAC jurisdiction.
- Correction loops (`*_corrections_requested → submitted`) preserve audit trail without data loss.

### Negative

- Every new submission type requires FSM permission mapping and bridge wiring (see ADR 0009).
- Two-step persist (domain table + submission row) adds latency and failure modes.
- Escalation path adds complexity for edge cases requiring Ministry override.

### Neutral

- Demo seed fixtures (`cao-approval-seed.ts`) coexist with live submissions in queue UIs.
- Notifications are in-app only; no SMS/email dispatch in RC1.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Per-table status columns** | No unified queue; inconsistent transition rules; poor audit trail |
| **External workflow SaaS (Temporal, Camunda)** | Operational overhead; offline field sync incompatible; overkill for pilot scale |
| **Client-side FSM only** | Bypassable via direct API calls; fails security review |
| **Event sourcing without FSM** | Harder to enforce valid transitions; reviewers need explicit states |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Monolithic FSM vs per-type machines | Single FSM with type metadata | Unified queues and permissions |
| Sync vs async notifications | Sync insert on transition | Simpler; acceptable at pilot volume |
| 13 statuses vs simplified 5 | 13 statuses | Matches DAO/CAC correction and escalation requirements |
| Server-only validation vs optimistic UI | Server-only writes | Government audit requirements |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — workflow mutation path, module map
- [WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) — transition table, API reference, sequence diagrams
- [DATABASE.md](../DATABASE.md) — workflow tables, RLS policies
- [API_GUIDE.md](../API_GUIDE.md) — `/api/ops/workflows/submission`
- [SECURITY.md](../SECURITY.md) — `requireWorkflowPrincipal()`
- ADR [0009](./0009-operational-submission-bridge.md) — domain form bridge
- ADR [0010](./0010-verification-architecture.md) — verification queue integration
