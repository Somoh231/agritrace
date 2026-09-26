# ADR 0012 — Role route boundaries (field, exporter, call-center)

- **Status:** Partly accepted. §A is implemented on `security/role-access-corrections`. §B–§D are **proposed**: routes are documented here before any change, per owner instruction.
- **Date:** 2026-09-26
- **Related:** ADR 0008 (role-based security), ADR 0011 (roles are assigned, never chosen)

The route gate (`assertPilotRouteAccess`, enforced in middleware), the sign-in home (`postLoginHomeForRole`) and the layout checks must agree, and each role should reach only what its job needs. "Current" below is computed from the code on 2026-09-26, not written from memory.

## A. call_center_agent — implemented

| | Current | Now |
|---|---|---|
| Sign-in home | `/verification-queue` | **`/farmers`** |
| `/verification-queue` | refused by the route gate, so every sign-in bounced to `/farmers` | still refused (reviewer workspace) |
| Command-center layout check | allowed (middleware refused) | refused, matching middleware |

**Why `/farmers`, not opening the queue:** the route matrix already lists the verification queue for DAO, CAC and ministry roles; the admin governance page describes the role as "data capture support"; the fallback landing path is `/farmers`; and RLS grants it registration capture, not review. Letting capture staff verify registrations they entered would remove the separation between capture and review.

**Tests:** the unit invariant "every role's sign-in home and fallback landing are pages it can open" (with exporter listed as the only pending exception), a command-center layout/middleware agreement check, and route tests for `/app → /farmers` and a refused `/verification-queue`.

## B. CLAN technicians and field agents — proposed

Current access (CLAN and field are identical today):

| Route | Current | Proposed |
|---|---|---|
| Sign-in home | `/district-dashboard` | **`/workspace/clan`** (CLAN task desk) |
| Fallback landing | `/field/mobile` | `/workspace/clan` |
| `/workspace/clan`, `/field/*` (capture, sync queue, inspections, reports they file) | ✓ | ✓ |
| `/farmers` | ✓ (RLS: own county for `field_agent`) | ✓, own-scope capture and lookup only |
| `/workspace/dao` | ✓ | **✗** |
| `/district-dashboard` | ✓ | **✗** |
| `/reports` (national/district reporting) | ✓ | **✗**; their own submissions stay visible in the CLAN desk |
| `/verification-queue`, `/county-dashboard`, `/command-center`, admin | ✗ | ✗ |

**Code changes when approved:** `canAccessPilotWorkspace(…, "dao")` stops including `isClanFieldRole`. `canAccessDistrictDashboard` drops CLAN roles. `/field` stays open to CLAN (its own capture tools) but is split from DAO-only field-supervision pages (`/field-agents`, which is already separate). `postLoginHomeForRole` and `pilotRoleLandingPath` both return `/workspace/clan`. `/reports` gets a CLAN exclusion.

**Broader responsibility only by assignment:** a CLAN user who also covers DAO duties gets a second, server-validated assignment rather than a wider single role. ADR 0011 already routes preview and workspace selection through `assignedWorkspaceRoles()`. The follow-up adds a `role_assignments` table (`user_id`, `role`, `county`, `district`, `granted_by`, `active`, `expires_at`, audited) that only the admin console can write. Route checks then pass if **any** active assignment allows the route. Until that table exists, nobody gets DAO access through a CLAN account.

## C. Exporters and the farmer registry — proposed

| Route | Current | Proposed |
|---|---|---|
| Sign-in home | `/cocoa/lots`, but the route gate refuses `/cocoa`, so every sign-in bounced to **`/farmers`** | `/cocoa/lots` |
| `/cocoa/lots`, `/cocoa/movements`, `/cocoa/eudr` (export, custody, due diligence) | ✗ | **✓**, organisation-scoped |
| Other `/cocoa/*` (approvals, farmers, data quality…) | ✗ | ✗ |
| `/farmers` (national registry UI) | ✓ | **✗** |
| Farmer origin data needed for export | via the registry | only through lot traceability: farmers and plots linked to **their own organisation's lots** |
| Command center | layout allowed, middleware refused | refused (done in §A) |

**Data layer today:** RLS already scopes an exporter to `farmers.organization_id` and `lots.organization_id` equal to their own organisation (`farmers_access`, `lots_org`). So this is mostly a UI and routing fix. The lot-traceability view needs an organisation-scoped query (lot → movements → plots → farmers) that never falls back to demo data.

## D. Exporters and inventory — proposed

| Route | Current | Proposed |
|---|---|---|
| `/inventory`, `/transfers`, `/logistics` (national and warehouse logistics) | ✓ (`canAccessWarehouseLogisticsRoutes` lists `exporter`) | **✗** |
| Export logistics | through national inventory pages | `/cocoa/movements`: their own lots' dispatch and receipt, organisation-scoped |

**Data layer today:** RLS gives exporters **no** rows from `warehouse_stock`, `inventory_movements` or `warehouses` (those follow warehouse assignments). The risk is the UI: when tables return nothing, the inventory pages fall back to built-in demo figures, so an exporter sees national-looking numbers. Removing the route closes that. Track B removes demo fallbacks from operational pages.

## Related database findings (separate follow-up, not part of this ADR)

- `farmers_update` lets `field_agent`, `call_center_agent`, `cooperative_manager`, `county_officer` and `district_officer` update **any** farmer, with no county or district scope.
- `inv_mov_read` lets any `warehouse_manager` read every inventory movement nationally, not just their assigned warehouses.

Both should get scoped policies, tested with `npm run test:db:roles`-style scenarios on staging before production.

## Rollout

1. §A ships with the next approved deploy after `security/platform-emergency-hardening`.
2. §B–§D: owner confirms the proposed tables above, then they are implemented on this branch with tests (route matrix plus the stub-Supabase route suite), verified on **staging** with the synthetic QA accounts, and deployed.
