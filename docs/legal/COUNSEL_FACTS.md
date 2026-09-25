# Facts for counsel — Privacy and Terms

Prepared 2026-09-24 from the code on `feat/agrivault-corporate-site-redesign`.
These are **observed technical facts only**, to help counsel draft
`/privacy` and `/terms`. They are not legal commitments, and nothing here
states compliance with any law, a retention period, a jurisdiction or a
warranty. Anything marked *to confirm* was not verifiable from the code.

The page structure and per-section briefs (not rendered) live in `src/lib/site/legal.ts`. While
`LEGAL_DRAFT` is `true`, both pages show a draft notice and are `noindex`.

## Public website (agrivaultdata.com)

| Topic | What the code does |
| --- | --- |
| Contact form | Opens a pre-filled email in the visitor's own mail client (`mailto:partnerships@agrivaultdata.com`). Nothing typed into the form is sent to or stored by the website. |
| Page-view analytics | Every page load sends a `page_view` event to `/api/analytics` with the page path **including the query string**. It is stored in the `analytics_events` table with: event name, path, derived module, payload, and user id (null for signed-out visitors). |
| Rate limiting | Requests to protected API endpoints are rate-limited by client IP address (from `x-forwarded-for`), held in memory — or in Redis if configured — only for the rate window. |
| Error monitoring | Sentry is active only if a DSN is configured; `sendDefaultPii: false`, session replay off, trace sampling 10% by default. *To confirm: whether a DSN is set in production.* |
| Cookies / local storage | The public site sets no cookies or local storage of its own. *To confirm: cookies set by the hosting platform.* |
| Service worker | Registered on every page; caches static assets and offline field-app pages; network-only for API and page data. Signing out clears cached private pages. |
| Fonts and maps | All fonts are self-hosted (no third-party font requests). Public-site maps are static SVG (no third-party map requests). |
| Hosting | Vercel. *To confirm: hosting region, platform logs and their retention.* |
| Map data licence | County boundaries: UNMIL / OCHA via geoBoundaries, CC BY 3.0 IGO (credited on every map). |

## Signed-in application (for the Terms and any platform notice)

| Topic | What the code does |
| --- | --- |
| Accounts | No self-registration; accounts are created by the institution's administrators. |
| Authentication | Supabase Auth session cookies for signed-in users. A successful sign-in records an analytics event with the **email domain only** (not the full address). |
| Access | Role- and geography-scoped access enforced in the database (row-level security). |
| Records | Farmer, farm, boundary, warehouse and transfer records created by programme staff; every approval decision is kept in an append-only ledger. |
| Offline capture | Field records queue on the device while offline and are removed from the device after they sync. |
| Maps | Application maps load tiles from Mapbox (Mapbox / OpenStreetMap / Maxar credits shown). |
| Exports | Reports and CSV exports are scoped to the user's role and geography; CSV cells are neutralised against formula execution. |

## Decisions counsel needs to make

- Identity of the data controller(s) for the website and for programme data
  (AgriVault Data vs. the partner institution).
- Lawful bases, retention periods and deletion practice for each data set
  above (none are defined in code).
- Governing law and jurisdiction; liability and warranty language.
- Whether query strings should continue to be stored in page-view analytics.
- Contact route for privacy requests (the site currently exposes only
  `partnerships@agrivaultdata.com`).
