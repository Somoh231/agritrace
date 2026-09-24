# TEMP DEMO FALLBACK — removed

The synthetic-admin profile fallback this file described
(`temp-demo-profile-fallback.ts`, `buildDemoProfileForAuthUser`) no longer exists.
Authentication now fails closed: a signed-in identity without a complete, active
workforce profile and explicit role assignment cannot open any operational route
(see `src/lib/auth/access-readiness.ts`).

Illustrative / fixture data is governed by `src/lib/data/illustrative-policy.ts`:
it is **off** unless `NEXT_PUBLIC_ILLUSTRATIVE_DATA=enabled` is set for a training
environment. Never set it on a deployment that real operators use.
