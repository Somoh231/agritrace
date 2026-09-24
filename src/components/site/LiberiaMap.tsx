import { LIBERIA_COUNTIES, LIBERIA_VIEWBOX } from "@/lib/site/liberia-geo";

/**
 * Liberia's 15 counties from real boundary geometry (see
 * scripts/build-liberia-geo.mjs). Pilot counties are highlighted; everything
 * else is context. Static SVG — no map library, no network requests.
 */
export function LiberiaMap({
  highlight = ["nimba", "bong", "lofa"],
  tone = "light",
  labels = "highlight",
  title = "Map of Liberia's fifteen counties. Nimba, Bong and Lofa, the pilot counties, are highlighted.",
  className = "",
  titleId = "lbr-map-title",
}: {
  highlight?: string[];
  tone?: "light" | "dark";
  labels?: "none" | "highlight" | "all";
  title?: string;
  className?: string;
  /** unique per page when the map appears more than once */
  titleId?: string;
}) {
  const dark = tone === "dark";
  const base = dark ? { fill: "rgba(247,247,242,0.035)", stroke: "rgba(247,247,242,0.28)" } : { fill: "rgba(11,46,26,0.035)", stroke: "rgba(11,46,26,0.32)" };
  const hi = dark ? { fill: "rgba(111,211,164,0.22)", stroke: "#6FD3A4" } : { fill: "rgba(15,163,107,0.2)", stroke: "#0A7D50" };
  const labelColor = dark ? "#F7F7F2" : "#0B2E1A";
  const mutedLabel = dark ? "rgba(247,247,242,0.55)" : "rgba(74,91,80,0.9)";
  return (
    <svg viewBox={LIBERIA_VIEWBOX} role="img" aria-labelledby={titleId} className={className}>
      <title id={titleId}>{title}</title>
      <g>
        {LIBERIA_COUNTIES.map((c) => {
          const on = highlight.includes(c.id);
          return (
            <path
              key={c.id}
              d={c.path}
              fill={on ? hi.fill : base.fill}
              stroke={on ? hi.stroke : base.stroke}
              strokeWidth={on ? 1.6 : 0.9}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
      {labels !== "none" ? (
        <g aria-hidden="true" style={{ fontFamily: "var(--av-font-mono)", letterSpacing: "0.12em" }}>
          {LIBERIA_COUNTIES.filter((c) => labels === "all" || highlight.includes(c.id)).map((c) => {
            const on = highlight.includes(c.id);
            return (
              <text
                key={c.id}
                x={c.label[0]}
                y={c.label[1]}
                textAnchor="middle"
                fontSize={on ? 22 : 15}
                fill={on ? labelColor : mutedLabel}
                style={{ textTransform: "uppercase" }}
              >
                {c.name}
              </text>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}
