"use client";

import * as React from "react";

import { sampleDaoTasksForJurisdiction } from "@/lib/dao/dao-sample-workflow";

export default function DaoTodaysTasksPanel({
  county,
  district,
}: {
  county: string | null;
  district: string | null;
}) {
  const { visits, reports } = React.useMemo(() => sampleDaoTasksForJurisdiction(county, district), [county, district]);
  const overdue = reports.filter((r) => r.overdueCount > 0);

  return (
    <section id="dao-todays-tasks" className="scroll-mt-24 rounded-xl border border-slate-700/90 bg-slate-950/55 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Today&apos;s DAO tasks</h2>
        <p className="text-[11px] text-slate-500">
          Route samples align to your county / district scope when provided — verify against live ministry assignments on network.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Assigned farmer visits</h3>
          <ul className="mt-2 space-y-2">
            {visits.map((v) => (
              <li
                key={v.id}
                className={`rounded-lg border px-3 py-2 text-[12px] ${
                  v.priority === "high" ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-50" : "border-slate-800 bg-slate-900/40 text-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-white">{v.farmerName}</span>
                  {v.registryHint ? <span className="font-mono text-[10px] text-slate-500">{v.registryHint}</span> : null}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {v.county} · {v.district}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">{v.dueLabel}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">Reports &amp; deadlines</h3>
          {overdue.length ? (
            <div className="mt-2 rounded-lg border border-rose-800/45 bg-rose-950/25 px-3 py-2 text-[12px] text-rose-50">
              <div className="font-semibold text-rose-100">Overdue ({overdue.reduce((a, r) => a + r.overdueCount, 0)} items)</div>
              <ul className="mt-2 space-y-1">
                {overdue.map((r) => (
                  <li key={r.id}>
                    {r.label}
                    <span className="ml-2 font-mono text-[11px] text-rose-200/80">×{r.overdueCount}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-3 text-[12px] text-slate-400">No overdue DAO reports in this sample set.</p>
          )}
          <ul className="mt-3 space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2 text-[12px] text-slate-300">
                <span>{r.label}</span>
                <span className={r.overdueCount ? "text-rose-300" : "text-emerald-400/90"}>{r.overdueCount ? `Overdue ×${r.overdueCount}` : "On track"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
