# RC1 Architecture Audit

## Scope and topology

The platform is a Next.js App Router application backed by Supabase Auth/PostgreSQL/RLS, server/client Supabase adapters, domain services, a workflow FSM, PWA/offline queues, Mapbox surfaces, and Sentry. The audit enumerated 147 route entries and reviewed the middleware, dashboard/layout guard chain, APIs, migration history, offline/PWA code, reporting/export paths, and operational workspaces.

## Strengths

- App Router route groups and domain folders make operational surfaces discoverable.
- Server-only principals and permission functions exist for workflow/admin/report APIs.
- Supabase RLS provides defense in depth across the main operational schema.
- Workflow status transitions are centralized and unit-tested.
- Data-source badges distinguish live, mixed, demo, and pilot/canonical states on primary command surfaces.
- Build-time route output provides an auditable release inventory.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| ARC-01 | P1 | Missing profile could synthesize an administrator across several entry points | Resolved; profile access now fails closed |
| ARC-02 | P1 | Duplicate role metadata let navigation disagree with middleware | Resolved; navigation also applies canonical route policy |
| ARC-03 | P2 | Workflow status, action ledger, comments, notifications, and audit log span multiple writes without a DB transaction | Open; CAS/compensation reduces risk |
| ARC-04 | P2 | Route policy, navigation metadata, export RBAC, and RLS remain separate representations | Open; consolidate into one capability registry |
| ARC-05 | P2 | Largest files are 892, 753, 743, and 715 lines; workflow submission API is 494 lines | Open; split by domain/use case |
| ARC-06 | P3 | Deprecated design-system wrappers remain across shared, pilot, operations, and workspace folders | Open; migrate incrementally |
| ARC-07 | P3 | Static route inventory cannot prove runtime empty/error/offline states | Documented; browser/E2E annotation required |

## Migration/RLS review

There are 11 ordered SQL migrations and 135 RLS/policy/security-related statements. Core operational tables enable RLS, but several pilot tables intentionally use broad authenticated-read policies. No migration was applied or linked schema inspected, so repository SQL is evidence of intent—not proof of deployed enforcement.

## Recommended next architecture work

1. Add transactional Supabase RPCs for submission and transfer decisions.
2. Generate navigation, middleware rules, API capabilities, and documentation from one typed capability registry.
3. Extract workflow creation, transition persistence, notification, and audit services from the submission route.
4. Split GIS and warehouse workspaces behind lazy boundaries and stable domain adapters.
5. Add a schema-drift job comparing repository migrations to staging/production.

