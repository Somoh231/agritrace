# AgriVault Engineering Documentation

Technical reference for maintaining, extending, and operating the AgriVault (`agritrace`) platform.

**Version:** 0.1.0-rc1 · **Stack:** Next.js 14 · Supabase · Mapbox · IndexedDB PWA

---

## Documentation index

### Engineering reference (start here)

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, request flow, module layout, data flow |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | CSS tokens, component primitives, typography, layout patterns |
| [DATABASE.md](./DATABASE.md) | Schema, migrations, RLS, enums, key tables |
| [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md) | Approval chain, status model, API, submission bridge |
| [OFFLINE_ARCHITECTURE.md](./OFFLINE_ARCHITECTURE.md) | IndexedDB, sync queue, Edge Function, PWA |
| [GIS_ARCHITECTURE.md](./GIS_ARCHITECTURE.md) | Mapbox, boundary capture, Turf geometry |
| [SECURITY.md](./SECURITY.md) | Auth, authorization, CSP, rate limits, RLS |
| [API_GUIDE.md](./API_GUIDE.md) | All API routes, request/response formats |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Environment, build, seed, smoke tests |

### Architecture and platform

### Release and pilot

| Document | Description |
|----------|-------------|
| [RELEASE_NOTES_RC1.md](./RELEASE_NOTES_RC1.md) | RC1 verification and readiness scores |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Accepted RC1 constraints |
| [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) | Deferred engineering items |
| [ROADMAP_POST_PILOT.md](./ROADMAP_POST_PILOT.md) | Post-pilot phases |

### Role guides (pilot operators)

| Document | Audience |
|----------|----------|
| [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) | Administrators |
| [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) | Field technicians |
| [DAO_GUIDE.md](./DAO_GUIDE.md) | District officers |
| [CAC_GUIDE.md](./CAC_GUIDE.md) | County coordinators |
| [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) | Ministry staff |

### Audits and inventories

| Document | Purpose |
|----------|---------|
| [workflow-completeness-audit.md](./workflow-completeness-audit.md) | Form → submission wiring |
| [data-source-inventory.md](./data-source-inventory.md) | LIVE / PILOT / OFFLINE / DEMO |
| [production-readiness.md](./production-readiness.md) | HTTP infrastructure |
| [pilot-readiness-qa.md](./pilot-readiness-qa.md) | QA route inventory |
| [security-hardening-notes.md](./security-hardening-notes.md) | API security audit |

---

## Quick start for engineers

```bash
cd agritrace
npm install
cp .env.example .env.local   # configure Supabase + Mapbox
npm run dev
```

```bash
npm run lint && npm run build && npm run test:workflow
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment.

---

## Operational chain

```
CLAN (field capture) → DAO (district review) → CAC (county verify) → Ministry (national approve)
```

Primary workflow tables: `operational_submissions`, `workflow_actions`, `workflow_comments`, `workflow_notifications`.

See [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md) for the full state machine.
