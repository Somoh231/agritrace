# AgriVault Ministry Pilot — Demo Script

**Duration:** 45–60 minutes  
**Audience:** Ministry leadership, donor partners, pilot stakeholders  
**Presenter:** Pilot administrator or Ministry programme lead  
**Version:** Pilot 1.0 · July 2026

---

## Before you begin

### Environment checklist

- [ ] Deployment URL accessible (staging or production)
- [ ] `npm run seed:demo` completed
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` configured (for GPS demo)
- [ ] Browser: Chrome or Edge (PWA install demo optional)
- [ ] Second screen or projector for audience

### Demo accounts

| Role | Email | Password | Landing |
|------|-------|----------|---------|
| Ministry | `demo-ministry@agritrace.demo` | `DemoPass!2026` | `/command-center` |
| DAO | `demo-field@agritrace.demo` | `DemoPass!2026` | `/district-dashboard` |

For CLAN and CAC segments, use pilot accounts provisioned by administrator or narrate from DAO/Ministry views.

### Narrative arc

> "A CLAN technician captures data in the field — offline if needed. The DAO reviews at district level. The CAC verifies at county level. Ministry sees the full national picture and produces cabinet-ready reports."

---

## Act 1 — Ministry command view (10 min)

**Login:** `demo-ministry@agritrace.demo`

### Step 1: Command center

1. Navigate to `/command-center`.
2. **Say:** "This is the national operations desk. KPIs update from live Supabase data where available."
3. Point out the **Data Source** badge — explain LIVE vs PILOT vs DEMO.
4. Highlight: farmers registered, active districts, warehouse signals, verification backlog.

### Step 2: National operations

1. Open `/national-operations`.
2. **Say:** "Operational intelligence across districts — feed items, county metrics, warehouse status."
3. Click through to `/national-heat-map` for geographic context.

### Step 3: Ministry workspace

1. Open `/workspace/ministry`.
2. Walk through KPI links: verification queue, field agents, food security, transfers.
3. **Say:** "Every link is role-gated. CLAN technicians never see this view."

---

## Act 2 — Field capture story (10 min)

**Switch to:** DAO account or narrate with screenshots

### Step 4: CLAN field workflow (narrated)

**Say:** "In the field, a CLAN technician uses a phone or tablet."

Walk through these routes (open in new tab or show slides):

| Step | Route | Talking point |
|------|-------|---------------|
| Install PWA | `/login` → Install for Offline Use | Works without app store |
| Daily report | `/field/mobile` | Structured field activity log |
| Register farmer | `/farmers` | Links to national registry |
| GPS boundary | `/field/boundary-capture` | Walk perimeter, capture corners |
| Offline sync | Topbar Sync Status | Queues locally, syncs when online |

### Step 5: GPS boundary capture (live if token available)

1. Open `/field/boundary-capture`.
2. Allow location permission.
3. Capture 3–4 corners on the map.
4. **Say:** "Boundary data creates an operational submission for DAO review. Offline captures queue in IndexedDB and sync via Edge Function."

If Mapbox token is missing, **Say:** "Maps require a Mapbox token — configured in production deployment."

---

## Act 3 — District review (10 min)

**Login:** `demo-field@agritrace.demo`

### Step 6: District dashboard

1. Navigate to `/district-dashboard`.
2. **Say:** "The DAO sees district KPIs and operational forms in one desk."
3. Open the operations drawer — show register farmer, farm inspection, GPS evidence forms.

### Step 7: Verification queue

1. Open `/verification-queue`.
2. Filter or scroll to items in `dao_review` status.
3. **Say:** "CLAN submissions arrive here. The DAO approves, requests corrections, rejects, or escalates."
4. Demonstrate **Approve** on one item (if live submission exists) or narrate the action buttons.
5. Point out workflow thread / comments.

### Step 8: Field agent monitoring

1. Open `/field-agents`.
2. **Say:** "DAO monitors CLAN technician coverage and sync health."

### Step 9: DAO reporting

1. Open `/reporting/workspace?tab=dao`.
2. Show tabs: drafts, submitted, review, verified, escalated.

---

## Act 4 — County verification (8 min)

**Login:** CAC account (or continue narrating from Ministry)

### Step 10: County dashboard

1. Navigate to `/county-dashboard`.
2. **Say:** "The County Agriculture Coordinator verifies DAO-approved items."
3. Open **CaoApprovalQueues** tabs:
   - Farmer registration
   - Farm inspection
   - Subsidy verification
   - Pest escalation

### Step 11: Approve at county level

1. Demonstrate or narrate **Approve** action → status moves to `cac_approved`, then `ministry_review`.
2. **Say:** "County approval is the quality gate before national sign-off."

---

## Act 5 — Ministry approval and reporting (10 min)

**Login:** `demo-ministry@agritrace.demo`

### Step 12: Ministry verification

1. Return to `/verification-queue`.
2. Find items in `ministry_review` or `escalated`.
3. Demonstrate **Approve** → `ministry_approved`.
4. **Say:** "This is the terminal approved state — auditable and reportable."

### Step 13: Executive briefing

1. Open `/executive-briefing`.
2. Walk through county KPIs, operational narrative, risk flags.
3. **Say:** "CAC and Ministry both access this surface for leadership meetings."

### Step 14: PDF export

1. Click topbar PDF export or trigger `/api/reports/executive-briefing`.
2. **Say:** "Cabinet-ready PDF generated server-side — auth required, no public access."

### Step 15: Additional reports

Briefly show:

- `/reports/ministry` — narrative reports
- `/api/reports/rice` — rice season PDF (mention only if time permits)

---

## Act 6 — Architecture and security (5 min)

### Step 16: Wrap-up talking points

**Workflow chain:**
```
CLAN capture → DAO review → CAC verify → Ministry approve
```

**Data integrity:**
- Every surface shows Data Source badge
- Workflow transitions validated server-side
- No silent fallback between LIVE and PILOT data

**Offline resilience:**
- PWA installable shell
- IndexedDB queues for field and DAO forms
- Batch sync via Edge Function

**Security (see [production-readiness.md](./production-readiness.md)):**
- Role-based middleware on every route
- CSP configured for Mapbox + Supabase
- Rate limiting on public endpoints
- Request IDs for audit tracing

---

## Q&A prompts

Prepare answers for:

1. **"What happens without internet?"** — CLAN captures offline; syncs when connected. DAO can save drafts locally.
2. **"How do we know data is real?"** — Check LIVE badge; pilot fixtures are labeled PILOT/DEMO.
3. **"Can one person do everything?"** — Role switcher is UI preview only; server enforces separation of duties.
4. **"What about existing paper records?"** — DAO register farmer form digitizes records into the workflow.
5. **"When is this production-ready?"** — See [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) go/no-go criteria.

---

## Demo recovery

| Issue during demo | Recovery |
|-------------------|----------|
| Login fails | Re-run `npm run seed:demo`; check Supabase Auth |
| Map blank | Skip GPS live demo; show `/map` screenshot or narrate |
| No items in verification queue | Use PILOT fixtures — explain badge; or submit from DAO form live |
| Approve button disabled | Confirm demo account role; refresh page |
| PDF fails | Show executive briefing page instead; note auth requirement |
| Slow network | Pre-load tabs before audience arrives |

---

## Related guides

| Guide | Audience |
|-------|----------|
| [PILOT_ADMIN_GUIDE.md](./PILOT_ADMIN_GUIDE.md) | Administrators |
| [CLAN_FIELD_GUIDE.md](./CLAN_FIELD_GUIDE.md) | Field technicians |
| [DAO_GUIDE.md](./DAO_GUIDE.md) | District officers |
| [CAC_GUIDE.md](./CAC_GUIDE.md) | County coordinators |
| [MINISTRY_GUIDE.md](./MINISTRY_GUIDE.md) | Ministry staff |
| [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) | Launch checklist |
