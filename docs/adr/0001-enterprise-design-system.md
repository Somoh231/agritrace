# ADR 0001: Enterprise Design System

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

AgriVault serves Ministry of Agriculture staff across field capture, district review, county coordination, and national command surfaces. The UI must convey institutional authority, support both dark map-first workspaces and light desk reporting views, and remain maintainable without importing a third-party component library that would fight our brand palette.

Early prototypes considered shadcn/ui, but the default neutral palette and Radix dependency tree conflicted with the forest-green and gold Ministry identity. Pilot users also need consistent spacing, typography, and data-provenance affordances (`DataSourceBadge`) across ~102 dashboard pages.

The design system must work with Tailwind CSS 3.4, Next.js App Router, and server/client component boundaries without runtime CSS-in-JS overhead.

---

## Decision

Adopt a **custom enterprise design system** built on CSS custom properties, Tailwind extensions, and React primitives in `src/components/enterprise/`. Do **not** use shadcn/ui or a `components/ui/` directory.

### Surface taxonomy

| Surface | CSS prefix | Context |
|---------|-----------|---------|
| Ministry command (dark) | `cmd-*`, `ministry-*` | Auth screens, map-first views, dark panels |
| Government canvas (light) | `gov-*`, `enterprise-*` | Command center, registries, reporting, admin |
| Application layer | `av-*` | Buttons, inputs, cards shared across surfaces |

### Source of truth

| Layer | File | Role |
|-------|------|------|
| CSS tokens | `src/app/globals.css` | `:root` custom properties, utility classes |
| Tailwind mirror | `tailwind.config.ts` | `forest-*`, enterprise color extensions |
| React token map | `src/components/enterprise/tokens.ts` | Radius, shadow, sidebar/canvas class maps |
| Components | `src/components/enterprise/index.ts` | `PageHeader`, `KpiCard`, `StatusBadge`, `DataSourceBadge`, etc. |

### Key conventions

- **8px grid** — spacing, radius, and padding align to `enterpriseTokens` in `tokens.ts`.
- **Forest palette** — `--color-forest-50` through `--color-forest-900` for brand greens.
- **Ministry dark tokens** — RGB triplets (`--ministry-sidebar`, `--ministry-gold`) for `.cmd-surface` panels.
- **No shadcn** — all primitives are first-party; Lucide icons only for iconography.

---

## Consequences

### Positive

- Full control over Ministry brand colors and dark/light dual surfaces without fighting shadcn defaults.
- Smaller bundle — no Radix primitive tree; `optimizePackageImports` targets `lucide-react` only.
- Tokens are inspectable in DevTools via CSS variables; designers can adjust `globals.css` without touching components.
- `DataSourceBadge` and enterprise primitives are co-located, enforcing data-provenance disclosure by default.

### Negative

- No community component upgrades — every new primitive (date picker, combobox) must be built in-house.
- Onboarding developers familiar with shadcn must learn `cmd-*` / `gov-*` / `av-*` class naming.
- Accessibility patterns (focus traps, aria) are manual rather than inherited from Radix.

### Neutral

- Print styles and layout modes (`src/lib/navigation/layout-mode.ts`) extend the same token set.
- Marketing pages reuse `av-*` buttons while dashboards use surface-specific wrappers.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **shadcn/ui + theme override** | Radix bundle size; neutral defaults require extensive CSS overrides; conflicts with map-dark Ministry panels |
| **Material UI / Ant Design** | Consumer-SaaS aesthetic; heavy runtime; poor fit for government brand |
| **CSS Modules per component** | Duplicates token definitions; harder to share across 100+ pages |
| **Tailwind only (no React primitives)** | Repeated markup; no shared `PageHeader` / badge semantics |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Build vs buy components | Build | Brand and data-provenance requirements exceed generic libraries |
| CSS variables vs JS theme object | CSS variables | SSR-safe; no flash; works in `globals.css` and Tailwind |
| Single vs dual surface system | Dual (`cmd` + `gov`) | Field/map views need dark chrome; desk views need light readability |
| Strict 8px grid vs fluid spacing | 8px grid | Aligns with government reporting density expectations |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — module map, build pipeline
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — color system, typography, component library
- [data-source-inventory.md](../data-source-inventory.md) — `DataSourceBadge` usage surfaces
- Source: `src/app/globals.css`, `src/components/enterprise/tokens.ts`, `tailwind.config.ts`
