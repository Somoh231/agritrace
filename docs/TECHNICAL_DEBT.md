# AgriVault — Technical Debt Register

**Version:** 0.1.0-rc1  
**Date:** 2026-07-03  
**Owner:** Engineering / Release Manager  
**Review cadence:** End of pilot week 1, then monthly

Debt items are prioritized **P0** (before GA), **P1** (during scale-up), **P2** (nice-to-have).

---

## P0 — Before general availability

### TD-001: Authenticate all PDF export routes

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Effort** | S (1 day) |
| **Risk** | Data exposure — unauthenticated PDF generation |

Four `/api/reports/*` routes lack session checks:

- `compliance-oversight`
- `donor-programme`
- `rice`
- `dds`

**Fix:** Add `getUser()` guard matching `executive-briefing/route.ts` pattern; role-check for ministry/auditor/donor as appropriate.

---

### TD-002: Distributed rate limiting

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Effort** | M (2–3 days) |
| **Risk** | Abuse on unprotected routes; per-instance limit bypass |

In-memory `Map` in `src/lib/http/rate-limit.ts` does not survive cold starts or scale across Vercel instances.

**Fix:** Swap store for Vercel KV / Upstash Redis; extend rate limits to `analytics`, `ops/workflows/*`, and remaining data routes.

---

### TD-003: Fix role landing path inconsistencies

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Effort** | S (half day) |
| **Risk** | User confusion; support burden |

Conflicts:

- CLAN → `/district-dashboard` vs denial redirect `/field/mobile`
- `call_center_agent` → `/verification-queue` (denied by middleware)
- `exporter` → `/cocoa/lots` (denied by middleware)

**Fix:** Align `postLoginHomeForRole()` with `pilotRoleLandingPath()` and middleware policy in `workspace-access.ts`.

---

### TD-004: E2E test suite for pilot chain

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Effort** | L (1 week) |
| **Risk** | Regressions undetected between deploys |

Only `workflow.spec.ts` (29 unit checks) exists. No Playwright, no API integration tests, no RLS tests.

**Fix:** Add Playwright smoke: login → field submit → DAO approve → CAC approve → Ministry approve. Add Supabase RLS policy tests.

---

## P1 — During pilot scale-up

### TD-005: Unify transfer data model

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | L (1–2 weeks) |
| **Risk** | Count mismatches across dashboards |

Dual sources: `warehouse_transfer_orders` vs `inventory_movements` vs canonical fixtures.

**Fix:** Single `transfer-repository` read path with explicit source disclosure; deprecate duplicate tables or add DB view.

---

### TD-006: Live-only verification queue mode

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | M (3 days) |
| **Risk** | Reviewers action demo fixtures thinking they are live |

Client-assembled merge of demo `VRF-*` + live submissions.

**Fix:** Environment flag `PILOT_FIXTURES=false` to suppress demo rows in production; separate training mode.

---

### TD-007: Sync queue inspection UI

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | M (3 days) |
| **Risk** | Field technicians cannot diagnose stuck sync items |

`/field/sync-queue` is informational only.

**Fix:** Render IndexedDB pending items with status, retry, and delete actions.

---

### TD-008: Bridge donor/inventory receipt forms to workflow

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | M (3 days) |
| **Risk** | Receipt events lack audit trail |

`RecordInventoryReceiptForm`, `RecordDonorShipmentForm` not connected to `operational_submissions`.

**Fix:** `ensureOperationalSubmission` hooks for `donor_shipment_verification` after insert.

---

### TD-009: CAPTCHA on public endpoints

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | S (1 day) |
| **Risk** | Spam on `demo-inquiry` |

**Fix:** hCaptcha or Turnstile on `POST /api/demo-inquiry`.

---

### TD-010: global-error.tsx

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | S (half day) |
| **Risk** | Poor UX on unhandled root errors |

**Fix:** Branded global error boundary with retry and support link.

---

### TD-011: CSP script nonces

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | M (3–5 days) |
| **Risk** | `'unsafe-inline' 'unsafe-eval'` weakens XSS protection |

**Fix:** Next.js nonce middleware; remove unsafe directives when hydration supports it.

---

### TD-012: Data-source badges on executive briefing

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | S (1 day) |
| **Risk** | Cabinet PDF includes undisclosed demo data |

**Fix:** Per-KPI source annotation in briefing component and PDF template.

---

### TD-013: Role gate on /reports/* routes

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Effort** | S (half day) |
| **Risk** | Unauthorized users access report URLs directly |

**Fix:** Add `/reports` to `PILOT_ROUTE_RULES` with ministry/DAO/CAC allowlist.

---

## P2 — Nice-to-have / cleanup

### TD-014: Remove unused Workbox dependencies

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | S (1 hour) |

Five `workbox-*` packages unused; custom `public/sw.js` in use.

---

### TD-015: Deprecate EnterpriseDataGrid shim

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | M (3 days) |

~30 files import deprecated operations shim per UI consolidation inventory.

---

### TD-016: Re-enable AiAssistant

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | M (3 days) |

Disabled for pilot. Requires token cost controls and role-scoped context.

---

### TD-017: Lighthouse CI budget

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | S (1 day) |

No automated Core Web Vitals enforcement.

**Fix:** GitHub Action with Lighthouse CI; budget thresholds for LCP, CLS, INP.

---

### TD-018: County/GIS code splitting

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | M (3 days) |

`/county-dashboard` (212 kB) and `/gis-intelligence` (196 kB) exceed ideal First Load JS.

**Fix:** Lazy-load map panels and chart modules; route-level loading skeletons.

---

### TD-019: Consolidate post-login and pilot landing paths

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | S (half day) |

Two functions (`postLoginHomeForRole`, `pilotRoleLandingPath`) with divergent logic.

**Fix:** Single source of truth in `workspace-access.ts`.

---

### TD-020: Workflow stage mapping for logistics roles

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Effort** | S (half day) |

`warehouse_manager`, `cooperative_manager`, `exporter` default to `"donor"` stage.

**Fix:** Explicit `"none"` or `"logistics"` stage with defined permissions.

---

## Debt by area

| Area | P0 | P1 | P2 | Total |
|------|----|----|----|----|
| Security | 2 | 3 | 0 | 5 |
| Auth / roles | 1 | 1 | 2 | 4 |
| Workflow / data | 0 | 3 | 1 | 4 |
| Offline | 0 | 1 | 0 | 1 |
| Testing | 1 | 0 | 1 | 2 |
| Performance | 0 | 0 | 2 | 2 |
| UI / cleanup | 0 | 1 | 2 | 3 |
| **Total** | **4** | **9** | **8** | **21** |

---

## Paydown plan

| Phase | Items | Target |
|-------|-------|--------|
| Pilot week 0 | TD-003 | Before user onboarding |
| Pilot week 2 | TD-001, TD-006 | Before live data only |
| Post-pilot month 1 | TD-002, TD-004, TD-005 | Before county scale-up |
| Post-pilot month 2 | TD-007–TD-013 | Before GA |
| Ongoing | TD-014–TD-020 | As capacity allows |

---

## Tracking

Update this register when:

- A limitation from [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) is resolved
- New debt is discovered during pilot
- Priority changes based on stakeholder feedback

Cross-reference: [ROADMAP_POST_PILOT.md](./ROADMAP_POST_PILOT.md) for product-facing timeline.
