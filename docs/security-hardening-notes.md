# Security Hardening Notes

Production hardening audit for AgriVault (`agritrace`). Scope: safe fixes only — no schema, RLS, workflow state, or major UI layout changes.

**Audit date:** 2026-07-02  
**Commit intent:** `chore: production hardening audit`

---

## 1. Security headers (`next.config.mjs`)

### Checked
- Existing headers only covered `/manifest.webmanifest` and `/sw.js` (content-type + cache).
- No global `X-Content-Type-Options`, `Referrer-Policy`, frame protection, or `Permissions-Policy`.

### Fixed
Global headers applied to `/:path*` (and merged into manifest/SW routes):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=(), usb=()` |
| `X-DNS-Prefetch-Control` | `on` |

### Remains
- **Content-Security-Policy** not added — requires Mapbox, Supabase, and inline style audit to avoid breaking maps/PWA.
- **Strict-Transport-Security** deferred — Vercel edge typically sets HSTS; add explicitly if self-hosting.

---

## 2. Secrets & client exposure

### Checked
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (`lib/supabase/admin.ts`, seed scripts, API routes). Not bundled to client.
- `ANTHROPIC_API_KEY` — server-only (`api/ai/chat`). Was leaking config hint in 500 response — **fixed**.
- `NEXT_PUBLIC_*` vars — Supabase anon key, Mapbox token, app URL (expected public).
- Admin system diagnostics masks keys (prefix/suffix + length only) on authenticated admin page.
- `getSupabaseAdminClient` not imported from any `"use client"` component.

### Fixed
- `/api/ai/chat` no longer returns `Missing ANTHROPIC_API_KEY on server.` to clients.
- Workspace preview cookie now `httpOnly: true` (server-read in dashboard layout).

### Remains
- Setup / launch-readiness pages show whether service role is **set** (boolean/length), not the value — acceptable for ops tooling.
- Mapbox token remains public by design (`NEXT_PUBLIC_MAPBOX_TOKEN`).

---

## 3. API input validation & logging

### New utilities
- `src/lib/http/api-security.ts` — clamp strings, bounded integers, body size checks, generic errors, `logApiError`.
- `src/lib/http/rate-limit.ts` — policy headers + stub `checkRateLimit()` for future Redis/KV wiring.

### Routes reviewed (22 total)

| Route | Auth | Validation | Logging |
|-------|------|------------|---------|
| `ops/workflows/*` | ✅ principal | ✅ existing | ✅ message-only server logs |
| `admin/*` | ✅ admin guard | ✅ existing | minimal |
| `ai/chat` | ✅ **added** | ✅ body size + empty message | ✅ dev-only model log |
| `farmers` | ✅ | ✅ bounded limit/county | ✅ generic 500 |
| `registrations` | ✅ | ✅ bounded limit | ✅ generic 500 |
| `production` | ✅ | ✅ bounded limit/season | ✅ generic 500 |
| `analytics` | optional | ✅ **payload size** | ✅ silent 204 on failure |
| `demo-inquiry` | public | ✅ existing + body size | ✅ `logApiError` |
| `workspace-demo-role` | ✅ **added** | ✅ role allowlist | — |
| `ministry-pilot/summary` | optional | returns canonical fallback | — |

### Fixed
- Stopped returning raw Supabase `error.message` from `farmers`, `registrations`, `production`.
- `/api/ai/chat` requires authenticated session; uses **server profile role** (not client `body.role`).
- `/api/workspace-demo-role` POST/DELETE/GET require session.

### Remains
- **Rate limiting not enforced** — `X-RateLimit-Policy` header documents intent; wire `checkRateLimit` to KV before public launch scale.
- `demo-inquiry` remains unauthenticated (public lead form) — consider CAPTCHA or edge rate limit.
- `analytics` accepts unauthenticated events (by design) — size-limited only.

---

## 4. Error boundaries

### Checked
- Root `src/app/error.tsx` existed but swallowed error without logging.
- No dashboard-scoped error boundary.

### Fixed
- `src/app/(dashboard)/error.tsx` — operational messaging, retry, links to command center / activity.
- Root `error.tsx` — `role="alert"`, `aria-live`, client-side `console.error`, digest shown in dev only.

### Remains
- No `global-error.tsx` (App Router root shell errors still fall through to default Next handling).

---

## 5. PWA / service worker

### Checked
- `public/sw.js` unchanged (cache `agrivault-offline-v2`, `/offline` navigation fallback).
- `next.config.mjs` SW headers preserved; security headers merged without altering SW logic.

### Fixed
- None required — behavior unchanged.

---

## 6. Bundle & dead code

### Checked
- No service-role imports in client bundles.
- Workbox packages in `package.json` still unused (pre-existing; not removed in this pass).

### Fixed
- Removed duplicate local validators in `demo-inquiry` (uses shared `api-security`).

### Remains
- ~30 files still import `EnterpriseDataGrid` via deprecated `operations/` shim (bundle-neutral).
- Workbox deps cleanup is a separate chore.

---

## 7. Hydration & accessibility

### Checked
- Field workspace `Date.now()` session id (pre-existing; not changed — layout scope).
- Error boundaries now expose `role="alert"` and `aria-live="assertive"`.

### Remains
- Full a11y audit (focus order, map canvas labels) not in scope.

---

## 8. Performance footguns

### Checked
- AI chat module-level `console.info` on every cold start — moved to **development only**.
- Analytics unbounded payload — capped at 8 KB serialized.

### Remains
- AI chat streams up to 24 messages × 8 KB each (existing cap) — monitor token costs.
- No CDN cache headers on API routes (correct: `no-store` on AI stream).

---

## Validation run

```bash
npm run lint
npm run build
npm run test:workflow
```

---

## Recommended next steps (not in this pass)

1. Add CSP with Mapbox/Supabase allowlists after staging verification.
2. Enforce rate limits on `demo-inquiry`, `ai/chat`, `analytics` via Vercel KV / Upstash.
3. Add `global-error.tsx` for root layout failures.
4. Migrate admin diagnostics table errors to generic labels (currently show `error: …` in admin-only UI).
5. Remove unused Workbox dependencies or adopt generated SW.
