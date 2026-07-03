# Backup & Restore Operations

**AgriVault — Supabase backend**

**Related:** [DATABASE.md](./DATABASE.md) · [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md)

> **Do not** run destructive restore operations in production without incident commander approval and a written recovery plan.

---

## Backup verification

### Supabase automated backups

1. Supabase Dashboard → **Project Settings** → **Database** → **Backups**
2. Confirm daily backups enabled (plan-dependent)
3. Note retention period and last successful backup timestamp
4. Monthly: record backup date in pilot ops log

### Manual logical export (recommended before major releases)

```bash
# From machine with Supabase CLI linked to project
supabase db dump --linked -f agritrace-backup-$(date +%Y%m%d).sql
```

Store encrypted offline (ministry-approved storage). **Never** commit dumps to git.

### RLS policy backup

```bash
supabase db dump --linked --schema public --data-only=false -f rls-schema-$(date +%Y%m%d).sql
```

Or export policies via SQL:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Save query output with each release tag.

### Storage bucket inventory

1. Dashboard → **Storage** → list buckets and public/private flags
2. Document bucket names: evidence uploads, exports, static assets
3. For critical buckets: periodic `supabase storage` CLI sync to encrypted archive (pilot optional)

### Environment variable recovery

Maintain encrypted offline copy of Vercel env var **names** and rotation dates (not values in plaintext email):

- `NEXT_PUBLIC_SUPABASE_*`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- `UPSTASH_REDIS_REST_*` or `KV_REST_API_*`

Vercel → Settings → Environment Variables → export procedure per org policy.

---

## Restore drill (staging only)

**Frequency:** Quarterly or before pilot phase transitions.

1. Create **new** Supabase staging project (never drill on production first)
2. Restore latest backup or run `psql` with dump file
3. Apply migrations if dump is schema-only
4. Verify RLS: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
5. Point staging Vercel env to restored project
6. Run smoke: login, read farmers, one workflow read
7. Record drill duration and gaps in ops log

**Success criteria:** RLS enabled on all operational tables; no cross-county leak in spot checks.

---

## Production restore timeline (reference)

| Phase | Action | Target |
|-------|--------|--------|
| T+0 | Incident declared; stop writes if corruption suspected | 15 min |
| T+15 | IC approves restore; identify backup point-in-time | 30 min |
| T+30 | New Supabase instance or PITR restore (if available) | 1–2 hr |
| T+2h | RLS + storage policies verified | 2.5 hr |
| T+2.5h | Vercel env pointed to restored DB | 3 hr |
| T+3h | Smoke tests + ministry sign-off | 4 hr |
| T+24h | Postmortem scheduled | — |

Adjust for Supabase plan (PITR on Pro+).

---

## Storage bucket recovery

1. Identify affected bucket and object prefix
2. If accidental delete: Supabase may not undelete — restore from offline archive
3. Re-link storage policies in SQL migrations under `supabase/migrations/`
4. Verify signed URL flows in app (evidence upload paths)

---

## What backups do not cover

- Vercel deployment artifacts (rebuild from git)
- Mapbox tile cache
- In-memory / Redis rate limit counters
- Sentry event history

---

## Incident recovery coordination

For live incidents, follow [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md) before executing restore.
