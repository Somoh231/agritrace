"use client";

import * as React from "react";

import { sampleDaoTasksForJurisdiction } from "@/lib/dao/dao-sample-workflow";
import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

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
    <section id="dao-todays-tasks" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-[15px] font-semibold text-ink-900">Today&apos;s DAO tasks</h2>
        <p className="text-[11px] text-slate-600">
          {ILLUSTRATIVE_DATA_ENABLED
            ? "Training environment: illustrative visits, not live assignments."
            : "Visit scheduling is not yet connected to live assignments. Use the verification queue for work that needs action."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-700">Assigned farmer visits</h3>
          {visits.length === 0 ? (
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
              No farmer visits are scheduled for you.
            </p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {visits.map((v) => (
              <li
                key={v.id}
                className={`rounded-lg border px-3 py-2 text-[12px] ${
                  v.priority === "high" ? "border-forest-200 bg-forest-50 text-forest-900" : "border-slate-200 bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink-900">{v.farmerName}</span>
                  {v.registryHint ? <span className="font-mono text-[10px] text-slate-500">{v.registryHint}</span> : null}
                </div>
                <div className="mt-1 text-[11px] text-slate-600">
                  {v.county} · {v.district}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">{v.dueLabel}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">Reports &amp; deadlines</h3>
          {overdue.length ? (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
              <div className="font-semibold text-rose-800">Overdue ({overdue.reduce((a, r) => a + r.overdueCount, 0)} items)</div>
              <ul className="mt-2 space-y-1">
                {overdue.map((r) => (
                  <li key={r.id}>
                    {r.label}
                    <span className="ml-2 font-mono text-[11px] text-rose-700">×{r.overdueCount}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">No overdue DAO reports.</p>
          )}
          <ul className="mt-3 space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
                <span>{r.label}</span>
                <span className={r.overdueCount ? "text-rose-700 font-medium" : "text-emerald-700"}>{r.overdueCount ? `Overdue ×${r.overdueCount}` : "On track"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
