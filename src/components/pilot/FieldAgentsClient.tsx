"use client";

import * as React from "react";

import DaoMonitoringAnalytics from "@/components/intelligence/DaoMonitoringAnalytics";
import { OpsSectionTitle, PilotDatasetNotice } from "@/components/pilot/pilot-ui";
import {
  callCenterSubmissions,
  fieldReports,
  offlineSyncQueue,
} from "@/lib/demo/agriculture-pilot-data";
import { DashboardPanel, SectionHeader } from "@/components/enterprise";

export default function FieldAgentsClient() {
  const openEscalations = callCenterSubmissions.filter((c) => !c.resolved).length;
  const totalQueue = offlineSyncQueue.reduce((s, q) => s + q.records, 0);

  return (
    <div className="space-y-6 pb-8">
      <OpsSectionTitle
        kicker="Field layer"
        title="DAO monitoring · field operations intelligence"
        subtitle="Operational analytics for review velocity, backlog health, district comparisons, and connectivity risk — management insights over raw lists."
      />
      <PilotDatasetNotice />

      <DaoMonitoringAnalytics />

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Queue" title="Offline submissions pending sync" subtitle={`${totalQueue} records across devices`} />
          <ul className="mt-4 space-y-2 font-mono text-[11px] text-slate-800">
            {offlineSyncQueue.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                {q.deviceId} · {q.county} · {q.records} records · oldest {q.oldestAgeMinutes}m
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Support" title="Call-center assisted reports" subtitle={`${openEscalations} open escalations`} />
          <ul className="mt-4 space-y-2 text-[12px] text-slate-700">
            {callCenterSubmissions.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                <div className="font-medium text-ink-900">{c.topic}</div>
                <div className="mt-0.5 text-[11px] text-slate-600">
                  {c.county} · {c.agent} · {c.resolved ? "Resolved" : "Open"}
                </div>
              </li>
            ))}
          </ul>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Activity" title="Recent field operational notes" subtitle="Production and verification signals" />
        <ul className="mt-4 space-y-2 text-[12px] text-slate-700">
          {fieldReports.map((r) => (
            <li key={r.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{r.channel}</span>
              {" · "}
              {r.county} · {r.summary}
            </li>
          ))}
        </ul>
      </DashboardPanel>
    </div>
  );
}
