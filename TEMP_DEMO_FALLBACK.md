# TEMP DEMO FALLBACK

Synthetic behaviour keeps demos usable when Supabase Auth exists but **`profiles`** rows are missing, partially seeded, or RLS hides rows during onboarding.

## Where it lives

- **`src/lib/supabase/temp-demo-profile-fallback.ts`** — builds a synthetic `Profile` and resolves role (`admin`) when no DB profile exists.
- **Dashboard layout** — substitutes `effectiveProfile` so deactivated guards still apply where configured.
- **Sidebar / admin APIs** — `isAdminConsoleRole()` allows ministry-console routes alongside TEMP DEMO `admin`.

Hybrid data loaders should continue to prefer live rows and fall back to **`src/lib/demo/*`** only when tables are empty or requests fail (no fatal UI).

## How to remove later

1. Ensure **`handle_new_user`** trigger runs on every new **`auth.users`** row (see migration `20260207101000_auth_trigger_and_rls.sql`).
2. Backfill **`profiles`** for any legacy Auth users (`INSERT … FROM auth.users` where missing).
3. Replace **`resolveUserRoleWithDemoFallback`** usages with strict **`profile.role`** (fail closed → redirect or **403**).
4. Remove **`buildDemoProfileForAuthUser`** and synthetic **`admin`** role from **`Dashboard`** layout (require real **`profiles`** row).
5. Tighten **`isAdminConsoleRole`** to production ministry roles only (drop **`admin`** unless you keep it for service accounts).
6. Re-test **`middleware`** protected routes, **`/admin/*`**, and pilot dashboards.
