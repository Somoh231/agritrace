# ADR 0003: Offline-First Field Capture

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

CLAN field technicians operate in rural Liberian counties with intermittent cellular connectivity. Farmer registration, plot boundary capture, and rice production records must be captured reliably on-device without blocking on network round-trips. Data loss during connectivity drops is unacceptable for a government traceability programme.

The sync layer must be idempotent (retries must not create duplicate farmers or plots), auditable (synced records enter the workflow engine), and bounded (persistent failures must surface for manual review rather than infinite retry loops).

---

## Decision

Implement **offline-first capture** using IndexedDB on the client and a Supabase Edge Function for batch upsert.

### IndexedDB store

| Property | Value |
|----------|-------|
| Database name | `agrivault-offline` |
| Schema file | `src/lib/offline/db.ts` |
| Version | `1` |
| Key path | `client_id` (UUID v4) |

### Object stores

| Store | Domain entity |
|-------|---------------|
| `pending_farmers` | Farmer registration |
| `pending_plots` | Plot / boundary data |
| `pending_production_records` | Rice production records |

Each record: `{ client_id, data, created_at, sync_attempts, synced }`.

### Enqueue API

```typescript
queueFarmer(data)           // src/lib/offline/sync-queue.ts
queuePlot(data)
queueProductionRecord(data)
```

Writes to IndexedDB **before** any network attempt. Returns `client_id` for downstream workflow deduplication.

### Sync pipeline

```
processSyncQueue()
  → supabase.functions.invoke("sync-batch")
  → service-role upsert on conflict (client_id)
  → ensureOperationalSubmission() for farm_boundary plots
  → mark record synced: true
```

Edge Function: `supabase/functions/sync-batch/`.

### Retry policy

| Rule | Implementation |
|------|----------------|
| Increment on failure | `sync_attempts++` per failed invoke |
| Auto-sync cap | **5 attempts** — record flagged `manual_review`, excluded from auto-sync |
| Idempotency | PostgreSQL upsert on `client_id` unique index |
| Post-sync audit | `ensureOperationalSubmission()` triggers workflow submission for boundaries |

### Secondary offline store

DAO district forms use a separate database `agrivault-dao-workflows` for draft workflow forms — independent from field capture queue (see [OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md)).

---

## Consequences

### Positive

- Field capture succeeds immediately on device; technicians see confirmation without waiting for Supabase.
- `client_id` upsert prevents duplicate rows on flaky networks.
- 5-attempt cap prevents silent infinite retry and surfaces failures in sync indicator UI.
- Boundary sync automatically enters CLAN→DAO approval chain via submission bridge.

### Negative

- Two IndexedDB databases increase client complexity and test surface.
- Edge Function requires service-role key — must never be exposed to browser (server/Edge only).
- Manual review queue for failed syncs needs operational procedure (documented in pilot guides).
- No conflict resolution UI if server row diverges from queued payload.

### Neutral

- PWA service worker caches app shell separately (see ADR 0006); IndexedDB holds operational data.
- Sync indicator in `DashboardShell` reflects pending queue depth.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **localStorage JSON blobs** | Size limits; no indexing; poor concurrent write semantics |
| **Direct Supabase insert with offline queue in memory** | Data lost on tab close / crash |
| **Service Worker Background Sync only** | Inconsistent browser support; harder to debug; no retry counter visibility |
| **CRDT / conflict-free replicated data types** | Over-engineered for pilot; no multi-device edit requirement |
| **Unlimited retry with exponential backoff** | Silent failures accumulate; no manual review trigger |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| IndexedDB vs SQLite (Capacitor) | IndexedDB | Zero native wrapper; works in PWA |
| Batch Edge Function vs per-record API | Batch `sync-batch` | Fewer round-trips on reconnect |
| 5 retry cap vs infinite | 5 cap + manual_review | Surfaces persistent failures to ops staff |
| Separate DAO workflow DB | Two stores | Different lifecycle — drafts vs field capture |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — offline sync path diagram
- [OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) — schema, sequence diagrams, procedures
- [WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) — post-sync submission bridge
- [DATABASE.md](../DATABASE.md) — `client_id` unique indexes
- ADR [0006](./0006-pwa-strategy.md) — service worker shell caching
- ADR [0009](./0009-operational-submission-bridge.md) — `ensureOperationalSubmission()`
- Source: `src/lib/offline/db.ts`, `src/lib/offline/sync-queue.ts`, `supabase/functions/sync-batch/`
