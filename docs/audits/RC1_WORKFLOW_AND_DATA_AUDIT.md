# RC1 Workflow and Data Audit

## Workflow map

Operational submissions follow `draft → submitted → DAO review/decision → CAC review/decision → Ministry decision → archive`, with correction, rejection, escalation, comment, and assignment paths. Transfer orders use approval, dispatch, receipt, verification, escalation, investigation, and dispute transitions.

## Data truthfulness findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| WF-01 | P1 | Canonical verification items allowed optimistic actions against a non-persisting endpoint | Resolved; illustrative items are read-only and endpoint returns 409 |
| WF-02 | P1 | CAC seed rows could appear approved/replenished only in client state | Resolved; only rows with a live submission UUID are actionable |
| WF-03 | P1 | Canonical/offline transfer examples could simulate a success with `persisted:false` | Resolved; UI disables them and API requires a live Supabase UUID |
| WF-04 | P1 | Submission state could update without a corresponding action ledger | Reduced; ledger failures revert state and return an error |
| WF-05 | P1 | Concurrent reviewers could overwrite a stale status | Resolved; status-qualified compare-and-swap returns 409 |
| WF-06 | P2 | Multi-table writes are not atomic | Open; replace compensation with transactional RPC |
| WF-07 | P2 | Comments, assignments, notifications, events, and generic audit logs are partly best-effort | Open; define mandatory vs non-blocking records |
| WF-08 | P2 | Empty live queues can make rich pilot workspaces appear operationally empty | Open; use explicit “no live records” plus training-mode examples |

## Data-source review

Command-center content labels live/mixed/demo/pilot sources. The ministry summary API now reports explicit source and source detail instead of silently replacing live failures. Canonical datasets remain useful for training and layout stability but may not be mutated or represented as live.

## Test evidence

- 29 workflow checks pass, including legal/illegal transitions, role stages, county scope, read-only donor/auditor behavior, dedupe keys, source taxonomy, and rate limits.
- 11 security checks pass, including redirects, CSV safety, report-export RBAC, and role-aware navigation.
- No real submission, approval, transfer, import, or database mutation was executed during QA.

## Database caveat

Repository migrations, linked remote migration history, table presence, and RLS
policy text were inspected read-only. No backup, restore, normal-user RLS matrix,
or synthetic workflow replay was executed. Pilot release still requires
database-owner evidence for those runtime controls.

## Linked staging inspection — 2026-07-29

- `supabase migration list --linked` reports 11 local and 11 remote migrations
  with exact version parity through `20260619120000_workflow_engine.sql`.
- Anonymous schema-presence probes confirm `operational_submissions`,
  `workflow_actions`, `workflow_comments`, `workflow_assignments`,
  `workflow_notifications`, `warehouse_transfer_orders`, and `profiles`.
- `analytics_events` is absent and returns `PGRST205`.
- Local Supabase containers are not running; `supabase status` therefore does not
  constitute a local database test.
- Static workflow RLS uses county-scope helpers and national Ministry/admin
  access, but broader field/geo/transfer read policies require live normal-user
  validation.
- No designated CLAN/DAO/CAC/Ministry/auditor users and no approved
  `QA-RC1-` staging mutation context were available. Geography isolation,
  inactive/missing-profile fail-closed behavior, read-only roles, replay/dedupe,
  and workflow mutation rejection remain **not proved in the linked runtime**.

The 29 workflow and 11 security model checks pass, but unit policy behavior is
not a substitute for deployed PostgreSQL RLS evidence.
