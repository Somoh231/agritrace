# Photography replacement checklist

Status: **no approved photography exists in the repository.** Every image
slot on the public site is an art-directed placeholder (gradient landscape,
survey contours, grain) rendered by `src/components/site/ImageFrame.tsx` or,
for the two full-bleed backgrounds, by CSS gradients. The only raster images
in the repo are the Ministry of Agriculture marks (`public/logos/`, programme
context only) and the app icons — none can replace a placeholder.

Do not use stock photography, generated imagery or photographs of
identifiable people without signed releases. Scene briefs: `BRIEFS.md`.

## What to commission: 8 photographs

The 19 slots on the site draw on 8 distinct photographs. Each scene is reused
at several aspect ratios, so shoot every scene **landscape 3:2, ≥ 4000 px on
the long edge, subject centred with generous margin on all sides** so one
master supports every crop listed below.

| # | Scene key | Subject | Liberia-specific | Releases required |
| --- | --- | --- | --- | --- |
| 1 | `aerial-fields` | Aerial, low sun: smallholder rice plots and a laterite road, central Liberia | **Yes** | Property/land-owner permission where required; any legally required drone permissions |
| 2 | `operations-room` | County agriculture office operations room: printed maps, laptops, officers in discussion | Yes (county office) | Model releases for identifiable people; property release; the office's written permission |
| 3 | `field-boundary` | County agriculture officer and farmers walking a plot boundary with a tablet, Nimba County | **Yes — Nimba** | Model releases for every identifiable person; farmer's consent for their plot |
| 4 | `cooperative-store` | Extension officer registering a farmer at a cooperative store, tablet on a crate | Yes | Model releases; property release; cooperative's permission. **No real farmer record, ID or data visible on the tablet** |
| 5 | `warehouse` | District input store: stacked seed sacks, storekeeper checking a receipt against a tablet | Yes | Model release; property release; no real stock records legible |
| 6 | `dusk-road` | Dusk over lowland rice fields, a lone motorbike on the farm road; wide, quiet, long lens | Preferred | Property permission if on private land; rider unidentifiable or released |
| 7 | Hero background | Aerial field atmosphere behind the homepage headline (can reuse #1 at a wider crop) | **Yes** | As #1 |
| 8 | Closing CTA background | Dusk landscape behind the closing call to action (can reuse #6) | Preferred | As #6 |

Every release must cover worldwide commercial web use by AgriVault Data,
including marketing. Keep signed releases and the photographer's licence
(or work-for-hire agreement) with the image files; do not commit them to the
repository if they contain personal data.

## Slot-by-slot checklist

Sizes are the rendered box in CSS pixels measured on 2026-09-24. Minimum
delivered resolution is 2× the largest box (for high-density screens).

| Route | Section | Scene | Desktop box (1440) | Mobile box (390) | Aspect / crop | Min. resolution | Mobile crop notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Hero (background) | #7 | 1440×900 | 390×1039 | Full-bleed; text on the left, dark gradient over left 60% | 2880×1800 (landscape) + portrait crop ≥ 780×2078 | Portrait crop centred on the plot structure; headline sits over the lower half |
| `/` | What we do — outcome card (6 variants) | #2, #4, #3, #5, #2, #1 | 532×665 | hidden | 4:5 portrait; headline over bottom 40% | 1064×1330 | Not shown below 1024 px |
| `/` | Products panel (6 variants, one per tab) | #4, #4, #3, #5, #2, #1 | 891×680 | 350×675 | Fills panel; sample lineage card top-right, copy bottom-left | 1782×1360 | Tall crop; keep subject in the middle third; top-right and bottom are covered by UI |
| `/` | Liberia feature | #3 | 777×918 | 350×520 | Portrait; programme title over bottom 45% | 1554×1836 | Keep people in the upper half |
| `/` | Closing CTA (background) | #8 | 1440×740 | 390×647 | Full-bleed; centred headline | 2880×1480 + portrait crop ≥ 780×1294 | Horizon around the lower third |
| `/what-we-do` | Practice 01 banner | #2 | 996×427 | 350×150 | 21:9; outcome text over the bottom | 1992×854 | Very shallow on mobile: subject must read at 150 px high |
| `/what-we-do` | Practice 02 banner | #4 | 996×427 | 350×150 | 21:9 | 1992×854 | As above |
| `/what-we-do` | Practice 03 banner | #3 | 996×427 | 350×150 | 21:9 | 1992×854 | As above |
| `/what-we-do` | Practice 04 banner | #5 | 996×427 | 350×150 | 21:9 | 1992×854 | As above |
| `/what-we-do` | Practice 05 banner | #2 | 996×427 | 350×150 | 21:9 | 1992×854 | Use a different frame from Practice 01 |
| `/what-we-do` | Practice 06 banner | #1 | 996×427 | 350×150 | 21:9 | 1992×854 | As above |
| `/programmes/liberia` | Seven components | #3 | 551×581 | 350×360 | ~1:1 | 1102×1162 | Use a different frame from the home feature |
| `/governments` | Institutional control | #2 | 532×399 | hidden | 4:3 | 1064×798 | Not shown below 1024 px |
| `/about` | Why we exist | #1 | 648×486 | 350×263 | 4:3 | 1296×972 | Whole-scene crop |

## Tone

Documentary and observational: natural light, candid moments, working
hands and tools rather than posed portraits. Muted, warm, slightly
desaturated grade that sits with the navy/forest/sand palette. No heavy
filters, no staged "smiling at the camera", no logos or government seals as
the subject.

## Alt text guidance

- Describe what is shown and where, in one factual sentence
  (for example: "A county agriculture officer and two farmers walk the edge
  of a rice plot, Nimba County").
- Do not repeat the headline overlaid on the image, and do not describe
  outcomes or results the photo cannot show.
- Do not name identifiable people unless they have agreed to be named.
- Full-bleed backgrounds behind headlines (hero, closing CTA) are
  decorative: `alt=""` / CSS background.

## Delivery and implementation

1. Deliver masters to the owner (not the repo). Export web files as AVIF
   (WebP fallback is handled by `next/image`), longest edge 2400–3200 px.
2. Place web files in `public/photography/<scene-key>[-variant].avif`.
3. Pass `src` and `alt` to the `ImageFrame` at each slot above; layout,
   overlays and crops do not change. Adjust `object-position` only if a crop
   hides the subject.
4. The hero and closing CTA use CSS gradients today; switching them to
   photographs is a small code change (a `next/image` layer behind the
   existing gradient and contours).
5. Re-run the public-site Playwright suite, the axe sweep and a throttled
   performance check (image weight is the main risk on rural 3G).

## Sign-off

- [ ] 8 photographs commissioned and delivered
- [ ] Releases and licences on file for every photograph
- [ ] Liberia-specific scenes (#1, #3, #7) confirmed as Liberia
- [ ] No personal data legible in any frame
- [ ] Alt text written and reviewed
- [ ] Slots updated and QA re-run
