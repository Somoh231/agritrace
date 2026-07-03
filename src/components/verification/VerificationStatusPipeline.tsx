"use client";

import { StatusBadge } from "@/components/enterprise";
import { VERIFICATION_PIPELINE } from "@/components/verification/verification-workspace-utils";
import type { VerificationQueueStatus } from "@/features/verification/model/types";
import { verificationStatusTone } from "@/components/verification/verification-workspace-utils";

export default function VerificationStatusPipeline({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {VERIFICATION_PIPELINE.map((stage) => {
        const n = counts[stage.key] ?? 0;
        const tone = verificationStatusTone(stage.key as VerificationQueueStatus);
        return (
          <div key={stage.key} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{stage.label}</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink-900">{n}</p>
            {n > 0 ? (
              <div className="mt-1.5 flex justify-center">
                <StatusBadge tone={tone}>In queue</StatusBadge>
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
