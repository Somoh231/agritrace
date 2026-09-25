# Authenticated role QA — runbook

Status (2026-09-25): **not run.** No QA credentials are available to this
workspace, and none may be invented or shared. 64 role tests skip without
them (32 per browser project).

## Rules

- Use individually provisioned QA operators on a **non-production** stack.
  Never real users, never shared credentials, never production data.
- Credentials come only from environment variables in the shell running the
  tests. Do not commit them or paste them into issues or chat.
- Workflow-mutation tests also need `QA_ALLOW_SYNTHETIC_MUTATIONS=true` and
  refuse to run against production (`requireSafeSyntheticTarget`).
- Do not relax an assertion to make a role pass; a failure is a finding.

## Environment variables

Suite A — `tests/e2e/rc1-preview.spec.ts` (route smoke per role; auth state
prepared in `tests/e2e/global-setup.ts`):

| Role | Variables |
| --- | --- |
| CLAN | `QA_CLAN_EMAIL`, `QA_CLAN_PASSWORD` |
| DAO | `QA_DAO_EMAIL`, `QA_DAO_PASSWORD` |
| CAC | `QA_CAC_EMAIL`, `QA_CAC_PASSWORD` |
| Ministry | `QA_MINISTRY_EMAIL`, `QA_MINISTRY_PASSWORD` |
| Admin | `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD` |
| Auditor | `QA_AUDITOR_EMAIL`, `QA_AUDITOR_PASSWORD` |
| Donor | `QA_DONOR_EMAIL`, `QA_DONOR_PASSWORD` |
| Exporter | `QA_EXPORTER_EMAIL`, `QA_EXPORTER_PASSWORD` |

Suite B — `tests/e2e/opus55-agentic-qa.spec.ts` (role matrix, denials,
exports, lifecycle, workflow chain, offline, GIS): one shared
`QA_PASSWORD` for the disposable stack plus `QA55_<KEY>_EMAIL` for
`CLAN_BONG`, `DAO_BONG`, `DAO_NIMBA`, `CAC_BONG`, `MINISTRY`, `ADMIN`,
`WAREHOUSE`, `AUDITOR`, `DONOR`, `INACTIVE`, `NOROLE`. Optional:
`QA_EVIDENCE_DIR` for screenshots and page-text digests.

## Commands

```bash
# Against a protected Vercel preview, add the bypass header only if the owner
# has authorised an automation bypass secret: VERCEL_AUTOMATION_BYPASS_SECRET=...
PREVIEW_BASE_URL=https://<preview-host> npx playwright test tests/e2e/rc1-preview.spec.ts tests/e2e/opus55-agentic-qa.spec.ts
# Workflow-mutation tests (non-production stack only):
QA_ALLOW_SYNTHETIC_MUTATIONS=true PREVIEW_BASE_URL=https://<qa-stack-host> npx playwright test tests/e2e/opus55-agentic-qa.spec.ts
```

## Coverage against the release checklist

| Check | Covered by | Status |
| --- | --- | --- |
| Route access per role | A: role routes; B: role matrix `can use` | Covered (CLAN, DAO, CAC, Ministry, Admin, Warehouse, Auditor, Donor; Exporter in A only) |
| Denied routes | B: role matrix `is denied` (direct navigation) | Covered for CLAN, DAO, CAC, Warehouse, Auditor, Donor |
| Direct URL access | B: denied routes are loaded by URL | Covered |
| Geography scope | B: workflow chain — out-of-scope county refused (403); other-county DAO cannot approve | Covered for Bong/Nimba |
| Workflow actions | B: CLAN → DAO → CAC → Ministry, skip-level refused, double decision refused, idempotent replay | Covered (synthetic, non-production) |
| Exports | A: unauthenticated exports protected; B: export authorisation matrix (Donor, CLAN, Auditor, Ministry) | Covered |
| Inactive-user denial | B: `INACTIVE` and `NOROLE` refused at sign-in; protected route still redirects | Covered |
| Admin API mutation limits | B: Ministry may read, not mutate, admin APIs | Covered |
| Donor PII | B: donor cannot pull farmer PII through the API | Covered |
| Organization scope | — | **Gap** — no test for cross-organization record access |
| Warehouse scope | B: Warehouse route access only | **Gap** — no test that a warehouse manager is refused another warehouse's stock or transfers |
| Notifications | — | **Gap** — no test of which roles receive which notifications |
| Multi-role switching | — | **Gap** — no test of `/workspace/select` and role switching |
| Exporter denials | — | **Gap** — Exporter has route smoke only, no denied-route matrix |

The gaps need data-aware tests (known records in two organizations, two
warehouses, a multi-role operator). Write them against the disposable QA
stack once it is provisioned, so each assertion is verified rather than
guessed.
