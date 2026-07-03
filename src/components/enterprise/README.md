# AgriVault Enterprise Design System

Canonical UI primitives for operational dashboards, registries, workspaces, and reporting surfaces. Import from `@/components/enterprise`.

## Canonical components

| Component | Use when |
|-----------|----------|
| **PageHeader** | Page-level kicker, title, description, and action buttons. Default for all new operational pages. |
| **SectionHeader** | In-page section titles inside a workspace or panel. |
| **DashboardPanel** | Bordered white content panel (KPI strips, tables, forms, detail bands). |
| **KpiCard** | Single metric tile with optional delta and hint. |
| **StatusBadge** | Status labels in tables, pipelines, queue rows, and detail panels. |
| **EnterpriseDataGrid** | Sortable, filterable, paginated operational tables with CSV export. |
| **QuickActionCard** | Icon + title + description shortcut tiles (role workspaces). |
| **Timeline** | Vertical activity / audit feed. |
| **AlertCard** | Inline operational alert with optional action link. |
| **EmptyState** | Dashed placeholder when a list or panel has no data. |
| **StatusPipeline** | Multi-stage workflow count strip (verification, transfers, approvals). |
| **QueueRow** | Linked queue/list row for review and navigation surfaces. |

### Supporting exports

- `QueuePrimaryLink` — primary CTA button paired with queue panels.
- `cn` — Tailwind class merge helper.
- `enterpriseTokens` — shared radius, shadow, and card class maps.

## Visual standards

- **Canvas:** light enterprise surface (`--enterprise-canvas`, white panels, slate borders).
- **Typography:** Inter Tight / editorial display for headings; Inter for body; DM Mono for labels and data.
- **Color:** forest green accents for primary actions; ink-900 for titles; slate-500/600 for meta text.
- **Spacing:** `space-y-6` between major page sections; `DashboardPanel` default padding `p-5`.
- **Tables:** use `EnterpriseDataGrid` with `dense` for ministry datasets; `theme="light"` on admin routes.

CSS tokens live in `src/app/globals.css` (`--enterprise-*`). Legacy `.gov-*` and `.av-*` classes remain for unmigrated routes.

## Accessibility standards

- Queue rows and quick actions must be real links or buttons with visible focus rings (`focus-visible:outline`).
- Status badges are text spans; pair with meaningful row context — do not rely on color alone.
- Data grids: filter input has `aria-label="Filter table"`; expandable rows use `aria-expanded`.
- Page headers use semantic `<header>` and a single `<h1>` per page.
- Timeline and alert content should use `role="status"` or `aria-live` when updated dynamically.

## Deprecated replacements

| Deprecated | Replace with | Notes |
|------------|--------------|-------|
| `MinistryPageShell` | `PageHeader` + `DashboardPanel` | Legacy gov-kicker / serif title on ~14 routes |
| `AdminPageShell` | `PageHeader` + `DashboardPanel` | Admin gray typography |
| `KPICard` (`shared/`) | `KpiCard` | Rice/cocoa `.av-card-muted` tiles |
| `OpsMetric` / `OpsCard` (`pilot-ui`) | `KpiCard` / `DashboardPanel` | National ops dashboard |
| `StatusPill` (`shared/`) | `StatusBadge` `shape="pill"` | Rice/cocoa tables |
| `StatusChip` (`shared/table/`) | `StatusBadge` `uppercase dot` | Admin tables |
| `OpsStatusBadge` (`pilot-ui`) | `StatusBadge` | Pilot health/watch/critical |
| `WorkspaceQueueRow` | `QueueRow` | Re-export shim in place |
| `QueueRow` (`workspace/ui`) | `QueueRow` | Re-export shim in place |
| `StatTile` (`workspace/ui`) | `QuickActionCard` or linked `KpiCard` | Gov-card linked metrics |
| `TransferStatusPipeline` | `StatusPipeline` | Thin wrapper remains |
| `VerificationStatusPipeline` | `StatusPipeline` | Thin wrapper remains |
| `operations/EnterpriseDataGrid` | `enterprise/EnterpriseDataGrid` | Re-export shim in place |

## Usage example

```tsx
import {
  PageHeader,
  DashboardPanel,
  KpiCard,
  StatusBadge,
  EnterpriseDataGrid,
  QueueRow,
} from "@/components/enterprise";

export function ExamplePage() {
  return (
    <div className="space-y-6">
      <PageHeader kicker="Registry" title="Farmers" description="National farmer registry." />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Registered" value="12,400" hint="All counties" />
      </div>
      <DashboardPanel>
        <EnterpriseDataGrid rows={[]} columns={[]} />
      </DashboardPanel>
      <QueueRow href="/verification-queue" title="Pending review" meta="14 items" tone="warning" badge="Open" />
    </div>
  );
}
```

## Migration policy

1. New surfaces **must** use `@/components/enterprise` imports only.
2. Touching a legacy route: migrate imports when the visual change is negligible.
3. Do not delete deprecated files until all call sites are migrated.
4. Do not change Supabase, API, auth, or workflow logic in design-system passes.
