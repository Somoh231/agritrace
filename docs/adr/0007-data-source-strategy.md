# ADR 0007: Data Source Disclosure Strategy

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

AgriVault surfaces blend data from four distinct origins: live Supabase operational tables, Ministry pilot fixtures, device-local offline queues, and illustrative demo datasets for training. During the RC1 pilot, not every dashboard has live data in every county. Presenting demo or fixture numbers without disclosure would undermine trust with government stakeholders and violate product principle #2: data provenance.

Silent fallback (showing demo data while appearing live) was explicitly rejected during the data-source inventory audit (2026-07-03).

---

## Decision

Implement a **unified data-source taxonomy** with typed `SourcedResult<T>` wrappers, visible `DataSourceBadge` on every blended surface, and explicit `source.detail` strings explaining fallback paths. **No silent fallback.**

### Four source kinds

| Kind | Badge | Meaning |
|------|-------|---------|
| `live` | LIVE | Operational Supabase tables scoped by RLS |
| `pilot` | PILOT | Ministry pilot tables or CSV canonical fixtures |
| `offline` | OFFLINE | IndexedDB / localStorage queues pending sync |
| `demo` | DEMO | Illustrative national figures for training |

### Core module

**File:** `src/lib/data/data-source.ts`

```typescript
type SourcedResult<T> = { data: T; source: DataSourceMeta };

function sourced<T>(data: T, source: DataSourceMeta): SourcedResult<T>
function resolveDisplaySource(sources: DataSourceMeta[]): DataSourceMeta
```

Disclosure priority when merging: `live` < `offline` < `pilot` < `demo` — the most conservative (most disclosure-worthy) kind wins the page badge.

### UI component

**File:** `src/components/enterprise/DataSourceBadge.tsx`

- Renders kind label with color-coded tone
- `DataSourceNotice` banner for mixed-source pages
- Exported via `src/components/enterprise/index.ts`

### Service layer pattern

Every data fetch that may fall back returns `SourcedResult`:

| Service | Fallback behavior |
|---------|-------------------|
| `ministry-data-service.ts` | Live table → `MINISTRY_*` canonical arrays; sets `pilot` source |
| `transfer-repository.ts` | Remote + localStorage + TRF fixtures; `resolveDisplaySource` |
| `verification-repository.ts` | Live submissions + VRF fixtures; explicit merge disclosure |
| `fetchNationalMovementTimelineSourced` | Movements → pilot fixtures when empty |

### Rule: no silent fallback

When live data is unavailable, `source.detail` MUST explain the path:

```typescript
pilotSource("Live submissions unavailable → canonical VRF fixtures only")
```

Consumers must render `DataSourceBadge` from `result.source` — never assume `live`.

### Demo-only surfaces

Some pages always show `demo` kind (documented in [data-source-inventory.md](../data-source-inventory.md)):

- `FoodSecurityClient`, `InventoryOperationsClient`
- `CountyOperationsClient`, `FieldAgentsClient`, `ReportsCenterClient`

These still display the DEMO badge.

---

## Consequences

### Positive

- Government reviewers immediately see whether KPIs are live, pilot, or illustrative.
- Typed `SourcedResult` makes undisclosed data paths a TypeScript smell at call sites.
- Mixed-source pages (verification queue, transfers) show conservative badge via `resolveDisplaySource`.
- Audit trail in code — every fallback sets explicit `detail` string.

### Negative

- Additional boilerplate: every repository must wrap results and pass source to UI.
- Badges add visual noise on demo-heavy training surfaces.
- Developers must choose correct kind; no runtime enforcement beyond code review.
- Some surfaces still blend demo KPIs with live counts (disclosed, but complex).

### Neutral

- `DataSourceBadge` styling follows enterprise design tokens (ADR 0001).
- Product principle documented in [product/PRODUCT_PRINCIPLES.md](../product/PRODUCT_PRINCIPLES.md).

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Silent fallback to demo/fixtures** | Violates trust; failed pilot QA criteria |
| **Separate demo app** | Duplicates UI; confuses training vs production |
| **Tooltips only (no badge)** | Easy to miss; insufficient for government review |
| **Server header `X-Data-Source`** | Not visible to end users |
| **Hide pages without live data** | Blocks training and pilot walkthroughs |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Badge on every page vs selective | Every blended/mixed page | Consistent provenance standard |
| Conservative merge priority | demo > pilot > offline > live display | Worst-case disclosure wins |
| Typed wrapper vs convention | `SourcedResult<T>` type | Compiler-assisted compliance |
| Fallback allowed vs fail closed | Fallback with disclosure | Pilot needs fixtures; must be visible |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — data source taxonomy in data flow
- [data-source-inventory.md](../data-source-inventory.md) — full surface inventory
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — data provenance design principle
- [product/PRODUCT_PRINCIPLES.md](../product/PRODUCT_PRINCIPLES.md) — provenance principle
- ADR [0001](./0001-enterprise-design-system.md) — `DataSourceBadge` component
- ADR [0010](./0010-verification-architecture.md) — verification queue merge
- Source: `src/lib/data/data-source.ts`, `src/components/enterprise/DataSourceBadge.tsx`
