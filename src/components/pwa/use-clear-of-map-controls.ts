"use client";

import * as React from "react";

/** Mapbox control corners: attribution (Mapbox / OpenStreetMap / Maxar), wordmark and map controls. */
const MAP_CONTROL_CORNERS =
  ".mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-top-right, .mapboxgl-ctrl-top-left";
const GAP = 8;

type Box = { top: number; bottom: number; left: number; right: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right + GAP && a.right > b.left - GAP && a.top < b.bottom + GAP && a.bottom > b.top - GAP;

/**
 * Returns how far (px) a fixed element must be lifted so it never covers a
 * Mapbox control corner. Re-measures on scroll (including inner scroll
 * containers), resize and DOM changes, throttled to one measure per frame.
 */
export function useClearOfMapControls(ref: React.RefObject<HTMLElement | null>, enabled: boolean): number {
  const [lift, setLift] = React.useState(0);
  const liftRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Resting position = current position with the current lift undone.
      const rest: Box = { top: r.top + liftRef.current, bottom: r.bottom + liftRef.current, left: r.left, right: r.right };
      const obstacles: Box[] = Array.from(document.querySelectorAll<HTMLElement>(MAP_CONTROL_CORNERS))
        .filter((c) => c.childElementCount > 0)
        .map((c) => c.getBoundingClientRect())
        .filter((b) => b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < window.innerHeight);

      const box = { ...rest };
      for (let pass = 0, moved = true; moved && pass < 8; pass++) {
        moved = false;
        for (const o of obstacles) {
          if (!overlaps(box, o)) continue;
          const shift = box.bottom - (o.top - GAP);
          box.top -= shift;
          box.bottom -= shift;
          moved = true;
        }
      }
      const next = Math.min(Math.max(0, rest.bottom - box.bottom), Math.max(0, rest.top - GAP));
      if (Math.abs(next - liftRef.current) > 0.5) {
        liftRef.current = next;
        setLift(next);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [enabled, ref]);

  return lift;
}
