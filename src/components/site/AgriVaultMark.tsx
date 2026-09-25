import { useId } from "react";

type Tone = "dark" | "light";

/**
 * Approved AgriVault corporate mark: three nested chevrons cut by a horizontal
 * band, over an emerald base triangle. Geometry is unchanged from the approved
 * artifact. `optical="small"` thickens strokes and drops the band below ~24px,
 * where the 7-unit stroke would render under one device pixel.
 */
export function AgriVaultMark({
  size = 28,
  tone = "dark",
  optical = "auto",
  className,
}: {
  size?: number;
  tone?: Tone;
  optical?: "auto" | "small" | "large";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const small = optical === "small" || (optical === "auto" && size < 24);
  const ink = tone === "dark" ? "#0B2E1A" : "#F7F7F2";
  const stroke = small ? 10 : 7;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      {!small ? (
        <defs>
          <mask id={`avm-${id}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
            <rect x="-20" y="-20" width="140" height="140" fill="#fff" />
            <path d="M53 49H100V58H0V49Z" fill="#000" />
          </mask>
        </defs>
      ) : null}
      <g mask={small ? undefined : `url(#avm-${id})`}>
        <path d="M6 92L50 6L94 92" fill="none" stroke={ink} strokeWidth={stroke} strokeLinejoin="miter" />
        <path d="M21 92L50 35.3L79 92" fill="none" stroke={ink} strokeWidth={stroke} strokeLinejoin="miter" />
        <path d="M36 92L50 64.6L64 92Z" fill="#0FA36B" />
      </g>
    </svg>
  );
}

/** Horizontal lockup: mark + "AgriVault" (medium) + "Data" (regular, muted). */
export function AgriVaultLockup({ tone = "dark", size = 26 }: { tone?: Tone; size?: number }) {
  const color = tone === "dark" ? "#0B2E1A" : "#F7F7F2";
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color }}>
      <AgriVaultMark size={size} tone={tone} />
      <span className="text-[1.0625rem] leading-none tracking-[-0.02em]">
        <span className="font-semibold">AgriVault</span>
        <span className="ml-1 font-normal opacity-70">Data</span>
      </span>
    </span>
  );
}
