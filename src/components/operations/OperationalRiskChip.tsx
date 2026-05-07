"use client";

import type { OperationalChipVariant } from "@/lib/ops/operational-chip-types";

export type { OperationalChipVariant };

const LABELS: Record<OperationalChipVariant, string> = {
  high_risk: "High risk",
  awaiting_verification: "Awaiting verification",
  compliance_delay: "Compliance delay",
  escalated: "Escalated",
  inventory_risk: "Inventory risk",
  connectivity_issue: "Connectivity issue",
  donor_flagged: "Donor flagged",
};

const CLS: Record<OperationalChipVariant, string> = {
  high_risk: "border-rose-500/25 bg-rose-950/40 text-rose-100/95",
  awaiting_verification: "border-slate-600 bg-slate-900/80 text-slate-300",
  compliance_delay: "border-amber-500/25 bg-amber-950/35 text-amber-100/90",
  escalated: "border-orange-500/25 bg-orange-950/30 text-orange-100/90",
  inventory_risk: "border-violet-500/20 bg-violet-950/25 text-violet-100/85",
  connectivity_issue: "border-sky-500/20 bg-sky-950/25 text-sky-100/85",
  donor_flagged: "border-fuchsia-500/20 bg-fuchsia-950/25 text-fuchsia-100/85",
};

export function OperationalRiskChip({ variant }: { variant: OperationalChipVariant }) {
  return (
    <span className={`inline-flex max-w-full shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${CLS[variant]}`}>
      {LABELS[variant]}
    </span>
  );
}

export function OperationalRiskChipRow({ variants }: { variants: OperationalChipVariant[] }) {
  if (!variants.length) return <span className="text-slate-600">—</span>;
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {variants.map((v) => (
        <OperationalRiskChip key={v} variant={v} />
      ))}
    </div>
  );
}
