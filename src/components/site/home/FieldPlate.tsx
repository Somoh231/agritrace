/*
 * Schematic field survey plate for the homepage hero. Entirely synthetic
 * geography: no real coordinates, place names, parcel IDs or areas. Survey
 * contours, valley plots along a stream, a laterite road and a district
 * boundary, with one plot outline walked and highlighted. Static SVG built at
 * module load (deterministic), about 16 kB of markup, no map library.
 *
 * Safe zone: the walked plot and its tag sit in the central band of the
 * viewBox, so the 4:3 mobile crop (xMidYMid slice) keeps them in frame.
 */

const W = 560;
const H = 640;

function ring(cx: number, cy: number, r: number, wob: number, ph: number, sx: number) {
  let d = "";
  for (let s = 0; s <= 60; s++) {
    const a = (s / 60) * Math.PI * 2;
    const rr = r + wob * Math.sin(a * 3 + ph) + wob * 0.5 * Math.cos(a * 5 - ph);
    d += `${s === 0 ? "M" : "L"}${(cx + rr * Math.cos(a) * sx).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return `${d}Z`;
}

const HILL_A = Array.from({ length: 8 }, (_, i) => ring(440, 120, 24 + i * 26, 5 + i * 1.6, i * 0.7, 1.25));
const HILL_B = Array.from({ length: 6 }, (_, i) => ring(110, 540, 20 + i * 24, 4 + i * 1.4, i * 0.9, 1.4));

/* Valley plots: a shared vertex grid, lightly irregular, so neighbours meet cleanly. */
const V: Record<string, [number, number]> = {
  a: [150, 206], b: [216, 190], c: [286, 180], d: [352, 172],
  e: [160, 262], f: [229, 246], g: [297, 234], h: [362, 224],
  i: [171, 316], j: [241, 304], k: [308, 290], l: [374, 278],
  m: [183, 370], n: [251, 358], o: [320, 344], p: [386, 334],
};
const PLOTS = ["abfe", "bcgf", "cdhg", "efji", "fgkj", "ghlk", "ijnm", "jkon", "klpo"];
const WALKED = "fgkj";
const pathOf = (key: string) => `M${key.split("").map((c) => V[c].join(" ")).join(" L")}Z`;

export function FieldPlate({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustrative map: survey contours, farm plots along a stream, a road and a district boundary, with one plot outline highlighted. Sample data."
    >
      <rect width={W} height={H} fill="#F1EEE5" />
      <g aria-hidden="true">
        {[70, 210, 350, 490].map((x, i) => (
          <g key={x}>
            <path d={`M${x} 0V${H}`} stroke="#0B2E1A" strokeOpacity="0.06" />
            <text x={x + 4} y="16" fontFamily="var(--av-font-mono)" fontSize="9" fill="#5B6860">
              {"ABCD"[i]}
            </text>
          </g>
        ))}
        {[90, 230, 370, 510].map((y, j) => (
          <g key={y}>
            <path d={`M0 ${y}H${W}`} stroke="#0B2E1A" strokeOpacity="0.06" />
            <text x="6" y={y - 4} fontFamily="var(--av-font-mono)" fontSize="9" fill="#5B6860">
              {j + 1}
            </text>
          </g>
        ))}
        {HILL_A.map((d, i) => (
          <path key={`a${i}`} d={d} fill="none" stroke="#0B2E1A" strokeOpacity="0.15" />
        ))}
        {HILL_B.map((d, i) => (
          <path key={`b${i}`} d={d} fill="none" stroke="#0B2E1A" strokeOpacity="0.13" />
        ))}
        {PLOTS.map((k, i) => (
          <path key={k} d={pathOf(k)} fill={i % 3 ? "#EFE9DC" : "#E6DCC4"} stroke="#0B2E1A" strokeOpacity="0.32" strokeLinejoin="round" />
        ))}
        {/* stream */}
        <path d="M118 160 C 200 210, 232 330, 300 390 S 420 500, 470 640" fill="none" stroke="#9AA7B8" strokeWidth="2" />
        {/* laterite road */}
        <path d="M0 452 C 90 432, 140 452, 200 482 S 330 540, 560 500" fill="none" stroke="#B4564A" strokeOpacity="0.75" strokeWidth="3" />
        {/* district boundary */}
        <path d="M40 96 C 140 136, 200 116, 280 140 S 420 176, 540 214" fill="none" stroke="#0B2E1A" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="7 5" />
        <text x="360" y="160" fontFamily="var(--av-font-mono)" fontSize="9" letterSpacing="1" fill="#5B6860" transform="rotate(14 360 160)">
          DISTRICT BOUNDARY
        </text>
        {[
          [420, 452],
          [432, 462],
          [446, 450],
          [414, 470],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill="#0B2E1A" fillOpacity="0.45" />
        ))}
        {/* the walked plot */}
        <path d={pathOf(WALKED)} fill="rgba(15,163,107,0.16)" className="avs-parcel-fill" />
        <path
          d={pathOf(WALKED)}
          fill="none"
          stroke="#0A7D50"
          strokeWidth="2.5"
          strokeLinejoin="round"
          pathLength={1}
          className="avs-parcel-trace"
        />
        {WALKED.split("").map((c, i) => (
          <circle
            key={c}
            cx={V[c][0]}
            cy={V[c][1]}
            r="4.5"
            fill="#F7F7F2"
            stroke="#0A7D50"
            strokeWidth="2"
            className="avs-parcel-vertex"
            style={{ animationDelay: `${0.5 + i * 0.35}s` }}
          />
        ))}
        <g fontFamily="var(--av-font-mono)" fontSize="10" fill="#0B2E1A">
          <rect x="312" y="248" width="112" height="20" rx="2" fill="#F7F7F2" stroke="#0A7D50" strokeOpacity="0.6" />
          <text x="320" y="262">SAMPLE PLOT 01</text>
        </g>
        <g transform="translate(512 56)">
          <path d="M0 -18 L7 6 L0 1 L-7 6 Z" fill="#0B2E1A" fillOpacity="0.7" />
          <text x="-4" y="22" fontFamily="var(--av-font-mono)" fontSize="10" fill="#0B2E1A">
            N
          </text>
        </g>
        <text x="400" y="612" fontFamily="var(--av-font-mono)" fontSize="9" fill="#5B6860">
          SCHEMATIC · NOT TO SCALE
        </text>
      </g>
    </svg>
  );
}
