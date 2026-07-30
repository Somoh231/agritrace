# Workforce Bootstrap and Legacy Transition Plan

Status: approval required  
Date: 2026-07-29  
Target project ref observed read-only: `tkblfaqaaoyadjnyhyiz`  
Target project name observed locally: `MOA Farm Traceability`

## Gate

The linked project is **not classified as approved staging** by repository
configuration. It contains operational-shaped records and four active
demo-like profiles. Do not apply the migration until the environment owner
explicitly confirms that this project ref is the approved staging target.

No email address, email domain, display name, metadata role, or apparent demo
label is acceptable role provenance.

## Required approval manifest

Migration `20260729230000_workforce_identity_provisioning.sql` reads a JSON
array from PostgreSQL setting `app.workforce_bootstrap_manifest`. It aborts
before persistent DDL unless every active legacy profile appears exactly once
and the approved role exactly matches `profiles.role`.

Each entry has this shape:

```json
{
  "profile_id": "00000000-0000-0000-0000-000000000000",
  "role": "field_agent",
  "decision": "verified",
  "evidence_ref": "approval-record-reference",
  "reviewed_by": "named-operator-or-change-record",
  "transition_expires_at": null
}
```

Allowed decisions:

- `verified`: the role and prerequisites were approved; no deadline is allowed.
- `temporary_admin`: only for a pre-existing `super_admin`, `admin`, or
  `ministry_admin`; a future deadline no more than seven days after migration
  is mandatory.

The current aggregate preflight found no legacy administrator profile, so
there is no technical basis for a temporary administrator entry at this time.

## Approval procedure

1. Environment owner confirms the exact project ref and its staging status.
2. Identity owner reviews the four existing active profiles out of band.
3. Identity owner confirms whether each account is individual, controlled, and
   still required.
4. Role owner approves the exact current role or directs remediation before
   migration.
5. Organization/geography owner confirms the existing organization and county.
6. Operator records a durable approval reference for each entry.
7. A second operator verifies that manifest UUIDs and roles match a read-only
   query immediately before application.
8. The manifest is supplied only for the migration session and is not committed
   with personal data.

The current fifth Auth identity has no profile. It must not be added to the
legacy manifest. It remains denied after migration and must be independently
resolved through the approved provisioning or account-removal process.

## Temporary administrator behavior

A temporary legacy administrator is not operationally active. The exception
can reach only the administrator identity-remediation predicate. It cannot
satisfy the restrictive operational RLS policy, switch to an unassigned role,
or survive its assignment expiry.

Before its deadline:

1. a permanent, individually controlled `super_admin` must be approved;
2. required organization and scope must be populated;
3. assignments must be replaced through the protected RPC;
4. the transition ledger must record completion;
5. the temporary assignment must be ended;
6. a read-only verification must show zero overdue transition rows.

## Failure behavior

The migration is explicitly transactional. Missing approvals, role mismatch,
missing Auth identities, missing prerequisites, non-canonical geography,
invalid temporary-admin deadlines, or partial prior application raises an
exception before `COMMIT`.

Do not bypass a failure by editing a profile, weakening the guard, or changing
the manifest to a different role without a new approval. Correct the source
state or obtain a documented decision, rerun the read-only preflight, and then
perform a fresh reviewed application.

