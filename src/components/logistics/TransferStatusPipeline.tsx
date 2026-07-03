"use client";

import { StatusBadge } from "@/components/enterprise";
import type { TransferWorkflowStatus } from "@/lib/logistics/types";

const PIPELINE: { key: TransferWorkflowStatus | "delivered" | "completed"; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "dispatched", label: "Dispatched" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Received" },
  { key: "completed", label: "Verified" },
  { key: "disputed", label: "Disputed" },
];

export default function TransferStatusPipeline({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {PIPELINE.map((stage) => {
        const n = counts[stage.key] ?? 0;
        const tone =
          stage.key === "disputed" ? "danger" : stage.key === "requested" ? "warning" : stage.key === "completed" ? "success" : "info";
        return (
          <div key={stage.key} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{stage.label}</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink-900">{n}</p>
            {n > 0 ? (
              <div className="mt-1.5 flex justify-center">
                <StatusBadge tone={tone}>Active</StatusBadge>
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

export function buildTransferStatusCounts(orders: { status: TransferWorkflowStatus }[]) {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  }
  return counts;
}
