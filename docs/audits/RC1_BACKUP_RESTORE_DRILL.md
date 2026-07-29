# RC1 Backup and Restore Drill

Last updated: 2026-07-29

## Result

**BLOCKED — NO APPROVED DISPOSABLE RESTORE TARGET**

No restore was attempted against the linked `MOA Farm Traceability` project. The
Supabase CLI account can see other projects, but none is identified or approved
as an AgriVault disposable restore destination. Treating an unrelated project as
disposable would be unsafe. No database dump, schema change, user change, seed,
or destructive operation was performed.

## Drill definition

| Item | Planned evidence |
| --- | --- |
| Target environment | A dedicated non-production Supabase project owned by the AgriVault programme |
| Backup method | Supabase platform backup/PITR export where enabled, plus an encrypted logical backup for a release-tagged recovery point |
| Recovery point | Immediately before the controlled-pilot release candidate is approved; record UTC timestamp, source project, migration head, and application commit |
| Synthetic data set | `QA-RC1-` farmers, farms, plots, operational submissions, actions, comments, assignments, notifications, transfer orders, and audit events spanning at least two counties |
| Restore destination | A named, empty, disposable AgriVault restore project approved by the database owner |
| Expected recovery time | Measure from operator approval to validation completion; proposed pilot objective is RTO ≤ 4 hours, subject to owner approval |
| Rollback criteria | Any migration mismatch, missing relationship, RLS scope failure, duplicated workflow record, failed checksum, or unexpected access by a least-privileged role |
| Operator approval | Required from the database owner and release manager before backup export, restore, DNS/environment changes, or cleanup |

## Pre-drill controls

1. Confirm the source is the linked AgriVault staging project, not production.
2. Record application commit, local and remote migration heads, database region,
   backup timestamp, and the operator approving the drill.
3. Confirm the destination is empty, disposable, isolated from production
   credentials, and has no production application traffic.
4. Create only synthetic rows prefixed `QA-RC1-`; record their stable IDs and
   relationship counts.
5. Store backup material in an approved encrypted location with access logging.
6. Keep service-role credentials out of command output, screenshots, Git, and
   Playwright artifacts.

## Validation queries

Run the following classes of read-only checks on the restored destination. Use
parameterized SQL in the approved operator session and attach redacted results.

```sql
select version from supabase_migrations.schema_migrations order by version;

select count(*) from operational_submissions
where title like 'QA-RC1-%';

select count(*) from workflow_actions
where submission_id in (
  select id from operational_submissions where title like 'QA-RC1-%'
);

select count(*) from workflow_comments
where submission_id in (
  select id from operational_submissions where title like 'QA-RC1-%'
);

select status, count(*)
from operational_submissions
where title like 'QA-RC1-%'
group by status
order by status;
```

Before execution, adapt the identifying columns to the deployed schema and save
the exact approved query set with the evidence package. Validate foreign keys and
orphan counts for submissions/actions/comments/assignments/notifications and
warehouse transfer relationships. Compare source and restore counts and checksums
for every synthetic entity group.

## RLS validation

Use normal authenticated accounts, never the service role, to prove:

- CLAN and DAO accounts cannot read unrelated district/county synthetic rows.
- CAC access is restricted to its intended county scope.
- Ministry access has the intended national scope.
- auditor and donor roles are read-only.
- inactive and missing-profile users fail closed.
- non-admin users cannot access admin APIs.
- unauthorized workflow transitions and export requests return denial responses.

Capture role, route/table, expected scope, observed row count/status, UTC time,
and request ID. A successful owner connection or service-role query is not RLS
evidence.

## Workflow relationship validation

For each `QA-RC1-` submission, verify the restored current status matches the
ordered action ledger, comments and assignments retain their parent, notification
references resolve, dedupe identifiers remain unique, and no transfer or workflow
record appears more than once. Re-run the non-mutating workflow state-model tests
against the restored migration head.

## Evidence checklist

- [ ] Database owner approved a named disposable AgriVault destination.
- [ ] Source project and recovery point recorded.
- [ ] Backup/PITR capability and retention recorded from the provider control plane.
- [ ] Encrypted backup created and checksum recorded.
- [ ] Restore completed without touching the active project.
- [ ] Local and restored migration heads match.
- [ ] Synthetic entity counts and checksums match.
- [ ] Relationship/orphan checks pass.
- [ ] Normal-user RLS matrix passes.
- [ ] Workflow and dedupe validation passes.
- [ ] Measured RTO is recorded and accepted.
- [ ] Rollback/cleanup decision and operator approvals are attached.

## Current evidence

- Linked migration inspection is read-only and shows 11 remote migrations through
  `20260619120000`; the repository has one intentionally pending RLS migration
  that has not been applied.
- The linked schema exposes the required workflow tables sampled through the
  anonymous REST schema surface.
- `analytics_events` is absent (`PGRST205`), is optional observability, and is
  unrelated to the blocked restore operation.
- No approved disposable AgriVault restore project is configured, so the evidence
  checklist remains intentionally incomplete.

## Controlled-pilot prerequisite reconfirmation

The Supabase account can list several projects, but none is configured or
approved as an AgriVault disposable restore target. No restore project reference,
database URL, or operator approval was supplied. Unrelated projects were not
repurposed. The result remains:

**BLOCKED — NO APPROVED DISPOSABLE RESTORE TARGET**
