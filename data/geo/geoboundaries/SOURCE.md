# Liberia county boundaries (ADM1) — source and licence

`geoBoundaries-LBR-ADM1.geojson` is the unmodified upstream file.
`scripts/build-liberia-geo.mjs` generates from it:

- `src/lib/site/liberia-geo.ts` — public-site SVG map (in use)
- `public/data/liberia-counties.geojson` — application maps. On the public
  website release this file is **not yet regenerated**; the application map
  data (previously GADM-derived, whose licence does not permit commercial use)
  is replaced on the platform release track together with the application's
  map attribution.

| Field | Value |
| --- | --- |
| Dataset | geoBoundaries gbOpen — Liberia ADM1 (Counties), 15 units |
| geoBoundaries ID | `LBR-ADM1-1627179` |
| Release | wmgeolab/geoBoundaries commit `9469f09`, build date 2023-12-12 |
| Year represented | 2021 |
| Original source | UNMIL; OCHA ROWCA (published on HDX as the Liberia COD-AB) |
| Licence | Creative Commons Attribution 3.0 IGO (CC BY 3.0 IGO) — commercial use permitted with attribution |
| Licence text | https://creativecommons.org/licenses/by/3.0/igo/legalcode |
| Download URL | https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/LBR/ADM1/geoBoundaries-LBR-ADM1.geojson |
| SHA-256 | `6a9a96a0ee1320c77d192f2d776dd1441f41b0b39d055ffb40f30bdee780b5dc` |
| Retrieved | 2026-09-24 |

Licence verified on 2026-09-24 in the geoBoundaries API metadata
(`boundaryLicense`) and in the upstream HDX record `cod-ab-lbr`
("Creative Commons Attribution for Intergovernmental Organisations").

## Required attribution

Wherever these boundaries are shown, credit:

> County boundaries: UNMIL / OCHA, via geoBoundaries (CC BY 3.0 IGO).

geoBoundaries asks that the dataset be cited as: Runfola, D. et al. (2020)
geoBoundaries: A global database of political administrative boundaries.
PLoS ONE 15(4): e0231866.

## Caveats (from the source)

Boundaries are for operational and illustrative use; they are not
authoritative legal or cadastral boundaries, and edge-matched layers may be
less precise at international borders.
