"use client";

import StatusBadge from "@/components/enterprise/StatusBadge";

export type StatusPipelineStage = {
  key: string;
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral" | "syncing";
  activeLabel?: string;
};

/** Canonical multi-stage workflow pipeline strip (transfer, verification, etc.). */
export default function StatusPipeline({
  stages,
  counts,
  columnsClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6",
}: {
  stages: StatusPipelineStage[];
  counts: Record<string, number>;
  columnsClass?: string;
}) {
  return (
    <div className={columnsClass}>
      {stages.map((stage) => {
        const n = counts[stage.key] ?? 0;
        const tone = stage.tone ?? "info";
        const activeLabel = stage.activeLabel ?? "Active";
        return (
          <div key={stage.key} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{stage.label}</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink-900">{n}</p>
            {n > 0 ? (
              <div className="mt-1.5 flex justify-center">
                <StatusBadge tone={tone}>{activeLabel}</StatusBadge>
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] text-slate-400">—</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
