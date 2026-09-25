# AgriVault Data — Public Site UI/UX Implementation Audit

Date: 2026-09-24 · Branch: `feat/agrivault-corporate-site-redesign`
(stacked on `audit/claude-opus-55-360` @ `c41a347` so the site inherits the security, React 19,
CSP and login fixes; merge order: audit branch first, then this branch).

Source of truth: **"AgriVault Visual Direction (2)"** (self-unpacking HTML bundle, rendered and
unpacked headlessly for this audit: text, DOM, tokens and 22 section screenshots at 1440 and 390).

## 1. What the approved direction establishes (kept)

| Area | Approved decision | Kept as |
|---|---|---|
| Positioning | Agricultural systems + technology + advisory + implementation partner; products sit underneath | Site architecture, copy hierarchy |
| Market framing | "STARTING MARKET · LIBERIA", "PILOT · BEING VALIDATED"; no invented figures | Verbatim; enforced in copy review |
| Type | Geist (sans) · Newsreader (serif; italic accent word) · Geist Mono (metadata) | `next/font` (self-hosted at build) |
| Palette | navy `#07152D`, forest `#0B2E1A`, emerald `#0FA36B` / `#0A7D50`, off-white `#F7F7F2`, sand `#ECECE3`, gold `#C7A56A` / `#8A6A2E`, rust `#8C3B30` / `#B4564A` | `--av-*` tokens, contrast-checked pairs |
| Motif | Topographic contours, parcel outlines, mono "SAMPLE" annotations | SVG system, labelled as illustrative |
| Mark | Three nested chevrons, horizontal band cut, emerald base triangle | `AgriVaultMark` (unchanged geometry) + small-size optical variant |
| Home sections | Hero → institutional problem (Today / With AgriVault) → practices → how we work (6 stages) → products → Liberia → outcomes → engagement models → final CTA → footer | Same order, re-composed |
| Engagement models | 5 models, each mapped to the 6 stages | Interactive, keyboard-operable |

## 2. What changes (elevation)

| Issue in prototype | Change |
|---|---|
| Nav was 6 plain dropdown triggers; "Markets" in nav | Brief's nav: What We Do · Products · Programmes · How We Work · Governments · Company; full-width **mega menu** (click + hover-intent, Esc, focus return, arrow keys) with a featured editorial column |
| Hero photo caption collided with the "We work with" strip at 1440 | Caption moved into the image frame's own metadata rail |
| Six practices as a list with one static dark card | **Sticky outcome panel** driven by the active practice (scroll or focus), varied row rhythm |
| How-we-work carousel with prev/next arrows (hidden cards off-screen) | **Sticky stage progression** on desktop (native scroll, no hijacking, rail + progress), stacked stage cards on mobile; reduced-motion shows all stages |
| Product list + one flagship panel only | Product modules with problem / capability / users / deployment, flagship record-lineage panel kept and labelled SAMPLE |
| Liberia map was a raster-like placeholder | Real GADM county geometry rendered to SVG, pilot counties highlighted |
| Engagement stage chips were colour-only (included vs not) | Text + icon state, not colour alone |
| Identical CTA pair repeated in closing band and footer band | Single closing CTA; footer carries the sitemap |
| Inner pages did not exist | Ten routes, each with its own narrative structure (see §5) |

## 3. What is removed

* Legacy marketing routes (`/africa`, `/capabilities`, `/demo`, `/docs`, `/governance`, `/government`,
  `/integrations`, `/liberia`, `/news`, `/partners`, `/platform`, `/platform-preview`, `/pricing`,
  `/request-demo`) and their `src/content/agrivault_site/*.html`, `public-marketing.css`,
  `PublicNav`, `PublicFooter`, `PublicSiteShell`, `RequestDemoForm`, `DemoGuideClient`. They are already
  404'd by middleware on the base branch and describe the old product-only / portal positioning.
* Ministry of Agriculture seal as AgriVault identity: **login page**, **PWA icons** (generated from
  `moa-seal.jpeg`), app sidebar brand block. The mark may appear only as labelled programme context.
* `/setup` stays retired.

## 4. Reusable vs new

Reused: `safeInternalRedirect`, login auth flow (unchanged logic), `escapeCsvCell` n/a, Tailwind v3,
`next/font`, the GADM GeoJSON, CSP (no new origins needed).
New (kept deliberately small): `SiteNav`, `MegaMenu`, `MobileNav`, `SiteFooter`, `AgriVaultMark`,
`Topo` (contours), `ImageFrame`, `LiberiaMap`, `Section`/`Eyebrow`/`Display` primitives,
`PracticeExplorer`, `StageProgression`, `ProductModules`, `EngagementModels`, `ContactForm`, `Reveal`.

## 5. Inconsistencies found

* Two parallel font stacks (8 instances of Inter / Inter Tight / DM Mono / DM Serif / Fraunces) loaded
  globally for every route, none of which is the approved Geist / Newsreader system.
* `/` belonged to the authenticated `(dashboard)` group (a redirect), and the PWA `start_url` is `/` —
  installing the field app would now open the corporate homepage. Fix: dashboard entry moves to `/app`,
  manifest `start_url` → `/app`.
* Metadata still says "Agricultural traceability platform for Liberia" (product-only positioning).

## 6. Accessibility concerns to design out

Mega menus that open on hover only; carousels with hidden focusable cards; colour-only state (engagement
chips); low-contrast mono captions on photography; sticky header obscuring focused elements
(`scroll-padding-top`); motion without `prefers-reduced-motion`; placeholder-only form labels.

## 7. Performance concerns

Baseline (base branch build): `/login` 180 kB first-load JS, shared 103 kB; cold rural-3G login 6.1 s
(measured earlier). Risks: three.js (~600 kB) and ShaderGradient if loaded globally; unoptimised
photography; 8 font files. Budget for this redesign: marketing routes ≤ 130 kB first-load JS, no
three.js on any route except an explicitly lazy, viewport-gated spatial moment.

## 8. Tooling decisions

* **UI/UX Pro Max** — design-system run (rejected its generic "biophilic green" palette as conflicting
  with the approved direction; adopted Newsreader-for-editorial confirmation and checklist) and UX
  guideline queries (hover vs tap, reduced motion / no scroll-jacking, focus-not-obscured, form labels,
  inline validation).
* **21st.dev** — searched mega menus, scroll storytelling, editorial heroes, footers; studied
  "Navbar Section 2" (full-width expanding panel), "Rich Navigation Menu" (grouped items + featured
  column), "Scroll 01" (sticky media swapping with text). Code retrieval quota was exhausted
  (free tier: 2/day), so patterns are implemented from their previews, not copied.
* **scroll-world** — its engine scrubs AI-generated video billed per clip (Higgsfield/Monid); paid
  generation was not approved. Its principles are used in code: native-scroll-driven progression,
  pinned per-stage copy, stage rail, reduced-motion fallback to static states, no scroll hijacking.
* **Liquid Glass (vendored)** — snapshots the whole page with `html2canvas` and runs WebGL per
  instance; evaluated as disproportionate for a content site. Not used; the few floating controls use
  native `backdrop-filter` with a solid fallback.
* **React Three Fiber / ShaderGradient** — see final report for whether a spatial moment earned its
  cost.

## 9. Implementation results (2026-09-24)

Branch `feat/agrivault-corporate-site-redesign`. Not merged; no migrations,
RLS or auth-logic changes (`git diff c41a347 -- supabase` is empty; the
LoginClient sign-in logic is byte-identical to the base commit).

### Routes
`/`, `/what-we-do`, `/products`, `/programmes`, `/programmes/liberia`,
`/how-we-work`, `/governments`, `/security`, `/about`, `/contact` — all static.
The role-based signed-in entry moved from `/` to `/app` (protected). Other
legacy marketing routes remain 404.

### Build and tests
| Check | Result |
| --- | --- |
| `tsc --noEmit`, `eslint` (whole repo) | clean |
| `next build` | passes; public routes 107–127 kB first-load JS (budget 130 kB) |
| `test:workflow` / `test:gis` | 17/17, 5/5 |
| `test:rls:rc1`, `test:workflow:parity` (static) | pass (66 rules) |
| Playwright `public-site.spec.ts` + `rc1-preview.spec.ts`, desktop + mobile | 102 passed, 64 skipped (authenticated suites need QA credentials) |
| Viewport sweep 1440/1280/1024/768/390/360 × 11 routes | no overflow, no console errors, no undersized targets (inline-text links exempt, WCAG 2.5.8) |
| axe WCAG 2.2 AA (1440 and 390, every route) | 0 violations |
| Reduced motion | all content visible without scrolling; no animation |

### Performance (cold, 400 ms RTT, ~400 kbps, 4× CPU, 390 px; median of 3)
| Page | Before (base) | After |
| --- | --- | --- |
| `/` | redirect to `/login`: LCP 11.2 s, 445 kB | LCP 3.5 s, 396 kB (fonts 102 kB) |
| `/login` | LCP 10.8 s, blank until JS | FCP 3.4 s with complete page; LCP 7.8 s (hydration re-paint of an already-visible paragraph) |
| Inner pages | — | LCP 3.4–3.5 s, 303–388 kB |

### Decisions recorded
- **Newsreader** ships as static 400 normal + italic (the variable opsz build
  was ~273 kB). Large italics lose the high optical-size cut.
- **No three.js / R3F / ShaderGradient / liquid-glass** on any route. The
  static county SVG carries the Liberia story without a 150 kB+ runtime.
  The dependencies from commit e668b85 remain installed but unused.
- **scroll-world** used as principles only (native-scroll stage rail, sticky
  outcome card, reduced-motion final state); no generated video.
- **Contact** composes an email in the visitor's mail client; nothing is sent
  to or stored by the site (the old `/api/demo-inquiry` was an empty directory).
- **App fonts** (Inter, Inter Tight, DM Mono, DM Serif, Fraunces) are no longer
  preloaded on every route.

### Open items before launch (updated 2026-09-24, second pass)

Resolved on this branch:
- ~~GADM county geometry~~ — geoBoundaries LBR-ADM1 (UNMIL / OCHA, CC BY 3.0
  IGO) for the site SVG and `public/data/liberia-counties.geojson`;
  provenance in `data/geo/geoboundaries/SOURCE.md`; credited on every map.
- ~~Node 20 runtime~~ — 22.x (`package.json`, lockfile, `.nvmrc`).
- ~~Google Fonts build dependency~~ — every family self-hosted with
  `next/font/local` (`src/fonts`, OFL, provenance in `src/fonts/README.md`).
  Clean builds make zero requests to fonts.googleapis.com / fonts.gstatic.com
  and pass with all proxies pointed at a dead port.
- ~~Hidden Mapbox attribution~~ — all seven Mapbox maps show Mapbox's own
  attribution control (Mapbox / OpenStreetMap, Maxar on satellite); county
  credit appended via `customAttribution` on polygon maps.

Still open — the site is **not production-ready** until these close:
1. Real photography — 8 photographs to commission; slot-by-slot sizes,
   crops, releases and sign-off in `docs/photography/REPLACEMENT_CHECKLIST.md`.
   No approved photography exists in the repository.
2. Privacy page — structure live at `/privacy` (draft notice, noindex);
   counsel-approved text required (`src/lib/site/legal.ts`,
   `docs/legal/COUNSEL_FACTS.md`).
3. Terms page — same, at `/terms`.
4. Confirm `partnerships@agrivaultdata.com` is a monitored mailbox. It is
   defined once (`CONTACT_EMAIL`, `src/lib/site/content.ts`) and used by the
   contact form (mailto), the contact page, the footer, the security page's
   vulnerability-report link and the legal pages' draft notice.
5. Credential-gated authenticated-role Playwright suites (64 tests skip
   without QA credentials).
6. Protected Vercel preview smoke test (needs an authenticated browser
   session; no automation bypass secret is used without authorisation).

Risks noted, not yet addressed:
- `src/lib/growth/content.ts` holds a named person's contact details
  (email, phone, locations) used by `/api/admin/content` (returns 401 when
  unauthenticated). Owner to decide whether it belongs in source.
- The app-wide "PWA" diagnostics button (fixed, bottom-right) can sit over a
  map's compact attribution control when that map's corner meets the
  viewport corner.
- `next dev` cannot run client JS because the production CSP (no
  `unsafe-eval`) also applies in development.
- Unused visual-library dependencies from commit e668b85.
