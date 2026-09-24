# Photography — commissioning briefs

The public site currently uses art-directed stand-ins (gradient landscapes,
survey contours and grain) rendered by `src/components/site/ImageFrame.tsx`.
They are decorative and hidden from assistive technology. Replace each scene
with commissioned documentary photography by passing `src` (and a real `alt`)
to `ImageFrame`; layout, crops and overlays do not change.

No stock photography. No posed "farmer with tablet smiling at camera" images.
People photographed must give informed consent for commercial use; keep the
signed releases with the image files. Do not photograph identifiable
beneficiaries in a way that reveals programme status or personal data.

| Scene key | File name | Brief | Used on |
| --- | --- | --- | --- |
| `aerial-fields` | `aerial-fields.avif` | Aerial, low sun: smallholder rice plots and a laterite road, central Liberia. Documentary, no posing. | Practice 06, About, Offline Field Operations |
| `operations-room` | `operations-room.avif` | Operations room at a county agriculture office: printed maps, laptops, officers in discussion. | Practices 01 and 05, Reporting, Governments |
| `field-boundary` | `field-boundary.avif` | County agriculture officer and farmers walking a plot boundary with a tablet, Nimba County. Mid-morning, 35mm, candid. | Liberia feature, Liberia programme, GIS |
| `cooperative-store` | `cooperative-store.avif` | Extension officer registering a farmer at a cooperative store, tablet on a crate. | Practice 02, Operations Platform, Farmer Registry |
| `dusk-road` | `dusk-road.avif` | Dusk over lowland rice fields, a lone motorbike on the farm road. Wide, quiet, long lens. | Closing call to action |
| `warehouse` | `warehouse.avif` | Inside a district input store: stacked seed sacks, a storekeeper checking a receipt against a tablet. | Practice 04, Warehouse & Traceability |

## Delivery specification

- Master: 4000 px on the long edge, sRGB, no watermark, no heavy grade.
- Web: AVIF (and WebP fallback via `next/image`), longest edge 2400 px.
- Keep the lower third calm: most frames carry a headline over a navy
  gradient at the bottom.
- Provide a one-line factual `alt` for each image (what is shown, where).
