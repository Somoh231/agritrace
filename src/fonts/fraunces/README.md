# Fraunces (self-hosted)

Editorial face for the signed-in application (page headers, sidebar lockup,
top bar). Loaded with `next/font/local` in `src/app/layout.tsx`, so builds make
no request to Google Fonts for Fraunces.

| File | Weight | Style | Subset |
| --- | --- | --- | --- |
| `fraunces-latin-400-normal.woff2` | 400 | normal | latin |
| `fraunces-latin-500-normal.woff2` | 500 | normal | latin |
| `fraunces-latin-600-normal.woff2` | 600 | normal | latin |

Only the weights the application uses are included (400 top bar, 500
sidebar, 600 page headers). No italic is used.

- Source: npm `@fontsource/fraunces@5.3.0` (`files/`), built from Google Fonts.
- Upstream: The Fraunces Project Authors, github.com/undercasetype/Fraunces
- Licence: SIL Open Font License 1.1 — see `OFL.txt` (must ship with the files).
- Retrieved: 2026-09-24
- Checked against the Google-served variable font previously used: same
  222 codepoints, identical vertical metrics, advance widths within 1/2000 em.
