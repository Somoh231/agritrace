# Security & Release Checklist

**Pilot:** AgriVault (Liberia Ministry of Agriculture)  
**Related:** [OBSERVABILITY.md](./OBSERVABILITY.md) · [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md) · [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Use this checklist before every production promotion and after security-hardening changes.

---

## Pre-release — environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (middleware auth active)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` server-only (not `NEXT_PUBLIC_*`)
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` domain-restricted in Mapbox dashboard
- [ ] `ANTHROPIC_API_KEY` set if AI chat enabled
- [ ] **Sentry:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (build)
- [ ] **Rate limiting (production):** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or Vercel KV equivalents)
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain

---

## Pre-release — security

- [ ] `npm run lint` passes
- [ ] `npm run build` passes (Sentry wrap optional without DSN)
- [ ] `npm run test:workflow` passes (includes security unit checks)
- [ ] `npm audit` reviewed — no unmitigated critical in production deps
- [ ] PDF/export routes return **401** without session:
  - `/api/reports/compliance-oversight`
  - `/api/reports/donor-programme`
  - `/api/reports/rice`
  - `/api/reports/dds`
  - `/api/reports/executive-briefing`
- [ ] Wrong role returns **403** on export routes (not 200 with empty data)
- [ ] Admin APIs require admin console role
- [ ] CSP: no new violations on login, maps, PWA install, Sentry ingest
- [ ] Service worker still registers (`/sw.js` or configured path)
- [ ] Demo inquiry 11th request in 1 min → **429** with `X-RateLimit-*`

---

## Pre-release — observability

- [ ] Sentry receiving events from staging/preview deploy
- [ ] Release tagged with git SHA in Sentry
- [ ] `GET /api/health` returns 200 with `"status":"ok"`
- [ ] Uptime monitor configured (Better Stack / UptimeRobot / Sentry)
- [ ] Request ID visible on API responses (`x-request-id`)

---

## Pre-release — data & ops

- [ ] Supabase daily backups enabled (Pro plan or manual export schedule)
- [ ] RLS policies verified: `rowsecurity = true` on public tables
- [ ] Storage bucket policies reviewed
- [ ] [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) drill scheduled
- [ ] Demo account passwords rotated or demo mode disabled for production

---

## Post-release — smoke (15 min)

- [ ] Login as ministry, field, donor roles
- [ ] Open command center map (Mapbox tiles load)
- [ ] Submit test workflow item (field → verification)
- [ ] Generate one authorized PDF export
- [ ] Offline indicator / PWA still functional on mobile
- [ ] Check Sentry for new errors in first 15 minutes

---

## Rollback criteria

Rollback immediately if:

- Auth bypass (unauthenticated access to protected routes)
- Cross-role data leak in API or export
- Health check down > 5 minutes
- Sentry flood indicating data corruption or mass 500s

**Rollback:** Vercel → Deployments → promote previous production deployment. Do not revert database without incident commander approval.

---

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Engineering | | | |
| Security | | | |
| Release manager | | | |
| Ministry pilot lead | | | |
