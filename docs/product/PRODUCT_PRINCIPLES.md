# AgriVault Product Principles

**Status:** Constitution — binding on all product and engineering decisions  
**Version:** 1.0 · 2026-07-03  
**Authority:** Chief Product Officer / Programme Steering Committee

---

## Purpose

These principles define what AgriVault is and what it refuses to become. When a feature request, technical shortcut, or operational workaround conflicts with a principle, the principle prevails unless the Steering Committee explicitly records an exception in an ADR.

Engineering implementation: [../product/PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) cross-references [../adr/README.md](../adr/README.md).

---

## Table of contents

1. [Principle 1 — Every action is auditable](#principle-1--every-action-is-auditable)
2. [Principle 2 — Offline-first](#principle-2--offline-first)
3. [Principle 3 — Human approval overrides AI](#principle-3--human-approval-overrides-ai)
4. [Principle 4 — Government terminology](#principle-4--government-terminology)
5. [Principle 5 — Data integrity over feature velocity](#principle-5--data-integrity-over-feature-velocity)
6. [Principle 6 — Every record has provenance](#principle-6--every-record-has-provenance)
7. [Principle 7 — Security by default](#principle-7--security-by-default)
8. [Principle 8 — One source of truth](#principle-8--one-source-of-truth)
9. [Principle 9 — No silent data loss](#principle-9--no-silent-data-loss)
10. [Principle 10 — Explainability before automation](#principle-10--explainability-before-automation)
11. [Principle compliance matrix](#principle-compliance-matrix)

---

## Principle 1 — Every action is auditable

**Statement:** Every state-changing operation on operational data produces an immutable audit record traceable to an authenticated user, timestamp, and context.

**Implementation:**
- Workflow transitions append to `workflow_actions` ([../DATABASE.md](../DATABASE.md))
- Domain mutations write to `audit_log`
- API responses include `x-request-id` for log correlation ([../SECURITY.md](../SECURITY.md))

**Prohibited:** Bulk updates without audit trail; anonymous workflow mutations; client-side-only approval state.

---

## Principle 2 — Offline-first

**Statement:** Field capture must function without continuous connectivity. Connectivity is an enhancement, not a prerequisite.

**Implementation:**
- IndexedDB queues (`agrivault-offline`) for farmers, plots, production records
- PWA installable shell with service worker ([../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md))
- Batch sync via `sync-batch` Edge Function with idempotent `client_id` upsert

**Prohibited:** Requiring live connection for mandatory field forms; discarding unsynced local data on session expiry without user confirmation.

---

## Principle 3 — Human approval overrides AI

**Statement:** No AI system may approve, reject, or escalate operational submissions. AI may assist with summarisation and query — never with authority.

**Implementation:**
- Workflow FSM requires human principal via `requireWorkflowPrincipal()` ([../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md))
- AI assistant disabled for pilot ([../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md))
- Executive briefing PDF requires authenticated Ministry/CAC session

**Prohibited:** Auto-approval rules; ML-based rejection; AI-generated audit entries presented as human decisions.

---

## Principle 4 — Government terminology

**Statement:** The platform uses Ministry operational language — CLAN, DAO, CAC, Ministry, county, district — not startup or generic SaaS terminology.

**Canonical terms:**

| Use | Do not use |
|-----|------------|
| CLAN Technician | Field user, agent |
| DAO Officer | Reviewer, approver L1 |
| CAC Coordinator | County manager |
| Operational submission | Ticket, case |
| Verification queue | Inbox |
| Command center | Dashboard (in user-facing copy) |

Role catalog: [ROLE_CATALOG.md](./ROLE_CATALOG.md)

---

## Principle 5 — Data integrity over feature velocity

**Statement:** Correctness, consistency, and traceability take precedence over shipping features quickly.

**Implementation:**
- Server-validated FSM transitions before any status write
- Dedupe keys prevent duplicate workflow records ([../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md))
- `npm run test:workflow` gate on every release ([../operations/RELEASE_PROCESS.md](../operations/RELEASE_PROCESS.md))

**Prohibited:** Client-only workflow state; skipping RLS for convenience; merging data sources without disclosure.

---

## Principle 6 — Every record has provenance

**Statement:** Users must know whether data is LIVE (Supabase), PILOT (fixtures), OFFLINE (device queue), or DEMO (training).

**Implementation:**
- `DataSourceBadge` on all merged surfaces ([../data-source-inventory.md](../data-source-inventory.md))
- `SourcedResult<T>` with mandatory `source.detail` on fallback paths

**Prohibited:** Presenting DEMO or PILOT data as LIVE in reports to leadership without explicit disclosure.

---

## Principle 7 — Security by default

**Statement:** Access is denied unless explicitly granted by role and scope. Defense in depth across middleware, application logic, and RLS.

**Implementation:**
- Four-layer authorization ([../SECURITY.md](../SECURITY.md))
- County-bound reviewers cannot act outside their county
- Service role key server-only

**Prohibited:** Public PDF export of operational data; shared accounts; role switcher affecting server permissions.

---

## Principle 8 — One source of truth

**Statement:** Each operational entity has one authoritative store. Views may merge sources for display but must disclose composition.

**Known exception (RC1):** Transfer counts may derive from `warehouse_transfer_orders` or `inventory_movements` — documented in [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md), scheduled for unification in [../TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md).

---

## Principle 9 — No silent data loss

**Statement:** Failed syncs, rejected submissions, and offline queue items must surface visible errors — never fail silently.

**Implementation:**
- 5-retry cap → `manual_review` flag ([../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md))
- Sync status indicator in topbar
- Structured API error logging without exposing internals to clients

**Prohibited:** Swallowing sync errors; auto-deleting failed queue items without operator action.

---

## Principle 10 — Explainability before automation

**Statement:** Automate only what operators can explain to an auditor. Every automated transition must be reconstructable from `workflow_actions`.

**Implementation:**
- Declarative transition table in `status-model.ts` — 29 unit tests
- Workflow thread UI shows full action history

**Prohibited:** Black-box status changes; background jobs that mutate workflow state without logged actions.

---

## Principle compliance matrix

| Principle | Primary ADR | Primary doc |
|-----------|-------------|-------------|
| Auditable | ADR-0002 | [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) |
| Offline-first | ADR-0003, ADR-0006 | [../OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) |
| Human approval | ADR-0002 | [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) |
| Provenance | ADR-0007 | [../data-source-inventory.md](../data-source-inventory.md) |
| Security | ADR-0008 | [../SECURITY.md](../SECURITY.md) |
| Submission bridge | ADR-0009 | [../workflow-completeness-audit.md](../workflow-completeness-audit.md) |
| Verification | ADR-0010 | [../workflow-completeness-audit.md](../workflow-completeness-audit.md) |

---

## Exception process

1. Document conflict with specific principle(s)
2. Propose mitigation
3. Record decision in new ADR under [../adr/](../adr/)
4. Steering Committee approval required for Principles 1, 3, 6, 7

---

## Related documents

[VISION.md](./VISION.md) · [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) · [../business/PROJECT_GOVERNANCE.md](../business/PROJECT_GOVERNANCE.md)
