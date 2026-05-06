import type { PilotStatus } from "@/lib/demo/agriculture-pilot-data";
import { PILOT_DATA_LABEL } from "@/lib/demo/agriculture-pilot-data";

export function PilotDatasetNotice({ variant = "default" }: { variant?: "default" | "compact" }) {
  return (
    <div
      className={
        variant === "compact"
          ? "rounded-lg border border-indigo-100 bg-indigo-50/90 px-3 py-2 text-[11px] text-indigo-950 leading-snug"
          : "rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-[12px] text-indigo-950 leading-relaxed"
      }
      role="status"
    >
      <span className="font-semibold text-indigo-950">Pilot dataset · </span>
      Using illustrative national pilot figures while live Ministry data connections are finalized.{" "}
      <span className="font-mono text-[10px] text-indigo-800/90">({PILOT_DATA_LABEL})</span>
    </div>
  );
}

export function OpsStatusBadge({ status }: { status: PilotStatus }) {
  const cfg =
    status === "healthy"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : status === "warning"
        ? "bg-amber-50 text-amber-950 border-amber-200"
        : "bg-red-50 text-red-950 border-red-200";
  const label = status === "healthy" ? "Healthy" : status === "warning" ? "Watch" : "Critical";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cfg}`}>
      {label}
    </span>
  );
}

export function OpsSectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      {kicker ? (
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{kicker}</div>
      ) : null}
      <h2 className="font-display text-lg font-semibold tracking-tight text-[#0f172a]">{title}</h2>
      {subtitle ? <p className="mt-1 text-[12px] text-slate-600 max-w-[820px]">{subtitle}</p> : null}
    </div>
  );
}

export function OpsCard({
  children,
  className = "",
  dense = false,
}: {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white shadow-sm ${dense ? "p-3.5" : "p-4"} ${className}`}
    >
      {children}
    </div>
  );
}

export function OpsMetric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "forest" | "navy" | "amber" | "rose";
}) {
  const edge =
    tone === "forest"
      ? "border-l-[3px] border-l-[#14532d]"
      : tone === "navy"
        ? "border-l-[3px] border-l-[#1e3a5f]"
        : tone === "amber"
          ? "border-l-[3px] border-l-[#b45309]"
          : tone === "rose"
            ? "border-l-[3px] border-l-[#be123c]"
            : "border-l-[3px] border-l-slate-300";
  return (
    <div className={`rounded-lg bg-slate-50/80 pl-3 pr-3 py-2.5 ${edge}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 font-display text-xl font-semibold tabular-nums text-[#0f172a]">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-600">{hint}</div> : null}
    </div>
  );
}
