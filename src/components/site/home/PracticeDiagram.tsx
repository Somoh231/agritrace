/*
 * One schematic per practice, drawn on a linen mat. Decorative: the practice
 * text beside it carries the meaning. Synthetic labels only.
 */
const INK = "#0B2E1A";
const MUTED = "#5B6860";
const EMERALD = "#0A7D50";
const GOLD = "#8A6A2E";
const ROAD = "#B4564A";
const mono = { fontFamily: "var(--av-font-mono)", fontSize: 10, letterSpacing: 1 } as const;

function Systems() {
  const levels = ["NATIONAL", "COUNTY", "DISTRICT", "FIELD"];
  return (
    <g>
      <path d="M60 50 V250" stroke={INK} strokeOpacity="0.3" />
      {levels.map((l, i) => (
        <g key={l} transform={`translate(0 ${50 + i * 66})`}>
          <circle cx="60" cy="0" r="6" fill="#F7F7F2" stroke={i === 3 ? EMERALD : INK} strokeWidth="2" />
          <rect x="84" y="-16" width={260 - i * 30} height="32" rx="3" fill={i === 3 ? "rgba(15,163,107,0.14)" : "#EFE9DC"} stroke={INK} strokeOpacity="0.25" />
          <text x="98" y="4" {...mono} fill={INK}>
            {l}
          </text>
        </g>
      ))}
      <text x="84" y="286" {...mono} fill={MUTED}>
        ONE RECORD · ROLE-SCOPED ACCESS
      </text>
    </g>
  );
}

function Field() {
  return (
    <g>
      <rect x="40" y="60" width="110" height="170" rx="12" fill="#F7F7F2" stroke={INK} strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M62 170 L108 160 L122 196 L74 206 Z" fill="rgba(15,163,107,0.16)" stroke={EMERALD} strokeWidth="2" />
      <rect x="56" y="84" width="78" height="10" rx="2" fill="#EFE9DC" />
      <rect x="56" y="102" width="60" height="10" rx="2" fill="#EFE9DC" />
      <rect x="56" y="120" width="70" height="10" rx="2" fill="#EFE9DC" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={186 + i * 26} cy="145" r="7" fill={i === 2 ? "#F7F7F2" : GOLD} fillOpacity={i === 2 ? 1 : 0.8} stroke={GOLD} strokeWidth="1.5" />
      ))}
      <text x="170" y="178" {...mono} fill={MUTED}>
        QUEUED ON DEVICE
      </text>
      <path d="M262 145 H300" stroke={INK} strokeOpacity="0.4" strokeDasharray="4 4" />
      <rect x="302" y="120" width="70" height="50" rx="4" fill="#F7F7F2" stroke={EMERALD} strokeWidth="1.5" />
      <path d="M322 146 l8 8 l16 -18" fill="none" stroke={EMERALD} strokeWidth="2.2" />
      <text x="292" y="196" {...mono} fill={MUTED}>
        REVIEWED ABOVE
      </text>
    </g>
  );
}

function Gis() {
  return (
    <g>
      {[80, 150, 220, 290, 360].map((x) => (
        <path key={x} d={`M${x} 30 V270`} stroke={INK} strokeOpacity="0.07" />
      ))}
      {[70, 130, 190, 250].map((y) => (
        <path key={y} d={`M30 ${y} H390`} stroke={INK} strokeOpacity="0.07" />
      ))}
      <path d="M30 120 C 120 150, 200 110, 390 170" fill="none" stroke={INK} strokeOpacity="0.5" strokeDasharray="6 5" />
      <path d="M40 250 C 140 226, 250 262, 390 234" fill="none" stroke={ROAD} strokeWidth="2.5" strokeOpacity="0.7" />
      <path d="M150 150 L236 136 L256 206 L168 222 Z" fill="rgba(15,163,107,0.16)" stroke={EMERALD} strokeWidth="2.5" strokeLinejoin="round" />
      {[
        [150, 150],
        [236, 136],
        [256, 206],
        [168, 222],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#F7F7F2" stroke={EMERALD} strokeWidth="2" />
      ))}
      <text x="266" y="150" {...mono} fill={INK}>
        OUTLINE WALKED
      </text>
      <text x="266" y="166" {...mono} fill={MUTED}>
        LINKED TO FARMER
      </text>
      <text x="40" y="108" {...mono} fill={MUTED}>
        DISTRICT A
      </text>
    </g>
  );
}

function Supply() {
  const steps = ["REQUESTED", "APPROVED", "DISPATCHED", "DELIVERED"];
  return (
    <g>
      <rect x="30" y="100" width="80" height="70" rx="3" fill="#EFE9DC" stroke={INK} strokeOpacity="0.35" />
      <path d="M30 100 L70 76 L110 100" fill="none" stroke={INK} strokeOpacity="0.35" />
      <text x="36" y="192" {...mono} fill={MUTED}>
        WAREHOUSE A
      </text>
      <rect x="310" y="100" width="80" height="70" rx="3" fill="#EFE9DC" stroke={INK} strokeOpacity="0.35" />
      <path d="M310 100 L350 76 L390 100" fill="none" stroke={INK} strokeOpacity="0.35" />
      <text x="316" y="192" {...mono} fill={MUTED}>
        WAREHOUSE B
      </text>
      <path d="M118 135 H302" stroke={GOLD} strokeWidth="2" strokeDasharray="5 4" />
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${136 + i * 50} 135)`}>
          <circle r="7" fill={i < 3 ? EMERALD : "#F7F7F2"} stroke={EMERALD} strokeWidth="1.5" />
          <text x="0" y={i % 2 ? 30 : -18} textAnchor="middle" {...mono} fontSize={8.5} fill={INK}>
            {s}
          </text>
        </g>
      ))}
      <text x="118" y="240" {...mono} fill={MUTED}>
        EACH STEP ATTRIBUTED
      </text>
    </g>
  );
}

function Reporting() {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(34 ${62 + i * 30})`}>
          <rect width="118" height="20" rx="2" fill="#F7F7F2" stroke={INK} strokeOpacity="0.25" />
          <circle cx="12" cy="10" r="4" fill={EMERALD} />
          <rect x="24" y="7" width="70" height="6" rx="1" fill="#EFE9DC" />
        </g>
      ))}
      <text x="34" y="228" {...mono} fill={MUTED}>
        APPROVED RECORDS
      </text>
      <path d="M160 72 L220 128 M160 196 L220 144" stroke={INK} strokeOpacity="0.3" />
      <rect x="226" y="60" width="160" height="150" rx="4" fill="#F7F7F2" stroke={INK} strokeOpacity="0.35" />
      <rect x="242" y="78" width="80" height="8" rx="1" fill={INK} fillOpacity="0.5" />
      {[48, 72, 58, 88].map((h, i) => (
        <rect key={i} x={250 + i * 30} y={194 - h} width="18" height={h} fill={i === 3 ? EMERALD : "#D9C28A"} />
      ))}
      <text x="226" y="228" {...mono} fill={MUTED}>
        REPORT · LINKS BACK TO SOURCE
      </text>
    </g>
  );
}

function Programmes() {
  const labels = ["DIAGNOSIS", "DESIGN", "DEPLOY", "OPERATE", "MEASURE", "TRANSFER"];
  return (
    <g>
      <path d="M40 150 C 120 60, 300 60, 380 150" fill="none" stroke={INK} strokeOpacity="0.3" />
      {labels.map((l, i) => {
        const t = i / 5;
        const x = 40 + 340 * t;
        const y = 150 - Math.sin(Math.PI * t) * 68;
        return (
          <g key={l}>
            <circle cx={x} cy={y} r="9" fill={i < 3 ? EMERALD : "#F7F7F2"} stroke={EMERALD} strokeWidth="1.5" />
            <text x={x} y={y + 4} textAnchor="middle" {...mono} fontSize={9} fill={i < 3 ? "#fff" : INK}>
              {i + 1}
            </text>
            <text x={x} y={i % 2 ? y + 30 : y - 18} textAnchor="middle" {...mono} fontSize={8.5} fill={MUTED}>
              {l}
            </text>
          </g>
        );
      })}
      <text x="40" y="236" {...mono} fill={MUTED}>
        ONE ACCOUNTABLE TEAM · PHASED
      </text>
    </g>
  );
}

const DIAGRAMS: Record<string, () => JSX.Element> = {
  systems: Systems,
  field: Field,
  gis: Gis,
  supply: Supply,
  reporting: Reporting,
  programmes: Programmes,
};

export function PracticeDiagram({ id, className = "" }: { id: string; className?: string }) {
  const D = DIAGRAMS[id] ?? Systems;
  return (
    <svg viewBox="0 0 420 300" aria-hidden="true" focusable="false" className={className}>
      <D />
    </svg>
  );
}
