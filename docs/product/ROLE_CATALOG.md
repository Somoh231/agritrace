# AgriVault Role Catalog

**Version:** 1.0 · 2026-07-03  
**Source of truth:** `UserRole` enum in `src/lib/supabase/types.ts`  
**Related:** [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) · [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) · [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md) · [../DATABASE.md](../DATABASE.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Table of contents

1. [Overview](#overview)
2. [Operational chain](#operational-chain)
3. [Role summary table](#role-summary-table)
4. [Platform administration](#platform-administration)
5. [Ministry national roles](#ministry-national-roles)
6. [County (CAC) roles](#county-cac-roles)
7. [District (DAO) roles](#district-dao-roles)
8. [Field (CLAN) roles](#field-clan-roles)
9. [Logistics and registry roles](#logistics-and-registry-roles)
10. [External visibility roles](#external-visibility-roles)
11. [Cross-cutting rules](#cross-cutting-rules)
12. [Provisioning reference](#provisioning-reference)

---

## Overview

AgriVault defines **18 `UserRole` values** stored on `profiles.role` in PostgreSQL. Each role maps to an operational group, a default landing route after authentication, a workflow stage (where applicable), and a set of route-level capabilities enforced by middleware (`assertPilotRouteAccess`) and Row Level Security.

Roles are **not** cosmetic labels. They determine:

- Which dashboard the user sees after login (`postLoginHomeForRole`)
- Whether the user can capture, review, or only read operational submissions
- County and district scope for RLS and workflow permissions
- Access to GIS, inventory, reporting, and admin surfaces

Canonical grouping logic lives in `src/lib/auth/operational-roles.ts`. Workflow stage mapping lives in `src/lib/workflow/roles.ts`. Route policy lives in `src/lib/auth/workspace-access.ts`.

---

## Operational chain

The Ministry pilot follows a four-stage approval chain defined in [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md):

```
CLAN (field capture) → DAO (district review) → CAC (county review) → Ministry (national sign-off)
```

```mermaid
graph LR
  CLAN[CLAN Technician] --> DAO[DAO Officer]
  DAO --> CAC[CAC Coordinator]
  CAC --> MIN[Ministry Officer]
  MIN --> ARCH[Archived record]
```

Roles outside this chain (warehouse, exporter, donor, auditor) interact with specific modules but do not participate in the full approval pipeline unless explicitly granted capture or review rights.

---

## Role summary table

| Role | Display label | Operational group | Default landing | Workflow stage | Primary workspace |
|------|---------------|-------------------|-----------------|----------------|-------------------|
| `super_admin` | System administrator | Platform admin | `/command-center` | `ministry` | `/admin` |
| `admin` | Administrator | Platform admin | `/command-center` | `ministry` | `/admin` |
| `ministry_admin` | Ministry administrator | Ministry national | `/command-center` | `ministry` | `/workspace/ministry` |
| `ministry_officer` | Ministry officer | Ministry national | `/command-center` | `ministry` | `/workspace/ministry` |
| `government_officer` | Ministry officer (legacy) | Ministry national | `/command-center` | `ministry` | `/workspace/ministry` |
| `county_agriculture_coordinator` | CAC Coordinator | County (CAC) | `/county-dashboard` | `cac` | `/workspace/cac` |
| `county_officer` | CAC Coordinator | County (CAC) | `/county-dashboard` | `cac` | `/workspace/cac` |
| `dao_officer` | DAO Officer | District (DAO) | `/district-dashboard` | `dao` | `/workspace/dao` |
| `district_officer` | DAO Officer | District (DAO) | `/district-dashboard` | `dao` | `/workspace/dao` |
| `clan_technician` | CLAN Technician | Field (CLAN) | `/district-dashboard` | `clan` | `/workspace/clan` |
| `field_agent` | CLAN Technician | Field (CLAN) | `/district-dashboard` | `clan` | `/workspace/clan` |
| `warehouse_manager` | Warehouse manager | Logistics | `/inventory` | `none` | `/inventory` |
| `cooperative_manager` | Cooperative manager | Registry / cooperative | `/farmers` | `none` | `/cooperatives` |
| `exporter` | Exporter | Export chain | `/cocoa/lots` | `none` | `/cocoa` |
| `donor_observer` | Donor observer (read-only) | Donor visibility | `/donor-dashboard` | `donor` | `/donor-dashboard` |
| `donor_partner` | Donor partner (read-only) | Donor visibility | `/donor-dashboard` | `donor` | `/donor-dashboard` |
| `call_center_agent` | Call center | Call center | `/verification-queue` | `none` | `/verification-queue` |
| `auditor` | Auditor (read-only) | Audit | `/audit-tools` | `auditor` | `/audit-tools` |

**Note:** `pilotRoleLandingPath()` redirects CLAN field roles to `/field/mobile` on access denial — the mobile field surface is the operational home for daily capture even though post-login routing lands on `/district-dashboard`.

---

## Platform administration

### `super_admin`

| Attribute | Value |
|-----------|-------|
| **Description** | Highest-privilege platform operator. Full access to admin console, national command surfaces, and all workflow stages. Used for initial deployment, break-glass support, and cross-county operations. |
| **Operational group** | Platform admin (`MINISTRY_NATIONAL_ROLES`) |
| **Default landing route** | `/command-center` |
| **Workflow stage** | `ministry` — can approve at any chain level |
| **Key capabilities** | Admin console (`/admin/*`); national command center; all GIS surfaces; verification queue; inventory and transfers; executive briefing; workflow approve/reject/escalate/archive; bypass county scope at ministry stage |
| **Restrictions** | Actions still append to `workflow_actions` and `audit_log` — no silent mutations. Should be provisioned sparingly per [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 7. |

### `admin`

| Attribute | Value |
|-----------|-------|
| **Description** | Legacy platform-administrator role retained for existing explicitly provisioned database profiles. It is never inferred from authentication state. |
| **Operational group** | Platform admin |
| **Default landing route** | `/command-center` |
| **Workflow stage** | `ministry` |
| **Key capabilities** | Same route access as `ministry_admin` via `isAdminConsoleRole()` and `isMinistryNationalRole()` |
| **Restrictions** | Provision only through controlled administration. Missing or inactive profile rows fail closed and receive no role. Must not be used for routine field operations. |

---

## Ministry national roles

### `ministry_admin`

| Attribute | Value |
|-----------|-------|
| **Description** | Ministry programme administrator responsible for user provisioning, system configuration, and national oversight. Primary owner of `/admin` console during pilot. |
| **Operational group** | Ministry national |
| **Default landing route** | `/command-center` |
| **Workflow stage** | `ministry` |
| **Key capabilities** | Admin console; national operations shell; executive briefing PDF; verification queue oversight; GIS intelligence; assign reviewers; final approve/reject; archive terminal submissions |
| **Restrictions** | Not county-bound for review actions. Cannot impersonate another user's server-side permissions (workspace role switcher is UI-only). |

### `ministry_officer`

| Attribute | Value |
|-----------|-------|
| **Description** | National desk officer reviewing escalated submissions, monitoring county performance, and producing leadership reports. Day-to-day Ministry operator. |
| **Operational group** | Ministry national |
| **Default landing route** | `/command-center` |
| **Workflow stage** | `ministry` |
| **Key capabilities** | Command center KPIs; national heat map; verification queue; reporting hub; food security indicators; transfer oversight; workflow ministry-stage review |
| **Restrictions** | No admin console unless also `ministry_admin`. Cannot mutate donor or auditor read-only records. |

### `government_officer`

| Attribute | Value |
|-----------|-------|
| **Description** | **Legacy alias** retained for RLS compatibility with seeded pilot accounts. Behaviour is identical to `ministry_officer`. New profiles should use `ministry_officer` or `ministry_admin`. |
| **Operational group** | Ministry national |
| **Default landing route** | `/command-center` |
| **Workflow stage** | `ministry` |
| **Key capabilities** | Same as `ministry_officer` |
| **Restrictions** | Deprecated for new provisioning. Listed in `isAdminConsoleRole()` for existing accounts only. |

---

## County (CAC) roles

### `county_agriculture_coordinator`

| Attribute | Value |
|-----------|-------|
| **Description** | County Agriculture Coordinator — second-level reviewer in the CLAN → DAO → CAC → Ministry chain. Validates district-approved submissions and monitors county-wide KPIs. |
| **Operational group** | CAC (`CAC_COUNTY_ROLES`) |
| **Default landing route** | `/county-dashboard` |
| **Workflow stage** | `cac` |
| **Key capabilities** | County dashboard; CAC workspace (`/workspace/cac`); CAC approval queues; executive briefing; advanced GIS intelligence; verification queue (read + review); reporting hub; field agent monitoring; national heat map |
| **Restrictions** | County-bound: review actions require `actorCounty === submissionCounty`. Read-only on DAO district desk (`daoReviewReadOnly`). Cannot access admin console. |

### `county_officer`

| Attribute | Value |
|-----------|-------|
| **Description** | County desk officer operating under CAC supervision. Same workflow permissions as `county_agriculture_coordinator` with equivalent route access. |
| **Operational group** | CAC |
| **Default landing route** | `/county-dashboard` |
| **Workflow stage** | `cac` |
| **Key capabilities** | Same as `county_agriculture_coordinator` |
| **Restrictions** | County-bound review scope. No admin console. |

---

## District (DAO) roles

### `dao_officer`

| Attribute | Value |
|-----------|-------|
| **Description** | District Agriculture Officer — first reviewer in the approval chain. Reviews CLAN submissions, manages district verification queue, and coordinates field agent activity. |
| **Operational group** | DAO (`DAO_DISTRICT_ROLES`) |
| **Default landing route** | `/district-dashboard` |
| **Workflow stage** | `dao` |
| **Key capabilities** | District dashboard; DAO workspace; verification queue (assign, approve, reject, request corrections); farmer registration review; GPS evidence review; pest alert triage; subsidy distribution logging; harvest report validation; field agent monitoring |
| **Restrictions** | County-bound for review. Cannot access national command center or admin console. Cannot perform CAC or Ministry stage approvals (except via escalate). |

### `district_officer`

| Attribute | Value |
|-----------|-------|
| **Description** | District desk officer with equivalent DAO workflow and route permissions. May be assigned to a specific district within a county. |
| **Operational group** | DAO |
| **Default landing route** | `/district-dashboard` |
| **Workflow stage** | `dao` |
| **Key capabilities** | Same as `dao_officer` |
| **Restrictions** | County-bound. District scope enforced via `profiles.district` where RLS policies apply. |

---

## Field (CLAN) roles

### `clan_technician`

| Attribute | Value |
|-----------|-------|
| **Description** | Clan Agriculture Crops Technician — primary field capture operator. Registers farmers, captures GPS boundaries, submits inspections and pest alerts, often working offline in rural districts. |
| **Operational group** | CLAN (`CLAN_FIELD_ROLES`) |
| **Default landing route** | `/district-dashboard` (auth); `/field/mobile` (denial redirect) |
| **Workflow stage** | `clan` |
| **Key capabilities** | CLAN workspace; farmer registration (`/farmers`); GPS boundary capture (`/field/boundary-capture`); field inspections; pest reports; offline sync queue; submit operational submissions; comment on own submissions |
| **Restrictions** | **Cannot review** submissions (`checkWorkflowPermission` blocks CLAN review actions). No verification queue, inventory, executive briefing, or advanced GIS. No field agent monitoring. |

### `field_agent`

| Attribute | Value |
|-----------|-------|
| **Description** | Field agent with identical CLAN capture permissions. Legacy naming retained alongside `clan_technician` for seeded accounts and RLS policies. |
| **Operational group** | CLAN |
| **Default landing route** | `/district-dashboard` |
| **Workflow stage** | `clan` |
| **Key capabilities** | Same as `clan_technician` |
| **Restrictions** | Cannot review. No logistics or national surfaces. |

---

## Logistics and registry roles

### `warehouse_manager`

| Attribute | Value |
|-----------|-------|
| **Description** | Warehouse operator managing stock levels, transfers, seed distribution, and donor shipment receipt. Bridges field programmes to physical inventory. |
| **Operational group** | Logistics |
| **Default landing route** | `/inventory` |
| **Workflow stage** | `none` (read-only workflow default) |
| **Key capabilities** | Inventory dashboard; warehouse detail pages; transfer orders; logistics command center; subsidies and production routes; distribution log writes; stock transfer form with workflow bridge |
| **Restrictions** | No verification queue or command center. Cannot approve operational submissions at DAO/CAC/Ministry stages. County scope may apply via warehouse assignment. |

### `cooperative_manager`

| Attribute | Value |
|-----------|-------|
| **Description** | Cooperative administrator managing member farmer records and group-level reporting. Supports registry completeness at cooperative level. |
| **Operational group** | Registry / cooperative |
| **Default landing route** | `/farmers` |
| **Workflow stage** | `none` |
| **Key capabilities** | Farmer registry; cooperative profiles; inventory/logistics routes; distribution log writes; compliance read |
| **Restrictions** | No workflow review. No national command or admin surfaces. No executive briefing. |

### `exporter`

| Attribute | Value |
|-----------|-------|
| **Description** | Commodity exporter tracking lots, movements, and export approvals — primarily cocoa chain surfaces during RC1. |
| **Operational group** | Export chain |
| **Default landing route** | `/cocoa/lots` |
| **Workflow stage** | `none` |
| **Key capabilities** | Cocoa module (`/cocoa/*`); lot registry; movement tracking; inventory/logistics routes; farmer read access; compliance routes |
| **Restrictions** | No operational submission review. No admin console. No field capture routes. Export approval workflow is commodity-specific, not the national CLAN→Ministry chain. |

### `call_center_agent`

| Attribute | Value |
|-----------|-------|
| **Description** | Call center operator handling farmer inquiries, registration follow-up, and verification queue triage. Supports phone-based registration assistance. |
| **Operational group** | Call center |
| **Default landing route** | `/verification-queue` |
| **Workflow stage** | `none` |
| **Key capabilities** | Verification queue; activity/search dashboard; farmer registry read; farmer visit writes per RLS |
| **Restrictions** | No capture of GPS boundaries. No workflow approve/reject. No national command center (per `canAccessNationalCommandCenter` exception in `post-login-home.ts` — verify route access). No inventory management. |

---

## External visibility roles

### `donor_observer`

| Attribute | Value |
|-----------|-------|
| **Description** | Read-only donor programme observer. Views aggregate programme outcomes without access to operational mutation surfaces. |
| **Operational group** | Donor visibility (`DONOR_VISIBILITY_ROLES`) |
| **Default landing route** | `/donor-dashboard` |
| **Workflow stage** | `donor` (read-only) |
| **Key capabilities** | Donor dashboard; farmer/cooperative read (limited); compliance read |
| **Restrictions** | **Strictly read-only** across workflow (`isReadOnlyStage`). Blocked from GIS, verification queue, reporting hub, inventory, alerts, and all pilot workspaces. Cannot write `distribution_logs`. |

### `donor_partner`

| Attribute | Value |
|-----------|-------|
| **Description** | Donor programme partner with slightly broader read access than observer — may view distribution logs and subsidy data per RLS. Still no mutation rights. |
| **Operational group** | Donor visibility |
| **Default landing route** | `/donor-dashboard` |
| **Workflow stage** | `donor` (read-only) |
| **Key capabilities** | Donor dashboard; distribution log read; farmer subsidy read |
| **Restrictions** | Same read-only workflow restrictions as `donor_observer`. No operational workspaces. |

### `auditor`

| Attribute | Value |
|-----------|-------|
| **Description** | Independent auditor with read access to audit trails, compliance records, and workflow history. Used for programme verification and external review. |
| **Operational group** | Audit |
| **Default landing route** | `/audit-tools` |
| **Workflow stage** | `auditor` (read-only) |
| **Key capabilities** | Audit tools surface; compliance routes; workflow thread read via API; `audit_log` read per RLS |
| **Restrictions** | Cannot capture, review, or mutate any operational submission. Blocked from GIS, inventory, reporting hub, and national dashboards. All actions logged if any API access attempted. |

---

## Cross-cutting rules

| Rule | Implementation | Reference |
|------|----------------|-----------|
| County-bound review | DAO, CAC, CLAN reviewers must match `submission.county` | `actorCountyMatches()` in `roles.ts` |
| Author submit rights | CLAN/DAO/CAC/Ministry can `submit`; authors can `comment` on own records | `checkWorkflowPermission()` |
| Middleware gate | All gated routes checked via `assertPilotRouteAccess()` | `workspace-access.ts` |
| Admin console | `isAdminConsoleRole()` — super_admin, admin, ministry_admin, ministry_officer, government_officer | `admin-access.ts` |
| Demo role switcher | UI preview only — server always uses authenticated `profiles.role` | [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) Principle 7 |
| RLS enforcement | Database policies complement application gates | [../DATABASE.md](../DATABASE.md) |

---

## Provisioning reference

```sql
-- Example: provision a DAO officer for Bong county, Salala district
insert into public.profiles (id, email, full_name, role, county, district)
values (
  '<auth-user-uuid>',
  'dao.salala@example.gov.lr',
  'James Kollie',
  'dao_officer',
  'Bong',
  'Salala'
);
```

| Role category | Recommended `county` | Recommended `district` | `organization_id` |
|---------------|------------------------|------------------------|-------------------|
| CLAN / DAO | Required | Required for DAO | Optional |
| CAC | Required | Optional | Ministry org |
| Ministry | Optional (national) | — | Ministry org |
| Warehouse | Required | — | Warehouse org |
| Donor / Auditor | — | — | Donor org |

Full capability matrix: [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md)  
End-to-end journeys: [USER_JOURNEYS.md](./USER_JOURNEYS.md)
