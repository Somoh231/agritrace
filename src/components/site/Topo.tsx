/**
 * Deterministic topographic contour lines (no randomness, so server and client
 * render identically). Purely decorative: aria-hidden, pointer-events none.
 */
function contourPath(i: number, count: number, w: number, h: number, seed: number) {
  const baseY = ((i + 0.5) / count) * h;
  const amp = h / count * (0.9 + 0.5 * Math.sin(seed + i * 0.7));
  const f1 = 1.2 + 0.4 * Math.sin(seed * 0.9);
  const f2 = 2.7 + 0.6 * Math.cos(seed * 1.3);
  const steps = 48;
  let d = "";
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = t * w;
    const y =
      baseY +
      amp * 0.55 * Math.sin(t * Math.PI * f1 + i * 0.45 + seed) +
      amp * 0.25 * Math.sin(t * Math.PI * f2 - i * 0.3 + seed * 2) +
      amp * 0.12 * Math.cos(t * Math.PI * 5.1 + i);
    d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function Topo({
  lines = 18,
  seed = 1,
  className = "",
  stroke = "currentColor",
  opacity = 0.18,
  emphasis,
}: {
  lines?: number;
  seed?: number;
  className?: string;
  stroke?: string;
  opacity?: number;
  /** index of one contour drawn heavier (an "index contour" as on survey maps) */
  emphasis?: number;
}) {
  const w = 1600;
  const h = 1000;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      {Array.from({ length: lines }, (_, i) => (
        <path
          key={i}
          d={contourPath(i, lines, w, h, seed)}
          fill="none"
          stroke={stroke}
          strokeOpacity={i === emphasis ? Math.min(1, opacity * 2.4) : opacity}
          strokeWidth={i === emphasis ? 1.4 : 1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
