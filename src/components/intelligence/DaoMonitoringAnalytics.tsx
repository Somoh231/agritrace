"use client";

import {
  callCenterSubmissions,
  connectivityRiskByCounty,
  districtAgOfficersSample,
  fieldOfficers,
  offlineSyncQueue,
} from "@/lib/demo/agriculture-pilot-data";
import { demoSource } from "@/lib/data/data-source";
import {
  DashboardPanel,
  SectionHeader,
  StatusBadge,
  DataSourceNotice,
} from "@/components/enterprise";
import {
  CHART_COLORS,
  EnterpriseAreaChart,
  EnterpriseBarChart,
  InsightRibbon,
} from "@/components/enterprise/analytics";
import { illustrativeCaption } from "@/lib/data/illustrative-policy";

export default function DaoMonitoringAnalytics() {
  const reviewVelocity = [
    { day: "Mon", reviews: 28 },
    { day: "Tue", reviews: 34 },
    { day: "Wed", reviews: 31 },
    { day: "Thu", reviews: 42 },
    { day: "Fri", reviews: 38 },
  ];

  const districtCompare = [...districtAgOfficersSample, ...fieldOfficers].map((d) => ({
    unit: d.name.length > 16 ? d.name.slice(0, 15) + "…" : d.name,
    subs: d.activeSubmissions7d,
  }));

  const backlogAging = offlineSyncQueue.map((q) => ({
    county: q.county,
    minutes: q.oldestAgeMinutes,
    records: q.records,
  }));

  const openEscalations = callCenterSubmissions.filter((c) => !c.resolved).length;
  const totalQueue = offlineSyncQueue.reduce((s, q) => s + q.records, 0);

  return (
    <div className="space-y-4">
      <DataSourceNotice source={demoSource("fieldOfficers + districtAgOfficers + offlineSyncQueue + callCenter")} />

      <InsightRibbon tone={openEscalations > 0 ? "warning" : "info"} title="DAO monitoring · management insights">
        Review velocity averaging {Math.round(reviewVelocity.reduce((s, r) => s + r.reviews, 0) / reviewVelocity.length)} decisions/day.
        {totalQueue} records awaiting sync · {openEscalations} call-center escalations open.
      </InsightRibbon>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Review velocity</p>
          <p className="ent-metric mt-1">34/day</p>
          <p className="mt-1 text-[12px] text-slate-500">7-day average</p>
        </div>
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Backlog</p>
          <p className="ent-metric mt-1">{totalQueue}</p>
          <p className="mt-1 text-[12px] text-slate-500">Offline pending sync</p>
        </div>
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Correction rate</p>
          <p className="ent-metric mt-1">8.2%</p>
          <p className="mt-1 text-[12px] text-slate-500">Returned to CLAN</p>
        </div>
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Queue health</p>
          <p className="ent-metric mt-1">{openEscalations > 0 ? "Watch" : "Stable"}</p>
          <p className="mt-1 text-[12px] text-slate-500">{openEscalations} escalations</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Velocity" title="Review throughput" subtitle={illustrativeCaption("Daily DAO decisions")} />
          <div className="mt-4">
            <EnterpriseAreaChart data={reviewVelocity} xKey="day" yKey="reviews" name="Reviews" color={CHART_COLORS.navy} height={220} />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Comparison" title="District submission load" subtitle="Active submissions · 7 days" />
          <div className="mt-4">
            <EnterpriseBarChart
              layout="vertical"
              data={districtCompare}
              xKey="unit"
              series={[{ dataKey: "subs", fill: CHART_COLORS.forest, name: "Submissions" }]}
              height={220}
            />
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Aging" title="Submission sync aging" subtitle="Oldest pending record by device" />
          <div className="mt-4">
            <EnterpriseBarChart
              data={backlogAging}
              xKey="county"
              series={[{ dataKey: "minutes", fill: CHART_COLORS.amber, name: "Oldest (min)" }]}
              height={200}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Connectivity" title="County connectivity risk" subtitle="Offline-first advisory scores" />
          <div className="mt-4 space-y-2">
            {connectivityRiskByCounty.map((r) => (
              <div key={r.county} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-[13px] font-medium text-ink-900">{r.county}</p>
                  <p className="text-[11px] text-slate-500">{r.note}</p>
                </div>
                <StatusBadge tone={r.riskScore > 70 ? "danger" : r.riskScore > 50 ? "warning" : "success"}>
                  {r.riskScore}
                </StatusBadge>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
