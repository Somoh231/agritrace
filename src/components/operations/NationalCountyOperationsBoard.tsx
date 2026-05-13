"use client";

import Link from "next/link";

import type { CountyOperationalSnapshot } from "@/lib/ops/county-operational-signals";
import { OpsStatusBadge } from "@/components/pilot/pilot-ui";

function healthTone(h: CountyOperationalSnapshot["warehouseHealth"]) {
  if (h === "stable") return "healthy" as const;
  if (h === "watch") return "warning" as const;
  return "critical" as const;
}

function connectivityLabel(q: CountyOperationalSnapshot["connectivityQuality"]) {
  if (q === "good") return "Stable uplink";
  if (q === "degraded") return "Intermittent";
  return "High risk";
}

export default function NationalCountyOperationsBoard({
  snapshots,
  limit = 9,
}: {
  snapshots: CountyOperationalSnapshot[];
  limit?: number;
}) {
  const slice = snapshots.slice(0, limit);

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">County operational intelligence</div>
          <h2 className="mt-1 font-display text-[17px] font-semibold text-white">Mini command centers · pilot counties</h2>
          <p className="mt-1 max-w-[900px] text-[11px] leading-relaxed text-slate-500">
            Narrative-led panels blend DAO cadence, warehouse posture, verification backlog, connectivity stress, and subsidy scope — optimized
            for national coordination briefings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/map" className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
            Operational map →
          </Link>
          <Link href="/production/county" className="text-[12px] font-medium text-slate-400 hover:text-slate-300">
            County registry →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {slice.map((s) => (
          <article
            key={s.county}
            className="flex flex-col rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-3 text-slate-200 shadow-inner"
          >
            <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[15px] font-semibold text-white">{s.county}</h3>
                  <span className="rounded border border-slate-600 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                    Rank {s.nationalRank}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <OpsStatusBadge status={healthTone(s.warehouseHealth)} />
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                    Confidence {s.reportingConfidenceScore}
                  </span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                    Food risk · {s.foodSecurityRisk}
                  </span>
                </div>
              </div>
              <Link
                href={`/map?county=${encodeURIComponent(s.county)}`}
                className="shrink-0 font-mono text-[9px] text-emerald-400 hover:text-emerald-300"
              >
                Map →
              </Link>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-slate-400">
              <dt>Reporting</dt>
              <dd className="text-right tabular-nums text-emerald-300">{s.reportingCompletionPct}%</dd>
              <dt>Field officers</dt>
              <dd className="text-right tabular-nums text-slate-200">{s.activeFieldOfficers}</dd>
              <dt>Warehouse</dt>
              <dd className="text-right capitalize text-slate-200">{s.warehouseHealth}</dd>
              <dt>Fertilizer avail.</dt>
              <dd className="text-right tabular-nums text-slate-200">{s.fertilizerAvailabilityPct}%</dd>
              <dt>Verification backlog</dt>
              <dd className="text-right tabular-nums text-amber-200/90">{s.verificationBacklog}</dd>
              <dt>Unresolved reports</dt>
              <dd className="text-right tabular-nums text-rose-200/80">{s.unresolvedFieldReports}</dd>
              <dt>District delay idx</dt>
              <dd className="text-right tabular-nums text-slate-200">{s.districtDelayScore}</dd>
              <dt>Connectivity</dt>
              <dd className="text-right text-slate-200">{connectivityLabel(s.connectivityQuality)}</dd>
              <dt>Last sync</dt>
              <dd className="text-right text-[9px] leading-snug text-slate-500">{s.lastSyncDisplay}</dd>
            </dl>

            <div className="mt-2 space-y-1 border-t border-white/[0.05] pt-2 font-mono text-[10px] text-slate-500">
              <div>
                <span className="text-slate-600">Production · </span>
                <span className="text-slate-300">{s.productionTrendLabel}</span>
              </div>
              <div>
                <span className="text-slate-600">Inventory · </span>
                <span className="text-slate-300">{s.inventoryMovementSummary}</span>
              </div>
              <div>
                <span className="text-slate-600">Subsidy · </span>
                <span className="text-slate-300">{s.subsidyAllocationStatus}</span>
              </div>
              <div>
                <span className="text-slate-600">Donor · </span>
                <span className="text-slate-300">{s.donorShipmentNote}</span>
              </div>
            </div>

            {s.auditReconciliationNote ? (
              <div className="mt-2 rounded-md border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 font-mono text-[10px] text-amber-100/90">
                Audit · {s.auditReconciliationNote}
              </div>
            ) : null}

            <div className="mt-2 space-y-1.5">
              {s.narratives.map((n, i) => (
                <p key={i} className="text-[11px] leading-snug text-slate-400">
                  {n}
                </p>
              ))}
            </div>

            {s.operationalAlerts.length ? (
              <ul className="mt-2 space-y-1 border-t border-white/[0.05] pt-2">
                {s.operationalAlerts.map((a, i) => (
                  <li key={i} className="font-mono text-[10px] text-rose-200/85">
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
