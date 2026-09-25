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

## Missing scenarios — specification

All users, organizations and records below are **synthetic** and must be
created only in the QA environment described at the end. Names are
placeholders (`ORG_A`, `WH_A`, …). Expected results follow the current
policies in `supabase/migrations/` and the route gate in
`src/lib/auth/workspace-access.ts`; items marked *confirm* need a product
decision before the test is written.

### 1. Organization isolation

Enforced by `lots_org`, `locations_org` and the organization branch of
`farmers_access` (`organization_id = viewer's organization_id`).

| Item | Requirement |
| --- | --- |
| QA users | `EXPORTER_A` (role exporter, org `ORG_A`), `EXPORTER_B` (exporter, `ORG_B`), both county Bong |
| Organizations / geography | `ORG_A`, `ORG_B` (two exporters/cooperatives), both in Bong |
| Warehouse assignments | None |
| Minimum seed | 1 lot and 1 location per organization; 1 farmer per organization with no geography overlap to the other user |
| Expected | `EXPORTER_A` lists and opens `ORG_A`'s lot; `ORG_B`'s lot is absent from lists and its direct URL / REST select returns no row; insert or update of a lot with `organization_id = ORG_B` is refused. Mirror for `EXPORTER_B`. |

### 2. Warehouse isolation

Enforced by the `warehouse_manager` branch of `can_read_warehouse_transfer`
and the stock/inventory policies that check `warehouse_assignments`.

| Item | Requirement |
| --- | --- |
| QA users | `WM_A` (warehouse_manager), `WM_B` (warehouse_manager), both Bong |
| Organizations / geography | One organization; warehouses `WH_A`, `WH_B`, `WH_C` in Bong |
| Warehouse assignments | `WM_A` → `WH_A` only; `WM_B` → `WH_B` only |
| Minimum seed | Stock rows in `WH_A` and `WH_B`; transfer `T1` (`WH_A`→`WH_C`), transfer `T2` (`WH_B`→`WH_C`) |
| Expected | `WM_A` reads `WH_A` stock and `T1`; `WH_B` stock and `T2` are absent from lists and refused by direct URL / API; `WM_A` cannot dispatch or receive `T2`. Mirror for `WM_B`. Removing `WM_A`'s assignment removes access on the next request. |

### 3. Notification visibility

Enforced by `wf_notifs_read`: Ministry, the recipient, or the creator.

| Item | Requirement |
| --- | --- |
| QA users | `CLAN_BONG` (creator), `DAO_BONG` (recipient), `DAO_NIMBA` (unrelated), `CAC_BONG`, `MINISTRY` |
| Organizations / geography | Bong and Nimba |
| Warehouse assignments | None |
| Minimum seed | One synthetic submission by `CLAN_BONG` that notifies `DAO_BONG` |
| Expected | Visible to `DAO_BONG` (recipient), `CLAN_BONG` (creator) and `MINISTRY`; not visible to `DAO_NIMBA`; not visible to `CAC_BONG` until a notification addressed to them is created (for example after DAO approval). Marking read is allowed only for the recipient (*confirm* against `wf_notifs_update`). |

### 4. Multi-role switching

Driven by `profile_role_assignments` (`assessOperationalAccess` →
`multipleRoles`) and `/workspace/select`.

| Item | Requirement |
| --- | --- |
| QA users | `MULTI_BONG` with two active assignments (e.g. `dao` primary + `cac`), plus one ended and one expired assignment (e.g. `ministry`) |
| Organizations / geography | Bong |
| Warehouse assignments | None |
| Minimum seed | The four assignment rows above |
| Expected | Sign-in lands on `/workspace/select` listing only the two active roles (ended/expired not offered). After choosing DAO: DAO routes allowed, CAC-only and Ministry routes denied; after switching to CAC: the reverse for DAO-only routes. Direct URL to a role that is not active is refused. *Confirm* how the chosen role persists across sessions. |

### 5. Exporter denials

Exporter lands on `/farmers` (`postLoginHomeForRole`).

| Item | Requirement |
| --- | --- |
| QA users | `EXPORTER_A` (from scenario 1) |
| Organizations / geography | `ORG_A`, Bong |
| Warehouse assignments | None |
| Minimum seed | One transfer requested by `EXPORTER_A`, one requested by another user |
| Expected | Allowed: `/cocoa/lots`, `/cocoa/movements`, `/cocoa/eudr`, own-organization records. Denied by direct URL: `/command-center`, `/admin/users`, `/verification-queue`, `/workspace/clan`, `/workspace/dao`, `/workspace/cac`, `/workspace/ministry`, `/donor-dashboard`, `/audit-tools`. Exports `/api/reports/executive-briefing` and `/api/reports/donor-programme` refused (403). Transfers: only the one it requested is readable (`requester = self`). |

## Where to build this QA matrix

Use a **separate, disposable Supabase project** (for example
`agrivault-qa`), never the production project:

1. Create it from the tracked migrations only (`supabase/migrations/`), so
   RLS and functions match what production will run. Do not apply the
   legacy files under `src/lib/supabase/*.sql`.
2. Seed the synthetic organizations, warehouses, users and records above
   with a dedicated seed script (names prefixed `QA-`), using email
   addresses on a domain you control.
3. Point a Vercel **Preview-scoped** environment (not Production) at that
   project, and run the suites against the preview with the variables above
   plus `QA_ALLOW_SYNTHETIC_MUTATIONS=true`.
4. For fast, repeatable policy checks, also run the same seed in a local
   Docker Postgres/Supabase (`npm run test:rls:behavior`) before touching
   the hosted QA project.
5. Tear down or reset the QA project after each release cycle.
