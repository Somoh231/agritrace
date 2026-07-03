# Production readiness

**Date:** 2026-07-03  
**Scope:** AgriVault (`agritrace`) — infrastructure hardening for Vercel/production deployment  
**Commit intent:** `chore: production infrastructure hardening`

---

## Executive summary

This pass adds enforceable HTTP infrastructure (CSP, rate limits, request IDs, structured logging, API validation helpers), optimizes static delivery and bundle imports, removes dead code, and documents remaining launch items including HSTS.

---

## 1. Content Security Policy (CSP)

**Implemented** in `next.config.mjs` on all routes.

| Directive | Allowlist |
|-----------|-----------|
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` (Next.js hydration) |
| `style-src` | `'self' 'unsafe-inline'` |
| `connect-src` | Supabase (`https://*.supabase.co`, `wss://`), Mapbox API/events/tiles |
| `img-src` | `'self'`, `data:`, `blob:`, Mapbox, Supabase storage |
| `worker-src` / `child-src` | `'self' blob:` (Mapbox GL workers) |
| `frame-ancestors` | `'none'` |
| `object-src` | `'none'` |

**Verify on staging:** GIS map room, Supabase auth, PWA service worker, offline queue.

**Future:** Tighten `script-src` with nonces when migrating off inline hydration scripts.

---

## 2. HSTS (HTTP Strict Transport Security)

**Not set in app config** — intentional for Vercel-hosted deployments.

| Environment | Recommendation |
|-------------|----------------|
| **Vercel (default)** | Edge terminates TLS and sends HSTS automatically for custom domains. No app-level header required. |
| **Self-hosted / reverse proxy** | Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` at the load balancer after HTTPS is verified end-to-end. |
| **Preview deployments** | Do not enable preload on `*.vercel.app` preview URLs. |

Document in runbook: confirm HSTS present via `curl -I https://your-domain.com` before go-live.

---

## 3. Rate limiting

**Module:** `src/lib/http/rate-limit.ts`

| Feature | Status |
|---------|--------|
| In-process sliding window | ✅ Enforced per IP / user key |
| Response headers | `X-RateLimit-Limit`, `Remaining`, `Reset`, `Policy` |
| 429 responses | ✅ Via `rejectIfRateLimited()` |

| Route | Policy |
|-------|--------|
| `GET /api/farmers`, `registrations`, `production` | 120/min |
| `POST /api/demo-inquiry` | 10/min (public) |
| `POST /api/ai/chat` | 20/min |

**Scale path:** Replace in-memory `Map` with Vercel KV / Upstash Redis keyed by `clientRateLimitKey()` — interface unchanged.

---

## 4. Request IDs

| Layer | Header | Behavior |
|-------|--------|----------|
| Middleware | `x-request-id` | Propagates incoming ID or generates UUID on every response/redirect |
| API routes | `x-request-id` | Set via `beginApiRequest()` / `apiHeaders()` |

Correlate logs: search structured JSON for `"requestId":"<uuid>"`.

---

## 5. Structured logging

**Module:** `src/lib/http/structured-log.ts`

```json
{"ts":"…","level":"error","event":"api.failure","scope":"api/farmers","requestId":"…","message":"…"}
```

- `logApiError(scope, err, requestId)` wraps failures
- No secrets, stack traces, or raw Supabase messages in client responses

---

## 6. API validation

**Modules:** `api-security.ts`, `api-response.ts`

| Helper | Purpose |
|--------|---------|
| `parseJsonObject()` | Size guard + plain-object validation |
| `clampStr()` / `parseBoundedInt()` | Bounded query/body fields |
| `requestBodyTooLarge()` | Content-Length pre-check |
| `beginApiRequest()` | Request ID + rate limit context |
| `apiJson()` / `apiError()` | Consistent JSON + headers |

**Wired routes:** `farmers`, `registrations`, `production`, `demo-inquiry`, `ai/chat`  
**Existing hardened routes:** `ops/workflows/*`, `admin/*`, `workspace-demo-role`, `analytics`

---

## 7. Cache optimization

| Asset | Header |
|-------|--------|
| `/icons/*` | `public, max-age=31536000, immutable` |
| `/manifest.webmanifest`, `/sw.js` | `must-revalidate` |
| API JSON responses | No cache (default) |
| AI chat stream | `Cache-Control: no-store` |

**Next.js:** `compress: true`, `poweredByHeader: false`

---

## 8. Bundle cleanup

| Change | Impact |
|--------|--------|
| `experimental.optimizePackageImports: ['lucide-react', 'recharts']` | Tree-shakes icon/chart barrels |
| Removed `NationalOperationsDashboard.tsx` | Unused 24KB component (superseded by `NationalOperationsIntelligence`) |

**Review notes:**
- Mapbox loaded via `dynamic(..., { ssr: false })` on GIS surfaces ✅
- Heavy PDF (`@react-pdf/renderer`) server-only in report routes ✅

---

## 9. Image optimization

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
}
```

PWA icons generated at build via `scripts/generate-pwa-icons.mjs`. Most UI uses CSS/SVG; adopt `next/image` when adding marketing photography.

---

## 10. Route performance review

| Tier | Routes | Notes |
|------|--------|-------|
| Static marketing | `/`, `/about`, `/pricing` | Pre-rendered |
| Dashboard (dynamic) | 150 app routes | Auth middleware on protected paths |
| Heavy client | `/gis-intelligence`, `/map` | Mapbox dynamic import, shared React Query caches |
| API | 22 routes | Auth + rate limit on sensitive endpoints |

**Recommendations:**
- Keep React Query keys centralized (`operationalQueryKeys`)
- Prefer `SourcedResult` fetches over ad-hoc Supabase in new pages
- Monitor Vercel function duration on `/api/ai/chat` and PDF report routes

---

## 11. React performance review

| Pattern | Status |
|---------|--------|
| `reactStrictMode: true` | ✅ |
| Memoized GIS derived data | ✅ `useMemo` on GeoJSON builders |
| Verification/transfers hooks | ✅ React Query with typed results |
| Demo-only pages | Static imports acceptable (low traffic) |

**Watch:** Large enterprise grids — virtualize if row counts exceed ~500 live rows.

---

## 12. Database query review

| Query surface | Limit | Index assumption |
|---------------|-------|------------------|
| `GET /api/farmers` | 200 max | `created_at` ordering |
| `GET /api/registrations` | 200 max | plots by `created_at` |
| `GET /api/production` | 500 max | optional `season` filter |
| Ministry data service | 80–100 rows | pilot tables |
| Workflow submissions list | 100 | RLS-scoped |

All list endpoints use explicit `.limit()` — no unbounded scans from public API.

**RLS:** Unchanged — still enforced via Supabase anon + session.

---

## 13. Accessibility review

| Area | Status |
|------|--------|
| Enterprise components | Status badges, alerts use semantic tone |
| Forms | Required fields marked, error banners present |
| GIS map | Mapbox canvas — provide text alternatives in side panels |
| Keyboard | Pilot dashboards use native buttons/links |

**Pre-launch:** Run axe/Lighthouse on `/login`, `/command-center`, `/verification-queue`, `/field/mobile`.

---

## 14. Security headers (retained)

From prior hardening + this pass:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` (camera/mic off, geolocation self)
- `Content-Security-Policy` (new)

See also: `docs/security-hardening-notes.md`

---

## 15. Validation checklist

```bash
npm run lint
npm run build
npm run test:workflow   # includes rate-limit + data-source checks
```

**Manual smoke (staging):**
1. Login → command center loads with LIVE badge
2. GIS map room — tiles render under CSP
3. Demo inquiry form — 11th submit within 1 min returns 429
4. Response headers include `x-request-id` and rate-limit headers

---

## 16. Remaining launch items

1. Wire rate limit store to Redis/KV before high-traffic public launch
2. CAPTCHA on `demo-inquiry` if exposed to open internet
3. CSP report-only monitoring period on staging (optional)
4. Lighthouse performance budget on command center
5. Executive briefing + warehouse detail data-source badges (see `docs/data-source-inventory.md`)

---

## Key files

| File | Role |
|------|------|
| `next.config.mjs` | CSP, cache, image formats, bundle imports |
| `src/middleware.ts` | Auth + request ID propagation |
| `src/lib/http/rate-limit.ts` | Sliding-window limiter |
| `src/lib/http/request-context.ts` | Request ID + client keys |
| `src/lib/http/structured-log.ts` | JSON logging |
| `src/lib/http/api-response.ts` | API handler helpers |
| `src/lib/http/api-security.ts` | Validation primitives |
| `docs/production-readiness.md` | This document |
