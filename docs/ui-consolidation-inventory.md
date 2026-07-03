# UI Consolidation Inventory

Pass: enterprise UI primitive consolidation (post enterprise redesign).  
Scope: component layer only — no schema, API, auth, RLS, workflow, PWA, or Mapbox changes.

## Components consolidated (canonical layer)

New or promoted under `src/components/enterprise/`:

| Canonical | Source / action |
|-----------|-----------------|
| `QueueRow.tsx` | Extracted from `WorkspaceQueueRow` |
| `QueuePrimaryLink` | Renamed from `WorkspacePrimaryLink` |
| `StatusPipeline.tsx` | Extracted from transfer + verification pipelines |
| `EnterpriseDataGrid.tsx` | Moved from `operations/`; operations file is re-export shim |
| `StatusBadge.tsx` | Extended with `theme`, `dot`, `uppercase`, `shape` props |

Existing enterprise components unchanged in API: `PageHeader`, `DashboardPanel`, `KpiCard`, `QuickActionCard`, `Timeline`, `AlertCard`, `EmptyState`, `SectionHeader`.

Barrel export updated: `src/components/enterprise/index.ts`.

## Deprecated wrappers (still importable)

| Legacy file | Status |
|-------------|--------|
| `components/operations/MinistryPageShell.tsx` | `@deprecated` comment; implementation preserved |
| `components/admin/AdminPageShell.tsx` | `@deprecated` comment; implementation preserved |
| `components/shared/KPICard.tsx` | `@deprecated` comment; implementation preserved |
| `components/shared/StatusPill.tsx` | Delegates to `StatusBadge` (pill shape) |
| `components/shared/table/StatusChip.tsx` | Delegates to `StatusBadge` (chip style) |
| `components/pilot/pilot-ui.tsx` (`OpsStatusBadge`) | Delegates to `StatusBadge` |
| `components/pilot/pilot-ui.tsx` (`OpsMetric`, `OpsCard`) | `@deprecated` comment; implementation preserved |
| `components/workspace/WorkspaceQueueRow.tsx` | Re-exports `QueueRow` + `QueuePrimaryLink` |
| `components/workspace/ui.tsx` (`QueueRow`) | Re-exports enterprise `QueueRow` |
| `components/workspace/ui.tsx` (`StatTile`) | `@deprecated` comment; implementation preserved |
| `components/logistics/TransferStatusPipeline.tsx` | Thin wrapper over `StatusPipeline` |
| `components/verification/VerificationStatusPipeline.tsx` | Thin wrapper over `StatusPipeline` |
| `components/operations/EnterpriseDataGrid.tsx` | Re-export shim |

## Components still legacy (follow-up)

| Component | Call sites (approx.) | Blocker |
|-----------|---------------------|---------|
| `MinistryPageShell` | ~14 routes via `GenericTablePage` and ops clients | Gov-kicker / serif title differs from `PageHeader` |
| `AdminPageShell` | ~8 admin/activity routes | Gray admin typography |
| `OpsMetric` / `OpsCard` | `NationalOperationsDashboard`, `FieldAgentsClient`, `CountyOperationsClient`, `ReportsCenterClient` | Dense pilot dashboard layout |
| `KPICard` | Rice national dashboard + tables | `.av-card-muted` visual track |
| `StatusPill` | Rice/cocoa tables (7 files) | Wrapper delegates; direct migration optional |
| `StatTile` | None currently imported | Safe to remove after confirming zero imports |
| `Panel` / `BigAction` (`workspace/ui`) | Field workspace patterns | Gov-card styling |
| `.gov-*` / `.cmd-*` / `.av-*` CSS classes | globals.css + scattered usage | CSS token migration pass |

## Files updated

### New files
- `src/components/enterprise/QueueRow.tsx`
- `src/components/enterprise/StatusPipeline.tsx`
- `src/components/enterprise/EnterpriseDataGrid.tsx`
- `src/components/enterprise/README.md`
- `docs/ui-consolidation-inventory.md`

### Modified files
- `src/components/enterprise/index.ts`
- `src/components/enterprise/StatusBadge.tsx`
- `src/components/operations/EnterpriseDataGrid.tsx` (shim)
- `src/components/operations/MinistryPageShell.tsx`
- `src/components/operations/GenericTablePage.tsx`
- `src/components/admin/AdminPageShell.tsx`
- `src/components/shared/KPICard.tsx`
- `src/components/shared/StatusPill.tsx`
- `src/components/shared/table/StatusChip.tsx`
- `src/components/pilot/pilot-ui.tsx`
- `src/components/workspace/WorkspaceQueueRow.tsx`
- `src/components/workspace/ui.tsx`
- `src/components/workspace/MinistryWorkspaceClient.tsx`
- `src/components/workspace/CacWorkspaceClient.tsx`
- `src/components/workspace/DaoWorkspaceClient.tsx`
- `src/components/logistics/TransferStatusPipeline.tsx`
- `src/components/verification/VerificationStatusPipeline.tsx`

## Follow-up cleanup (recommended order)

1. **Migrate `GenericTablePage`** from `MinistryPageShell` to `PageHeader` (affects ~20 table routes).
2. **Migrate admin console** from `AdminPageShell` to `PageHeader` with admin class overrides.
3. **Replace `OpsMetric` grids** in `NationalOperationsDashboard` with `KpiCard` once accent border mapping is added to `KpiCard`.
4. **Point all `EnterpriseDataGrid` imports** to `@/components/enterprise` (~30 files; shim works today).
5. **Remove re-export shims** after import migration (`operations/EnterpriseDataGrid`, `WorkspaceQueueRow`).
6. **CSS consolidation** — collapse `.gov-*` / `.av-*` into `--enterprise-*` tokens.
7. **Delete `StatTile`** if grep confirms zero imports.

## Validation

- `npm run lint`
- `npm run build`
- `npm run test:workflow`
