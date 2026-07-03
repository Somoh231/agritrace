"use client";

import { cn } from "@/components/enterprise/cn";

export default function UtilizationGauge({
  label,
  value,
  max = 100,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tone = pct >= 92 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div className={cn("rounded-xl border border-slate-200/80 bg-white px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-700 leading-snug">{label}</span>
        <span className="font-mono text-[13px] font-semibold tabular-nums text-ink-900">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
