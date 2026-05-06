# TEMP DEMO FALLBACK — removal checklist

The app still synthesizes a profile and demo datasets when the database is empty or a profile row is missing. This keeps ministry demos stable.

## Files to revisit before disabling

1. `src/lib/supabase/temp-demo-profile-fallback.ts` — set `TEMP_DEMO_FALLBACK_PROFILE_ENABLED = false` after triggers populate `profiles` for all users.
2. `src/app/(dashboard)/layout.tsx` — remove synthetic profile branch when disabled.
3. `src/app/(dashboard)/admin/layout.tsx` — rely on real `profiles.role` only.
4. API routes under `src/app/api/admin/**` — remove `resolveUserRoleWithDemoFallback` usage where appropriate.
5. `src/components/rice/DataQualityPanel.tsx` — demo profile role bypass.
6. `src/components/cocoa/ApprovalsClient.tsx` — demo profile fallback.
7. `src/components/layout/Sidebar.tsx` — `role === "admin"` TEMP DEMO branches if no longer needed.

## Hybrid data (pilot UI)

National dashboards continue to merge **live Supabase** aggregates with **illustrative** `src/lib/demo/agriculture-pilot-data.ts` when counts are zero — this is intentional demo safety and can remain independent of TEMP DEMO FALLBACK.
