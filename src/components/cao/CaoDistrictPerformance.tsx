"use client";

import type { CaoDistrictCard } from "@/lib/cao/cao-district-cards";
import { OpsStatusBadge } from "@/components/pilot/pilot-ui";

function complianceTone(pct: number): "healthy" | "warning" | "critical" {
  if (pct >= 88) return "healthy";
  if (pct >= 72) return "warning";
  return "critical";
}

export default function CaoDistrictPerformance({ cards }: { cards: CaoDistrictCard[] }) {
  if (!cards.length) {
    return (
      <section className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-[12px] text-slate-500">
        No district DAO assignments found for this county scope.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-white">District performance</h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Composite view of production posture, registry momentum, subsidy completion, and DAO reporting compliance — scoped to your county.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <article key={c.district} className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">District</div>
                <div className="font-display text-[16px] font-semibold text-white">{c.district}</div>
              </div>
              <OpsStatusBadge status={complianceTone(c.reportingCompliancePct)} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
              <div>
                <dt className="text-slate-500">Production index</dt>
                <dd className="font-mono text-emerald-200/90">{c.productionIndex}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Farmer registration</dt>
                <dd className="font-mono text-slate-200">{c.farmerRegProgressPct}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">Subsidy completion</dt>
                <dd className="font-mono text-amber-200/90">{c.subsidyCompletionPct}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">DAO activity score</dt>
                <dd className="font-mono text-sky-200/90">{c.daoActivityScore}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Food security risk</dt>
                <dd className="text-slate-200">{c.foodSecurityRisk}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Reporting compliance</dt>
                <dd className="font-mono text-slate-100">{c.reportingCompliancePct}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
