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

Repository migrations and RLS policies were inspected, but no remote migration list, row count, backup, restore, or RLS behavior was changed or certified. Pilot release requires database-owner evidence.

