"use client";

import * as React from "react";
import {
  fieldReports,
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
import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

function DistrictCommandAnalyticsIllustrative({ online }: { online?: boolean }) {
  const submissionTrend = [
    { day: "Mon", subs: 42 },
    { day: "Tue", subs: 58 },
    { day: "Wed", subs: 51 },
    { day: "Thu", subs: 64 },
    { day: "Fri", subs: 48 },
    { day: "Sat", subs: 22 },
    { day: "Sun", subs: 18 },
  ];

  const officerActivity = fieldOfficers.map((f) => ({
    officer: f.name.split(" ")[0] ?? f.name,
    subs: f.activeSubmissions7d,
  }));

  const channelMix = [
    { channel: "Online", count: fieldReports.filter((r) => r.channel === "online").length },
    { channel: "Offline", count: fieldReports.filter((r) => r.channel === "offline").length },
    { channel: "Call center", count: fieldReports.filter((r) => r.channel === "call_center").length },
  ];

  const pendingSync = offlineSyncQueue.reduce((s, q) => s + q.records, 0);

  return (
    <div className="space-y-4">
      <DataSourceNotice source={demoSource("fieldOfficers + fieldReports + offlineSyncQueue")} />

      <InsightRibbon tone={online === false ? "warning" : "success"} title="District field operations">
        {fieldOfficers.length} active officers · {pendingSync} records in offline sync queue · connectivity{" "}
        {online === false ? "OFFLINE — capture continues locally" : "LIVE"}.
      </InsightRibbon>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel>
          <SectionHeader kicker="Velocity" title="Daily submission trend" subtitle="Field capture cadence (pilot)" />
          <div className="mt-4">
            <EnterpriseAreaChart data={submissionTrend} xKey="day" yKey="subs" name="Submissions" height={200} />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Officers" title="Officer workload (7d)" subtitle="Active submissions per officer" />
          <div className="mt-4">
            <EnterpriseBarChart
              layout="vertical"
              data={officerActivity}
              xKey="officer"
              series={[{ dataKey: "subs", fill: CHART_COLORS.forest, name: "Submissions" }]}
              height={200}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Channels" title="Capture channel mix" subtitle="Online · offline · call-center" />
          <div className="mt-4 space-y-2">
            {channelMix.map((c) => (
              <div key={c.channel} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-[13px] text-slate-700">{c.channel}</span>
                <StatusBadge tone={c.channel === "Offline" ? "warning" : "success"}>{c.count}</StatusBadge>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Offline sync queue</p>
            <ul className="mt-2 space-y-1 text-[12px] text-slate-700">
              {offlineSyncQueue.map((q) => (
                <li key={q.id}>
                  {q.deviceId} · {q.records} records · {q.oldestAgeMinutes}m oldest
                </li>
              ))}
            </ul>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

/**
 * These analytics are built from illustrative series, not live records, so they
 * render only in an explicitly illustrative training environment.
 */
export default function DistrictCommandAnalytics(props: React.ComponentProps<typeof DistrictCommandAnalyticsIllustrative>) {
  if (!ILLUSTRATIVE_DATA_ENABLED) return null;
  return <DistrictCommandAnalyticsIllustrative {...props} />;
}
