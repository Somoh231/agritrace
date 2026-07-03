"use client";

import StatusPipeline from "@/components/enterprise/StatusPipeline";
import type { TransferWorkflowStatus } from "@/lib/logistics/types";

const PIPELINE: {
  key: TransferWorkflowStatus | "delivered" | "completed";
  label: string;
  tone?: "success" | "warning" | "danger" | "info";
}[] = [
  { key: "requested", label: "Requested", tone: "warning" },
  { key: "approved", label: "Approved", tone: "info" },
  { key: "dispatched", label: "Dispatched", tone: "info" },
  { key: "in_transit", label: "In transit", tone: "info" },
  { key: "delivered", label: "Received", tone: "info" },
  { key: "completed", label: "Verified", tone: "success" },
  { key: "disputed", label: "Disputed", tone: "danger" },
];

/** @deprecated Use `StatusPipeline` from `@/components/enterprise` directly. */
export default function TransferStatusPipeline({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <StatusPipeline
      stages={PIPELINE}
      counts={counts}
      columnsClass="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
    />
  );
}

export function buildTransferStatusCounts(orders: { status: TransferWorkflowStatus }[]) {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  }
  return counts;
}
