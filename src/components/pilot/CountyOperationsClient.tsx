"use client";

import * as React from "react";

import { countyAgOfficers, countyOperationsCards, dataQualityAlerts } from "@/lib/demo/agriculture-pilot-data";

import { OpsCard, OpsMetric, OpsSectionTitle, OpsStatusBadge, PilotDatasetNotice } from "@/components/pilot/pilot-ui";

export default function CountyOperationsClient() {
  return (
    <div className="space-y-5">
      <OpsSectionTitle
        kicker="County coordination"
        title="County agricultural operations"
        subtitle="County Agricultural Officer workflow · verification backlog, inputs, field intelligence, and warehouse coordination."
      />
      <PilotDatasetNotice />

      <div className="grid gap-4 lg:grid-cols-3">
        {countyOperationsCards.map((c) => (
          <OpsCard key={c.county}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-display text-[16px] font-semibold text-slate-900">{c.county}</div>
              <OpsStatusBadge status={c.diseaseAlerts > 0 ? "warning" : "healthy"} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
              <OpsMetric label="Pending verification" value={String(c.pendingVerification)} tone="amber" />
              <OpsMetric label="Input progress" value={`${c.inputProgressPct}%`} tone="forest" />
              <OpsMetric label="Field reports (7d)" value={String(c.fieldReports7d)} tone="navy" />
              <OpsMetric label="Disease alerts" value={String(c.diseaseAlerts)} tone="rose" />
              <OpsMetric label="Warehouse requests" value={String(c.warehouseRequests)} tone="navy" />
              <OpsMetric label="Data quality issues" value={String(c.dqIssues)} tone="amber" />
            </div>
          </OpsCard>
        ))}
      </div>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Follow-up queues · data quality</div>
        <ul className="mt-3 space-y-2">
          {dataQualityAlerts.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <div className="text-[12px] font-medium text-slate-900">{a.title}</div>
                {a.county ? <div className="text-[11px] text-slate-600">{a.county}</div> : null}
              </div>
              <OpsStatusBadge status={a.severity} />
            </li>
          ))}
        </ul>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">County Agricultural Officers (illustrative roster)</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {countyAgOfficers.slice(0, 9).map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-100 px-3 py-2 text-[12px] text-slate-800">
              <div className="font-medium text-slate-900">{o.county}</div>
              <div className="text-[11px] text-slate-600">{o.name}</div>
              <div className="font-mono text-[10px] text-slate-500">Submissions 7d · {o.activeSubmissions7d}</div>
            </div>
          ))}
        </div>
      </OpsCard>
    </div>
  );
}
