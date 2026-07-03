# ADR 0004: Mapbox GIS Architecture

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

AgriVault requires interactive maps for GPS boundary capture, operational plot overlays, national heat maps, and GIS intelligence workspaces. Field technicians walk farm perimeters; county and national staff review geospatial evidence in approval queues. Maps must default to Liberia's geographic extent and integrate with the offline boundary sync pipeline.

Map rendering libraries depend on browser APIs (`window`, WebGL, web workers) incompatible with Next.js server-side rendering. Content Security Policy must allow Mapbox tile and telemetry endpoints without weakening overall security posture.

---

## Decision

Standardize on **Mapbox GL JS** via `react-map-gl` with a shared configuration layer, dynamic client-only imports, Turf.js geometry utilities, and explicit CSP allowlisting.

### Configuration layer

**File:** `src/lib/mapbox/config.ts`

| Export | Purpose |
|--------|---------|
| `LIBERIA_CENTER` | `{ longitude: -9.4295, latitude: 6.4281 }` |
| `LIBERIA_ZOOM` | `6.5` (national default) |
| `mapboxToken()` | Throws if `NEXT_PUBLIC_MAPBOX_TOKEN` missing — production maps |
| `optionalMapboxToken()` | Returns `null` — graceful degradation UI |

### Environment variable

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

Token is public by Mapbox design; scoped via Mapbox dashboard URL restrictions.

### SSR strategy

All Mapbox components use Next.js dynamic import with `{ ssr: false }`:

```typescript
const MapComponent = dynamic(() => import("./MapView"), { ssr: false });
```

Mapbox GL cannot render on the server. Components show a token-missing or loading state rather than crashing.

### Geometry processing

**File:** `src/lib/gis/operational-boundary-math.ts`

| Library | Usage |
|---------|-------|
| `@turf/area` | Hectare calculation from captured polygon |
| `@turf/centroid` | Plot center for map focus |

Boundary capture flow: device Geolocation API → point array → Turf polygon → queue to IndexedDB → sync-batch upsert.

### Component map

| Component | Route |
|-----------|-------|
| `BoundaryCaptureStandalone` | `/field/boundary-capture` |
| `MapOperationalWorkspace` | `/map` |
| `NationalHeatMapWorkspace` | `/national-heat-map` |
| `GisIntelligenceWorkspace` | `/gis-intelligence` |

### Content Security Policy

Configured in `next.config.mjs`:

| Directive | Allowed origins |
|-----------|----------------|
| `connect-src` | `https://api.mapbox.com`, `https://events.mapbox.com`, `https://*.tiles.mapbox.com` |
| `img-src` | `https://*.mapbox.com` |
| `worker-src` | `'self' blob:` |
| `child-src` | `'self' blob:` |

### Access control

GIS routes gated via `src/lib/auth/workspace-access.ts`:

- `canAccessPilotPrimaryGis()` — CLAN, DAO, CAC, Ministry
- `canAccessAdvancedGisIntelligence()` — Ministry + CAC only
- `canAccessNationalHeatMap()` — excludes donor/auditor roles

Map layout mode (`layout-mode.ts`) provides full-bleed chrome for `/field/boundary-capture` and `/gis-intelligence`.

---

## Consequences

### Positive

- Single map provider reduces licensing and integration complexity.
- Dynamic import prevents SSR hydration errors across all map surfaces.
- Turf.js keeps geometry math server-portable for future API-side validation.
- Token-missing state allows development without Mapbox account.
- CSP allowlist is explicit and auditable in `next.config.mjs`.

### Negative

- Mapbox usage incurs API costs at scale; token must be rotated and URL-restricted.
- `NEXT_PUBLIC_` prefix exposes token in client bundle (Mapbox standard; not a secret key).
- No offline tile caching in RC1 — maps require connectivity except cached shell.
- Advanced GIS limited to Ministry/CAC — field agents cannot access intelligence workspace.

### Neutral

- County geo boundaries loaded from static GeoJSON/canonical fixtures where live data unavailable.
- Map components share enterprise dark tokens (`cmd-*`) for panel overlays.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Leaflet + OpenStreetMap** | Weaker GL performance for heat layers; less consistent styling API |
| **Google Maps** | Licensing cost; CSP complexity; less control over Liberia-specific styling |
| **MapLibre (OSS fork)** | Viable long-term; Mapbox GL chosen for RC1 ecosystem and react-map-gl maturity |
| **Server-rendered static map images** | Insufficient for interactive boundary capture |
| **Embed Mapbox without CSP updates** | Browser blocks tile requests; silent map failures |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Mapbox GL vs MapLibre | Mapbox GL | react-map-gl integration; team familiarity |
| Strict token throw vs silent fail | Both (`mapboxToken` / `optionalMapboxToken`) | Production requires token; dev/marketing can degrade |
| Client-only vs iframe isolation | Client-only dynamic import | Tighter UX integration with dashboard shell |
| Turf client-side vs PostGIS | Turf client-side | Matches offline capture; PostGIS deferred to post-pilot |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — external integrations, module map
- [GIS_ARCHITECTURE.md](../GIS_ARCHITECTURE.md) — component map, boundary flow, performance
- [SECURITY.md](../SECURITY.md) — CSP directives
- [OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) — boundary sync after capture
- ADR [0003](./0003-offline-first.md) — plot queue and sync-batch
- ADR [0008](./0008-role-based-security.md) — GIS route access
- Source: `src/lib/mapbox/config.ts`, `src/lib/gis/operational-boundary-math.ts`, `next.config.mjs`
