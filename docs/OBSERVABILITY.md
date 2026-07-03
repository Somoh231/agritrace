# AgriVault Observability

**Related:** [SECURITY.md](./SECURITY.md) · [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) · [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md)

---

## Overview

AgriVault uses **Sentry** for error and performance monitoring, **structured HTTP logging** with **request IDs** for correlation, and a **health API** for uptime probes.

| Signal | Tool | Where |
|--------|------|--------|
| Client errors | Sentry | `sentry.client.config.ts` |
| Server / API errors | Sentry | `sentry.server.config.ts`, `instrumentation.ts` |
| Edge middleware errors | Sentry | `sentry.edge.config.ts` |
| Route transition / root errors | Sentry | `global-error.tsx`, `onRequestError` |
| Performance traces | Sentry | `tracesSampleRate` in Sentry configs |
| Request correlation | App | `x-request-id` header (`request-context.ts`) |
| Uptime | External monitor | `GET /api/health` |

---

## Sentry setup

### Install

`@sentry/nextjs` is installed. Config files:

- `sentry.client.config.ts` — browser SDK
- `sentry.server.config.ts` — Node.js server
- `sentry.edge.config.ts` — Edge runtime
- `src/instrumentation.ts` — loads server/edge SDK; `onRequestError` tags events with request ID

`next.config.mjs` wraps the app with `withSentryConfig` when `NEXT_PUBLIC_SENTRY_DSN` is set. Source maps upload requires build-time auth token (CI/Vercel only).

### Environment variables

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + build | Recommended | Public DSN — safe in browser |
| `SENTRY_DSN` | Server | Optional | Server DSN if different from public |
| `SENTRY_AUTH_TOKEN` | Build / CI | For source maps | Sentry auth token — **never** client-side |
| `SENTRY_ORG` | Build / CI | For source maps | Sentry organization slug |
| `SENTRY_PROJECT` | Build / CI | For source maps | Sentry project slug |
| `SENTRY_ENVIRONMENT` | Server + client | Recommended | e.g. `production`, `preview`, `development` |
| `SENTRY_RELEASE` | Server + client | Optional | Defaults to `VERCEL_GIT_COMMIT_SHA` when on Vercel |
| `SENTRY_TRACES_SAMPLE_RATE` | Server + client | Optional | `0.0`–`1.0`; default `0.1` in production |

When DSN is unset, Sentry is disabled — local dev works without credentials.

### Tunnel route

Client events may be sent via `/monitoring` (Sentry tunnel) to reduce ad-blocker impact. CSP `connect-src` includes `*.ingest.sentry.io` and regional ingest hosts.

### Request ID correlation

Every API response should include `x-request-id`. Sentry `onRequestError` and server logs attach the same ID when available. Support workflow:

1. User reports issue with timestamp + screen
2. Find `x-request-id` in browser Network tab or Vercel logs
3. Search Sentry issues / Vercel function logs by request ID

---

## Structured logging

**File:** `src/lib/http/structured-log.ts`

Server-side API failures use `logApiFailure(scope, error, requestId)` — logs JSON to stdout without leaking secrets to clients.

---

## Health checks

### API — `GET /api/health`

Returns JSON (no secrets):

```json
{
  "status": "ok",
  "checks": {
    "app": "ok",
    "supabase_config": "ok",
    "supabase_reachable": "ok",
    "mapbox_config": "ok"
  },
  "environment": "production"
}
```

- `200` when healthy; `503` when critical dependency misconfigured
- Includes `x-request-id`
- Safe for public uptime monitors (no auth required)

### HTML — `/health`

Human-readable env checklist for operators (existing page).

---

## External uptime monitoring

Configure one or more:

### Sentry Cron / Uptime Monitors

1. Sentry → **Alerts** → **Uptime Monitoring**
2. URL: `https://<your-domain>/api/health`
3. Interval: 1–5 minutes
4. Alert on non-200 or body `status !== "ok"`

### Better Stack (formerly Better Uptime)

1. Create HTTP monitor → `GET https://<domain>/api/health`
2. Expected status: 200
3. Keyword check: `"status":"ok"`
4. Alert channel: email + Slack

### UptimeRobot

1. Monitor type: HTTP(s)
2. URL: `https://<domain>/api/health`
3. Alert when down 2+ consecutive checks

### Vercel

- **Deployment checks:** enable in project settings for failed builds
- **Observability:** function error rate in Vercel dashboard complements Sentry

---

## Alert routing (pilot)

| Severity | Trigger | Route to |
|----------|---------|----------|
| SEV-1 | Health check down 5+ min | On-call engineer + ministry liaison |
| SEV-2 | Sentry error spike (>10/min new issues) | Engineering lead |
| SEV-3 | Elevated 429 on auth/export routes | Review rate limits / abuse |
| SEV-4 | Single user-reported UI bug | Backlog |

Configure Sentry alert rules: new issues in `production`, regression, and performance P95 regression on key transactions.

---

## Release metadata

Set in Vercel:

- `SENTRY_ENVIRONMENT=production`
- `SENTRY_RELEASE` auto from `VERCEL_GIT_COMMIT_SHA`

Verify in Sentry → Releases that each deploy is tagged.

---

## What is not logged to clients

- Stack traces
- Supabase internal errors
- Service role keys
- Raw Anthropic responses on failure

See [SECURITY.md](./SECURITY.md) for API error policy.
