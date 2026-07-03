# ADR 0006: PWA Strategy for Field Operations

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

CLAN technicians need AgriVault installed on mobile devices as a standalone app for field use. The application must load its shell when connectivity drops, provide a clear offline fallback page, and prompt installation at the primary entry point (login) before users enter protected dashboards.

A full offline-first SPA framework (Workbox strategies, background sync for all assets) would add complexity beyond pilot needs. The PWA layer must complement — not replace — the IndexedDB operational queue documented in ADR 0003.

---

## Decision

Ship AgriVault as an **installable Progressive Web App** with a minimal deterministic service worker, Next.js web manifest, install prompts on login and key workspaces, and a dedicated offline fallback route.

### Service worker

**File:** `public/sw.js`

| Property | Value |
|----------|-------|
| Cache name | `agrivault-offline-v2` |
| Strategy | Network-first for navigations; cache-first for static assets |
| Scope | Same-origin only |
| Offline fallback | `/offline` for failed navigation requests |

Precached core assets: `/`, `/offline`, `/favicon.ico`, `/og.svg`, PWA icons (`/icons/pwa-*.png`).

Registration: `src/components/pwa/PwaRegistrar.tsx` (mounted in root `layout.tsx`).

### Web manifest

**File:** `src/app/manifest.ts`

| Field | Value |
|-------|-------|
| `name` | Agrivault Data |
| `short_name` | Agrivault |
| `display` | standalone |
| `start_url` | `/` |
| `theme_color` | `#0b1220` |
| Icons | 192px, 512px, 512px maskable |

Icons generated at build: `scripts/generate-pwa-icons.mjs`.

### Install prompt surfaces

| Surface | Component | Context |
|---------|-----------|---------|
| Login | `LoginClient.tsx` → `InstallAppButton` | Primary install CTA: "Install for Offline Use" |
| CLAN workspace | `ClanWorkspaceClient.tsx` | Field technician onboarding |
| Topbar | `Topbar.tsx` | Persistent install access |
| Public nav | `PublicNav.tsx` | Marketing site install |

Install flow: `InstallAppButton` → `beforeinstallprompt` capture or `InstallAppGuide` for iOS/manual steps.

### Offline fallback page

**Route:** `/offline`

Rendered when navigation fetch fails and no cached HTML exists. Explains connectivity state and links back to cached routes. Distinct from IndexedDB operational data queue.

### Build integration

```json
"build": "node scripts/generate-pwa-icons.mjs && next build"
```

`next.config.mjs` sets `/sw.js` cache header to `must-revalidate`; `/icons/*` immutable 1 year.

### PWA diagnostics

`PwaDiagnosticsPanel.tsx` and `OfflineReadinessPanel.tsx` expose service worker state and install surface detection for pilot QA.

---

## Consequences

### Positive

- Technicians can install from login without navigating to browser menus.
- App shell loads offline; users see `/offline` instead of browser error page.
- Minimal SW logic is auditable and deterministic — no opaque Workbox config.
- Standalone display mode removes browser chrome for field focus.
- Install CTA co-located with auth reinforces offline capability messaging.

### Negative

- iOS Safari requires manual "Add to Home Screen" — `InstallAppGuide` documents steps.
- Service worker caches HTML shell, not Mapbox tiles or Supabase API responses.
- SW update requires cache bust via version suffix (`agrivault-offline-v2`).
- No push notifications in RC1.

### Neutral

- Operational data offline handled separately via IndexedDB (ADR 0003).
- PWA install optional — web usage remains fully supported.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Native Capacitor wrapper** | App store friction; longer pilot timeline |
| **Workbox with precache manifest** | Opaque generated config; harder to audit for government deploy |
| **No service worker (install only)** | Shell fails offline; poor field UX on connectivity loss |
| **Cache-all strategy** | Stale API responses; security risk for authenticated pages |
| **Install prompt only in settings** | Field users never discover install path |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Minimal SW vs full offline app shell | Minimal SW + IndexedDB data | Separation of concerns |
| Login install CTA vs post-auth only | Login + workspaces | Maximum visibility for field staff |
| Network-first nav vs cache-first | Network-first with offline fallback | Fresh content when online; graceful degrade |
| Auto-update SW vs user prompt | `skipWaiting` + `clients.claim` | Faster SW activation for pilot fixes |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — PWA in client diagram, build pipeline
- [OFFLINE_ARCHITECTURE.md](../OFFLINE_ARCHITECTURE.md) — PWA architecture section
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) — build and cache headers
- ADR [0003](./0003-offline-first.md) — IndexedDB operational queue
- ADR [0001](./0001-enterprise-design-system.md) — install button styling
- Source: `public/sw.js`, `src/app/manifest.ts`, `src/components/pwa/`, `src/app/(auth)/login/LoginClient.tsx`
