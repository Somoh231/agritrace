import Image from "next/image";
import type { ReactNode } from "react";

import { Topo } from "@/components/site/Topo";

export type Scene = "aerial-fields" | "operations-room" | "field-boundary" | "cooperative-store" | "dusk-road" | "warehouse";

/**
 * Art-directed stand-ins until documentary photography is commissioned.
 * Each scene is a restrained landscape atmosphere (horizon light, land tone,
 * field structure) rather than a stock image. Replacement briefs and file
 * names live in docs/photography/ (BRIEFS.md, REPLACEMENT_CHECKLIST.md); pass `src` to switch to a
 * real, responsive image without changing layout.
 */
const SCENES: Record<Scene, { bg: string; topo: string; brief: string }> = {
  "aerial-fields": {
    bg: "radial-gradient(120% 90% at 78% 12%, #7C8A57 0%, rgba(124,138,87,0) 55%), linear-gradient(160deg, #3F5231 0%, #26391F 38%, #13241A 70%, #0A1712 100%)",
    topo: "#E4E9C9",
    brief: "Aerial, low sun: smallholder rice plots and a laterite road, central Liberia. Documentary, no posing.",
  },
  "operations-room": {
    bg: "radial-gradient(90% 70% at 20% 85%, rgba(199,165,106,0.28) 0%, rgba(199,165,106,0) 60%), linear-gradient(180deg, #102443 0%, #0B1B35 55%, #07152D 100%)",
    topo: "#9AA7B8",
    brief: "Operations room at a county agriculture office: printed maps, laptops, officers in discussion.",
  },
  "field-boundary": {
    bg: "radial-gradient(110% 80% at 30% 0%, #C9CFA0 0%, rgba(201,207,160,0) 55%), linear-gradient(180deg, #8C9A67 0%, #5E7444 40%, #33502C 72%, #1B3320 100%)",
    topo: "#F3F1DC",
    brief: "County agriculture officer and farmers walking a plot boundary with a tablet, Nimba County. Mid-morning, 35mm, candid.",
  },
  "cooperative-store": {
    bg: "radial-gradient(80% 70% at 75% 25%, rgba(228,207,162,0.35) 0%, rgba(228,207,162,0) 60%), linear-gradient(170deg, #4B5A3A 0%, #34432A 45%, #1D2B1C 100%)",
    topo: "#E4CFA2",
    brief: "Extension officer registering a farmer at a cooperative store, tablet on a crate.",
  },
  "dusk-road": {
    bg: "linear-gradient(180deg, #0B1B35 0%, #1E2A3A 35%, #4C4331 62%, #6B5A36 74%, #1C2417 100%)",
    topo: "#E4CFA2",
    brief: "Dusk over lowland rice fields, a lone motorbike on the farm road. Wide, quiet, long lens.",
  },
  warehouse: {
    bg: "radial-gradient(90% 80% at 50% 0%, rgba(236,236,227,0.25) 0%, rgba(236,236,227,0) 60%), linear-gradient(180deg, #5A4E3A 0%, #3B3326 50%, #1E1A14 100%)",
    topo: "#ECECE3",
    brief: "Inside a district input store: stacked seed sacks, a storekeeper checking a receipt against a tablet.",
  },
};

export function ImageFrame({
  scene,
  src,
  alt,
  ratio = "4 / 3",
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  children,
  overlay = true,
}: {
  scene: Scene;
  src?: string;
  alt: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  children?: ReactNode;
  overlay?: boolean;
}) {
  const s = SCENES[scene];
  // Callers may position the frame themselves (e.g. absolute inset-0 as a background layer).
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className);
  return (
    <figure
      className={`${positioned ? "" : "relative"} isolate overflow-hidden ${className}`}
      style={{ aspectRatio: ratio }}
      data-photo-brief={s.brief}
    >
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        // Decorative stand-in: nothing meaningful to announce until real photography replaces it.
        <div aria-hidden="true" className="avs-grain absolute inset-0" style={{ background: s.bg }}>
          <Topo lines={14} seed={scene.length} stroke={s.topo} opacity={0.14} />
        </div>
      )}
      {overlay ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(7,21,45,0) 45%, rgba(7,21,45,0.55) 100%)" }}
        />
      ) : null}
      {children ? <div className="absolute inset-0">{children}</div> : null}
    </figure>
  );
}

export const PHOTO_BRIEFS = Object.fromEntries(Object.entries(SCENES).map(([k, v]) => [k, v.brief])) as Record<Scene, string>;
