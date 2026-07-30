# Workforce Database Privilege Matrix

Date: 2026-07-29

RLS is the row/scope boundary. Table privileges are the command boundary.
`service_role` remains a trusted server-only bypass and is never exposed to the
browser.

| Object group | `anon` | `authenticated` | `service_role` | Row/scope authority |
| --- | --- | --- | --- | --- |
| `profiles` | none | `SELECT` only | existing owner/server access | Existing profile read RLS; no direct profile mutation |
| `workforce_role_catalog` | none | `SELECT` | all | Active workforce predicate |
| `profile_role_assignments` | none | `SELECT` | all | Own current grant, workforce admin, or active auditor |
| `workforce_identity_transitions` | none | `SELECT` | all | Own completed/current identity, workforce admin, or active auditor |
| Operational tables | none unless separately documented public content | existing command grants required by the app | all/owner | Existing scope policies AND restrictive active-workforce policy |
| `public_content_blocks` | policy-defined public read | policy-defined read | all/owner | Explicitly excluded from workforce operational guard |
| Assignment replacement RPC | none | no execute | execute | Function re-verifies actor, target, roles, version, and prerequisites |
| Active-role selector RPC | none | execute | execute | Caller-bound current explicit assignment only |
| Caller-bound access helpers | none | execute | execute | Boolean/current-scope result only |
| Subject-parameter access helpers | none | none | none explicit | Function-owner internal calls only |
| Auth signup trigger function | none | none | none explicit | Trigger execution only |

## Operational command grants

The migration does not widen existing operational table grants. Existing
authenticated commands are retained only so the current user-scoped app can
continue to use its established RLS policies. The new restrictive policy is
ANDed with every known operational policy for all commands.

Before production promotion, catalog verification must show:

- no `anon` command privilege on operational tables;
- no authenticated write privilege on identity authority tables;
- no authenticated update privilege on `profiles`;
- no authenticated execute privilege on the assignment replacement RPC;
- no `PUBLIC` execute privilege on any workforce `SECURITY DEFINER` function;
- all operational tables have RLS enabled and the restrictive identity policy;
- no operational policy for `authenticated` contains unconditional
  `USING (true)`.

This matrix documents the intended end state. The exact verification queries
are maintained in
`docs/audits/WORKFORCE_MIGRATION_APPROVAL_REVIEW_V2.md`.

