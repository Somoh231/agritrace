# AgriVault Design System

**Version:** 0.1.0-rc1  
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## Table of contents

1. [Overview](#overview)
2. [Design principles](#design-principles)
3. [Color system](#color-system)
4. [Typography](#typography)
5. [Spacing and layout](#spacing-and-layout)
6. [Surface primitives](#surface-primitives)
7. [Component library](#component-library)
8. [Layout modes](#layout-modes)
9. [Print styles](#print-styles)
10. [Usage guidelines](#usage-guidelines)

---

## Overview

AgriVault uses a dual-surface design system:

| Surface | CSS prefix | Context |
|---------|-----------|---------|
| **Ministry command** (dark) | `cmd-*`, `ministry-*` | Auth screens, map-first views, dark workspace panels |
| **Government canvas** (light) | `gov-*`, `enterprise-*` | Command center, registries, reporting, admin |
| **Application layer** | `av-*` | Buttons, inputs, cards used across both surfaces |

Source of truth for CSS custom properties: `src/app/globals.css`  
Tailwind extensions: `tailwind.config.ts`  
React token map: `src/components/enterprise/tokens.ts`

There is no `components/ui/` shadcn directory. Primitives live in `src/components/enterprise/` and are exported via `src/components/enterprise/index.ts`.

---

## Design principles

1. **Institutional authority** — Forest green and gold signal government operations, not consumer SaaS.
2. **Data provenance** — Every data surface that merges sources displays a `DataSourceBadge` (see `src/components/enterprise/DataSourceBadge.tsx`).
3. **Role-scoped density** — Field views optimize for touch and GPS; desk views optimize for tables and queues.
4. **8px grid** — Spacing, radius, and component padding align to an 8px base (`enterpriseTokens` in `tokens.ts`).

---

## Color system

### Forest palette (primary brand)

Defined in `:root` as `--color-forest-*`:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-forest-900` | `#07190B` | Deepest background |
| `--color-forest-800` | `#0B2410` | Primary button (`av-btn-primary`) |
| `--color-forest-700` | `#123418` | Hover states |
| `--color-forest-500` | `#276634` | Accent borders |
| `--color-forest-300` | `#62AD73` | Input focus ring |
| `--color-forest-100` | `#D5F0DA` | Selection highlight |
| `--color-forest-50` | `#EEF9F0` | Subtle backgrounds |

Tailwind mirror: `forest-50` through `forest-900` in `tailwind.config.ts`.

### Ministry workspace (dark command center)

RGB triplets for use with `rgb(var(--token))`:

| Token | RGB | Usage |
|-------|-----|-------|
| `--ministry-sidebar` | `7 33 20` | Sidebar background |
| `--ministry-sidebar-fg` | `236 253 245` | Sidebar text |
| `--ministry-workspace` | `11 34 21` | Main canvas |
| `--ministry-panel` | `16 45 28` | Panel surfaces (`.cmd-surface`) |
| `--ministry-panel-border` | `34 70 50` | Panel borders |
| `--ministry-gold` | `201 162 75` | Kickers, accents, rules |
| `--ministry-gold-strong` | `176 132 45` | Strong gold emphasis |
| `--ministry-emerald` | `52 211 153` | Online/sync indicators |
| `--ministry-canvas` | `244 245 241` | Light canvas fallback |

### Enterprise light shell

| Token | RGB | Usage |
|-------|-----|-------|
| `--enterprise-canvas` | `247 248 249` | Page background |
| `--enterprise-card` | `255 255 255` | Card surfaces |
| `--enterprise-border` | `226 232 240` | Card and table borders |
| `--enterprise-sidebar` | `5 46 22` | Light-shell sidebar |
| `--enterprise-sidebar-fg` | `236 253 245` | Sidebar text |
| `--enterprise-muted` | `100 116 139` | Secondary text |

### Semantic surfaces (light)

| Token | RGB | Usage |
|-------|-----|-------|
| `--surface` | `255 255 255` | Default background |
| `--surface-muted` | `247 248 250` | Muted sections |
| `--border` | `226 231 238` | Default borders |
| `--text` | `11 18 32` | Primary text (ink) |
| `--text-muted` | `71 85 105` | Body text |

### Marketing accents

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-navy-950` | `#001E4D` | Marketing CTAs (`.av-btn-navy`) |
| `--color-navy-900` | `#003377` | Marketing headers |
| `--color-red-600` | `#CC1133` | Alert CTAs (`.av-btn-red`) |
| `--color-amber-500` | `#BA7517` | Warning indicators |

---

## Typography

### Font families

Loaded in `src/app/layout.tsx` via `next/font/google`:

| CSS variable | Font | Role |
|--------------|------|------|
| `--font-display` | Inter Tight | Headings h1–h3 |
| `--font-body` | Inter | Body text, UI labels |
| `--font-mono` | DM Mono | Kickers, table headers, metadata |
| `--font-serif` | DM Serif Display | Cabinet brief headings (`.font-serif-display`) |

Tailwind aliases in `tailwind.config.ts`:

```typescript
fontFamily: {
  display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
  body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
  mono: ["var(--font-mono)", "monospace"],
  editorial: ["var(--font-serif)", "Georgia", "serif"],
}
```

### Type scale

| Element | Classes | Size |
|---------|---------|------|
| `h1` | `text-5xl md:text-6xl font-semibold tracking-tight` | 48–60px |
| `h2` | `text-3xl md:text-4xl font-semibold tracking-tight` | 30–36px |
| `h3` | `text-xl font-semibold tracking-tight` | 20px |
| Body (`p`, `li`) | `text-base text-gray-600` | 16px |
| Small | `text-sm text-gray-500` | 14px |
| Kicker (`.cmd-kicker`) | `9px uppercase tracking-[0.22em]` | 9px mono |
| Kicker (`.gov-kicker`) | `10px uppercase tracking-[0.18em]` | 10px mono |
| Table header | `text-[10px] uppercase tracking-[0.16em]` | 10px mono |

---

## Spacing and layout

### Radius tokens (`enterpriseTokens.radius`)

| Token | Tailwind | Pixels |
|-------|----------|--------|
| `sm` | `rounded-lg` | 8px |
| `md` | `rounded-xl` | 12px |
| `lg` | `rounded-2xl` | 16px |

### Shadow tokens

| Token | Value |
|-------|-------|
| `shadow.soft` | Tailwind custom — card elevation |
| `enterpriseTokens.shadow.card` | `0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)` |
| `enterpriseTokens.shadow.panel` | `0 2px 8px rgba(16,24,40,0.08)` |

### Grid

Dashboard layouts use Tailwind grid with `gap-4` (16px) or `gap-6` (24px). KPI rows typically use `grid-cols-2 md:grid-cols-4`.

---

## Surface primitives

### Dark command center (`cmd-*`)

Used on login, field mobile views, and dark workspace panels.

```html
<!-- Kicker label -->
<div class="cmd-kicker">Operational status</div>

<!-- Panel surface -->
<div class="cmd-surface cmd-surface-hover px-4 py-3">
  Panel content
</div>

<!-- Gold gradient rule -->
<div class="cmd-rule"></div>
```

| Class | Purpose |
|-------|---------|
| `.cmd-kicker` | Mono uppercase label in ministry gold |
| `.cmd-surface` | Dark panel with border |
| `.cmd-surface-hover` | Hover border brightens to gold |
| `.cmd-rule` | Horizontal gold gradient divider |
| `.ministry-shell-sidebar` | Sidebar gradient with inset shadow |

### Government light canvas (`gov-*`)

Used on command center, registries, reporting, admin pages.

```html
<div class="gov-canvas min-h-screen p-6">
  <div class="gov-card gov-card-hover p-5">
    <div class="gov-kicker gov-kicker-gold">County overview</div>
    <!-- content -->
  </div>
</div>
```

| Class | Purpose |
|-------|---------|
| `.gov-canvas` | Light ministry canvas background |
| `.gov-card` | White card with subtle shadow |
| `.gov-card-hover` | Hover elevation and gold border |
| `.gov-kicker` | Slate mono label |
| `.gov-kicker-gold` | Gold variant kicker |
| `.btn-gold` | Gold gradient button |
| `.btn-emerald` | Emerald gradient button |
| `.btn-gov-outline` | Outlined secondary button |

### Enterprise data surfaces (`enterprise-*`)

```html
<div class="enterprise-canvas min-h-screen">
  <div class="enterprise-card p-4">...</div>
  <table class="enterprise-table">...</table>
</div>
```

Table styling: sticky thead, mono uppercase headers, hover row highlight.

### Application components (`av-*`)

| Class | Purpose |
|-------|---------|
| `.av-card` | Standard white card with soft shadow |
| `.av-card-muted` | Muted gray card |
| `.av-btn-primary` | Forest green primary button |
| `.av-btn-secondary` | White bordered button |
| `.av-btn-outline` | Slate outline button |
| `.av-btn-ghost` | Transparent hover button |
| `.av-btn-navy` | Navy marketing button |
| `.av-btn-red` | Red alert button |
| `.av-input` | Standard form input (h-11, rounded-xl) |

Example button usage:

```tsx
<button className="av-btn av-btn-primary">Submit report</button>
<input className="av-input" placeholder="Farmer name" />
```

---

## Component library

### Enterprise exports

Import from `@/components/enterprise` or `@/components/enterprise/index.ts`:

| Component | File | Purpose |
|-----------|------|---------|
| `PageHeader` | `PageHeader.tsx` | Page title + actions row |
| `SectionHeader` | `SectionHeader.tsx` | Section divider with kicker |
| `KpiCard` | `KpiCard.tsx` | Metric tile with trend |
| `DashboardPanel` | `DashboardPanel.tsx` | Bordered content panel |
| `StatusBadge` | `StatusBadge.tsx` | Workflow/status pill |
| `StatusPipeline` | `StatusPipeline.tsx` | Multi-step progress indicator |
| `QueueRow` | `QueueRow.tsx` | Verification queue row |
| `EnterpriseDataGrid` | `EnterpriseDataGrid.tsx` | Sortable data table |
| `DataSourceBadge` | `DataSourceBadge.tsx` | LIVE / PILOT / OFFLINE / DEMO badge |
| `DataSourceNotice` | `DataSourceBadge.tsx` | Banner for mixed-source data |
| `AlertCard` | `AlertCard.tsx` | Error/warning/info alert |
| `EmptyState` | `EmptyState.tsx` | Zero-data placeholder |
| `Timeline` | `Timeline.tsx` | Workflow action history |
| `QuickActionCard` | `QuickActionCard.tsx` | Workspace shortcut tile |
| `cn` | `cn.ts` | Class name merge utility |

### Domain-specific UI

| Package | Path | Used by |
|---------|------|---------|
| Workspace UI | `src/components/workspace/ui.tsx` | CLAN/DAO/CAC/Ministry workspaces |
| Pilot UI | `src/components/pilot/pilot-ui.tsx` | Pilot-specific shared elements |
| Shared | `src/components/shared/` | `SyncStatusIndicator`, toast, KPI helpers |

### DataSourceBadge usage

Every surface that merges data sources must display provenance:

```tsx
import { DataSourceBadge, DataSourceNotice } from "@/components/enterprise";

<DataSourceNotice source={result.source} />
<DataSourceBadge kind="live" detail="Supabase farmers table" />
```

Source kinds: `live`, `pilot`, `offline`, `demo`. See [data-source-inventory.md](./data-source-inventory.md).

---

## Layout modes

`src/lib/navigation/layout-mode.ts` controls shell chrome per route:

| Mode | Routes | Behavior |
|------|--------|----------|
| `default` | Most dashboard pages | Full sidebar + topbar |
| `map` | `/field/boundary-capture`, `/gis-intelligence` | Full-bleed map, minimal chrome |
| `focus` | Selected reporting views | Reduced sidebar |

Map routes use `dynamic(..., { ssr: false })` for Mapbox GL components.

---

## Print styles

Executive briefing pages use print-specific CSS in `globals.css`:

| Class | Purpose |
|-------|---------|
| `.briefing-print-root` | Print-visible content root |
| `.briefing-no-print` | Hidden in print media |

`@media print` rules force white background, hide non-print elements, and normalize dark-theme text colors for PDF companion output.

---

## Usage guidelines

### When to use dark vs light surfaces

| Context | Surface |
|---------|---------|
| Login, field mobile, offline status | `cmd-*` dark |
| Command center, dashboards, tables | `gov-*` / `enterprise-*` light |
| Map-first routes | Dark map chrome, light overlay panels |

### Do

- Use `DataSourceBadge` on any KPI fed by merged data sources
- Use `av-input` for all form fields in operational forms
- Use `PageHeader` + `SectionHeader` for consistent page structure
- Import icons from `lucide-react` (tree-shaken via `optimizePackageImports`)

### Do not

- Introduce new color hex values outside `globals.css` — extend tokens first
- Use inline styles for spacing — use Tailwind utilities on the 8px grid
- Add shadcn components without aligning to existing `av-*` / `enterprise-*` patterns
- Display LIVE data without checking `SourcedResult.source` from the data layer

---

## Related documents

| Document | Topic |
|----------|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Component directory layout |
| [ui-consolidation-inventory.md](./ui-consolidation-inventory.md) | Deprecated shim inventory |
| [README.md](./README.md) | Documentation index |
