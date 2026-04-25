import * as React from "react";

type DeltaDirection = "up" | "down" | "neutral" | "warning";
type AccentColor = "green" | "amber" | "red" | "blue";

const ACCENT: Record<AccentColor, string> = {
  green: "border-l-green-600",
  amber: "border-l-amber-500",
  red: "border-l-red-500",
  blue: "border-l-blue-500",
};

const DELTA: Record<DeltaDirection, string> = {
  up: "text-green-600",
  down: "text-green-600",
  warning: "text-amber-600",
  neutral: "text-gray-500",
};

export default function KPICard({
  label,
  value,
  delta,
  deltaDirection = "neutral",
  accentColor = "green",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: DeltaDirection;
  accentColor?: AccentColor;
}) {
  return (
    <div className={`av-card-muted p-4 border-l-2 ${ACCENT[accentColor]}`}>
      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-[2px] mb-2">
        {label}
      </div>
      <div className="font-display text-[28px] text-ink-900 leading-none mb-1">
        {value}
      </div>
      {delta ? (
        <div className={`text-[11px] ${DELTA[deltaDirection]}`}>{delta}</div>
      ) : (
        <div className="text-[11px] text-slate-400">—</div>
      )}
    </div>
  );
}

