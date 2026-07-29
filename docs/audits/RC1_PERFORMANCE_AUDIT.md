# RC1 Performance Audit

## Build evidence

Next.js 15.5.21 compiled successfully in 6.7 seconds in the continuation build and generated 134 static-page steps. Shared first-load JavaScript is 103 kB and middleware is 171 kB.

A second production build with a non-secret test Sentry DSN also passed. That configuration increased shared first-load JavaScript to 191 kB and middleware to 177 kB; `/command-center` increased from 306 kB to 394 kB. Sentry also emitted deprecation warnings for `disableLogger`, `automaticVercelMonitors`, and `sentry.client.config.ts`.

## Largest route payloads

| Route | First-load JS |
| --- | ---: |
| `/district-dashboard` | 343 kB |
| `/county-dashboard` | 339 kB |
| `/farmers` | 325 kB |
| `/gis-intelligence` | 323 kB |
| `/transfers` | 318 kB |
| `/inventory` | 317 kB |
| `/national-operations` | 315 kB |
| `/reporting/workspace` | 315 kB |
| `/command-center` | 306 kB |

## Findings

- Next 15 increased shared/runtime payload relative to the baseline Next 14 build.
- GIS, chart, reporting, and enterprise-table dependencies converge on several operational routes.
- Source modules above 700 lines correlate with broad client bundles and expensive change surfaces.
- The build emitted a webpack warning about serializing a 216 kB string into the cache.
- Enabling Sentry materially increases the current client payload and requires bundle/configuration tuning before production.
- No Lighthouse/Web Vitals run was available from a staged production-equivalent deployment.
- Vercel Preview build logs report a 216 KiB webpack cache string warning.
- Vercel is configured for Node 24.x, but the package `20.x` engine overrides it;
  Vercel warns Node 20.x will be unsupported after 2026-10-01. Local validation
  used Node 22.23.1 and emitted an engine mismatch warning.

## Recommendations

1. Lazy-load Mapbox, Turf, Recharts, PDF, and advanced tables below the first operational viewport.
2. Split dashboard data/visualization tabs into route-level or dynamic client boundaries.
3. Establish route budgets: 200 kB ordinary workspace, 275 kB map/analytics exception.
4. Add Vercel Web Analytics or equivalent field metrics with privacy review.
5. Run Lighthouse on staged mobile/desktop builds and track LCP, INP, CLS, and total blocking time.
6. Migrate deprecated Sentry settings, move client initialization to `instrumentation-client.ts`, and measure/trim the 88 kB shared-JS delta.
7. Validate Node 24 with the current dependency graph, then align `engines` and
   Vercel runtime settings before the platform deadline.

## Staging limitation

Preview Lighthouse, LCP, CLS, INP/TBT, Sentry request overhead, and Mapbox network
cost were not measured because the interactive browser is blocked by Vercel
Deployment Protection. CLI response status is not performance evidence. No
speculative bundle rewrite was made.

## Controlled-pilot continuation

Authenticated Lighthouse remains blocked by the missing Preview bypass and QA
accounts. No performance rewrite was justified. The normal production build
continues at 103 kB shared first-load JS and 171 kB middleware; the measured
Sentry and Node-runtime follow-ups remain open.
