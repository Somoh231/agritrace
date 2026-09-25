# ADR 0005: Supabase as Data Platform

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** AgriVault engineering team

---

## Context

AgriVault needs a managed PostgreSQL database with authentication, row-level authorization, real-time capability, and Edge Functions for offline sync — deployable on Ministry infrastructure timelines without a dedicated DBA team. The platform must support 11 ordered schema migrations, TypeScript type generation, and SSR cookie-based sessions for Next.js 14.

Self-hosted PostgreSQL plus custom auth would increase operational burden. Firebase/Firestore lacks relational integrity for workflow audit trails and county-scoped joins across farmers, plots, and inventory.

---

## Decision

Adopt **Supabase** as the sole data platform: PostgreSQL with Row Level Security (RLS), Supabase Auth, anon client for browser/server reads, service role restricted to server-only paths, and versioned SQL migrations.

### Client architecture

| Client | File | Key | Usage |
|--------|------|-----|-------|
| Browser anon | `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components; session JWT attached |
| Server anon | `src/lib/supabase/server.ts` | Anon key + cookies | RSC, API routes, middleware |
| Service role | Server/Edge only | `SUPABASE_SERVICE_ROLE_KEY` | `sync-batch`, admin seeds — **never browser** |

Session managed via `@supabase/ssr` cookie refresh in `src/middleware.ts`.

### Authentication

- Supabase Auth handles signup/login; `handle_new_user()` trigger creates `profiles` row.
- Middleware calls `supabase.auth.getUser()` on every request; unauthenticated users redirect to `/login?redirectTo=...`.
- Profile role loaded from `profiles.role`; a missing or deactivated profile is denied (no fallback role).

### Row Level Security

All operational tables enforce RLS. Helper functions in migrations:

- `profile_role()` — current user's role from JWT
- `profile_county()` — county scope for DAO/CAC isolation

Policies defined across migrations, notably:

- `20260207101000_auth_trigger_and_rls.sql` — core policies
- `20260508180000_dao_workflow_rls.sql` — DAO field roles
- `20260619120000_workflow_engine.sql` — workflow tables

### Migration strategy

**Directory:** `supabase/migrations/` (11 ordered files)

Apply via:

```bash
supabase db push
```

Legacy bootstrap path documented in [DATABASE.md](../DATABASE.md) for SQL editor manual runs.

### TypeScript types

Generated/hand-maintained in `src/lib/supabase/types.ts`. Updated when migrations add tables or enums.

### Edge Functions

| Function | Path | Role |
|----------|------|------|
| `sync-batch` | `supabase/functions/sync-batch/` | Service-role upsert for offline queue |

---

## Consequences

### Positive

- RLS provides defense-in-depth even if application permission checks are bypassed.
- Single vendor for auth, database, and Edge Functions reduces integration surface.
- Ordered migrations enable reproducible environments (dev, pilot, production).
- `@supabase/ssr` integrates cleanly with Next.js middleware and cookie sessions.
- PostgreSQL supports workflow audit joins, county filters, and GIS-adjacent geometry columns.

### Negative

- Vendor lock-in to Supabase hosting model; self-hosting adds ops complexity.
- RLS policies are SQL-heavy; debugging requires Supabase logs or local `supabase start`.
- Service role key leakage would bypass all RLS — strict server-only enforcement required.
- Middleware skips auth entirely if Supabase env vars unset (dev convenience; dangerous in production).

### Neutral

- Storage bucket available but not primary for RC1 operational data.
- Real-time subscriptions not used in RC1; React Query handles client cache.

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| **Self-hosted PostgreSQL + NextAuth** | Higher ops burden; no built-in RLS helpers; slower pilot delivery |
| **Firebase Firestore** | Weak relational model; poor fit for workflow audit and county joins |
| **PlanetScale / serverless MySQL** | No native RLS equivalent; would require app-only authorization |
| **Hasura + PostgreSQL** | Additional GraphQL layer; team prefers direct Supabase client |
| **Prisma + managed Postgres** | Adds ORM layer; RLS still requires raw SQL policies |

---

## Tradeoffs

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| RLS vs app-only auth | RLS + app layers | Defense in depth for government data |
| Anon key in browser vs proxy all reads | Anon + JWT | Standard Supabase pattern; RLS scopes data |
| Migrations vs schema.sql only | Migrations primary | Reproducible incremental deploys |
| Edge Functions vs Next.js API for sync | Edge Function | Service-role isolation; closer to database |

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — deployment topology, data flow
- [DATABASE.md](../DATABASE.md) — migration history, enums, core tables
- [SECURITY.md](../SECURITY.md) — auth flow, service role usage, known gaps
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) — environment variables
- ADR [0003](./0003-offline-first.md) — sync-batch Edge Function
- ADR [0008](./0008-role-based-security.md) — four-layer authorization
- Source: `src/lib/supabase/`, `supabase/migrations/`, `src/middleware.ts`
