# Self-hosted fonts

Every font the product uses is committed here and loaded with
`next/font/local`, so `next build` makes no request to Google Fonts. Each
family folder contains its SIL Open Font License (`OFL.txt`), which must ship
with the files. Fraunces is documented in `fraunces/README.md`.

## Why these files

These are the exact Latin-subset files Google Fonts served to `next/font/google`
on 2026-09-24 (the files production rendered with), so glyphs, metrics and
variable-weight behaviour are unchanged. Only the Latin subset is shipped;
characters outside it fall back to the next font in the stack.

| Family | Used by |
| --- | --- |
| geist | Public site body and headings (all weights, variable) |
| geist-mono | Public site labels and metadata (variable) |
| newsreader | Public site serif and italic accents (400 only) |
| inter | Application body text (variable) |
| inter-tight | Application headings and `font-display` (variable) |
| dm-mono | Application `font-mono` labels (400, 500) |
| dm-serif-display | Application `.font-serif-display` titles (400 regular; italic never used) |

## Files

| File | Weights / style | Size | SHA-256 |
| --- | --- | --- | --- |
| `dm-mono/dm-mono-latin-400-normal.woff2` | 400 normal | 8.5 kB | `fd7521f3531a5ccfc655b25c4f22e9871df3ec141ad79bb27fde20d0df347b6d` |
| `dm-mono/dm-mono-latin-500-normal.woff2` | 500 normal | 8.5 kB | `0e263db52797086e763679c54f84ded8cc1249879bc27dca2bd5dd446f6d9f36` |
| `dm-serif-display/dm-serif-display-latin-400-normal.woff2` | 400 normal | 17.4 kB | `f273cf2c9ce9bc7d6b0f4fcb8aee72f8cf5a249991308b6a144217e0760c5d3f` |
| `geist/geist-latin-wght.woff2` | variable wght 100–900 | 28.6 kB | `9b6f5ff45b278c744b5f379a2c4ecbaf858a842b8eaf82ac8d21b699ca16c608` |
| `geist-mono/geist-mono-latin-wght.woff2` | variable wght 100–900 | 22.6 kB | `5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b` |
| `inter/inter-latin-wght.woff2` | variable wght 100–900 | 47.3 kB | `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4` |
| `inter-tight/inter-tight-latin-wght.woff2` | variable wght 100–900 | 43.9 kB | `83d548cd73ef2e039167db3adb5ea9d7a7870466ffc8a162c9820bc348938aaf` |
| `newsreader/newsreader-latin-400-italic.woff2` | 400 italic | 23.8 kB | `56febd06c694ba791028f22c659bc1f8c80954732a77db8d708432296268e163` |
| `newsreader/newsreader-latin-400-normal.woff2` | 400 normal | 22.0 kB | `283674309045e326b732488ff07dd9e7799cb1ffc3eeccbeb642c142a13c7131` |

- Source: Google Fonts (fonts.gstatic.com) via next/font 15.5, retrieved 2026-09-24.
- Licence text: from the matching `@fontsource/<family>@5.3.0` npm package.
- Licence: SIL Open Font License 1.1 for all families (see each `OFL.txt`).
- Loaders: `src/lib/site/fonts.ts` (public site) and `src/app/layout.tsx` (application).
