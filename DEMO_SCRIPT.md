# Agrivault — 5-minute Executive Demo Script

Goal: demonstrate credibility (visibility + chain-of-custody + integrity + compliance) with a clean walkthrough.

## 0:00–0:30 — Homepage

1. Open `/`
2. Say:
   - “Agrivault provides national visibility and export traceability for Liberia.”
   - “It is pilot-ready: audit events, discrepancy workflows, approvals, and compliance exports.”
3. Click **Executive demo** (or go to `/demo`).

## 0:30–2:00 — Login as Ministry Officer → Rice dashboard

1. Go to `/login`
2. Click **Try Demo Roles → Ministry Officer**
3. On `/rice` (presentation mode via `/demo`):
   - Point to top KPIs and county breakdown.
   - Show how the dashboard supports policy targeting and monitoring.

Optional (quick):
- Open `/map?present=1` to reinforce geographic credibility.

## 2:00–3:30 — Login as Exporter → Cocoa lots & movements

1. Return to `/login`
2. Click **Try Demo Roles → Exporter**
3. On `/cocoa/lots`:
   - Explain lot register: “export-ready evidence starts at the lot.”
4. Go to `/cocoa/movements`:
   - Explain dispatch → receipt reconciliation and chain-of-custody.

## 3:30–4:15 — Discrepancy resolution (integrity)

1. Go to `/cocoa/discrepancies`
2. Show:
   - weight variance issues
   - assignment + notes
   - mark resolved (audit trail remains)

## 4:15–4:45 — EUDR / export compliance report

1. Go to `/cocoa/eudr`
2. Say:
   - “Compliance is generated from registry + GPS + custody records.”
3. Generate/export the DDS-style PDF if available for your seeded data.

## 4:45–5:00 — Admin launch readiness (go-live confidence)

1. Login as super admin (your real admin), then go to:
   - `/admin/launch-readiness`
2. Show:
   - environment + DB reachability
   - integrity, inquiries, analytics, notifications table checks
   - readiness score

## Tips for a smooth live demo

- Start the demo from `/demo` so every page opens in presentation mode (`?present=1`) and shows the on-page demo rail (`?demo=1`).
- If any DB add-on tables are missing, run the SQL files in Supabase (see `README.md`).
- Use `/health` for quick environment validation.

