"use client";

import * as React from "react";
import {
  countyOperationsCards,
  countyProductionPerformance,
  farmerRegistrationPipeline,
} from "@/lib/demo/agriculture-pilot-data";
import { demoSource } from "@/lib/data/data-source";
import {
  DashboardPanel,
  DataSourceNotice,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import {
  CHART_COLORS,
  EnterpriseAreaChart,
  EnterpriseBarChart,
  InsightRibbon,
} from "@/components/enterprise/analytics";
import { illustrativeCaption } from "@/lib/data/illustrative-policy";
import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

const nf = (n: number) => Intl.NumberFormat().format(n);

function CountyIntelligenceAnalyticsIllustrative({ county }: { county?: string | null }) {
  const scoped = county
    ? countyProductionPerformance.filter((c) => c.county.toLowerCase().includes((county ?? "").toLowerCase()))
    : countyProductionPerformance.slice(0, 8);

  const opsCards = county
    ? countyOperationsCards.filter((c) => c.county.toLowerCase().includes((county ?? "").toLowerCase()))
    : countyOperationsCards;

  const verificationTrend = [
    { week: "W1", pending: 420 },
    { week: "W2", pending: 380 },
    { week: "W3", pending: 340 },
    { week: "W4", pending: opsCards[0]?.pendingVerification ?? 280 },
  ];

  const farmerGrowth = scoped.map((c) => ({
    county: c.county.length > 10 ? c.county.slice(0, 9) + "…" : c.county,
    farmers: c.farmersRegistered,
  }));

  return (
    <div className="space-y-4">
      <DataSourceNotice source={demoSource("countyProductionPerformance + countyOperationsCards")} />

      <InsightRibbon tone="info" title="County intelligence summary">
        {nf(farmerRegistrationPipeline.verified)} farmers verified nationally · {farmerRegistrationPipeline.geoTaggedPct}%
        geo-tagged · {farmerRegistrationPipeline.pendingVerification} pending verification across pilot scope.
      </InsightRibbon>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Performance" title="Production vs target" subtitle={county ? `${county} county lens` : "Pilot counties"} />
          <div className="mt-4">
            <EnterpriseBarChart
              data={scoped.map((c) => ({
                county: c.county.length > 8 ? c.county.slice(0, 7) + "…" : c.county,
                production: c.productionMt,
                target: c.targetMt,
              }))}
              xKey="county"
              series={[
                { dataKey: "production", fill: CHART_COLORS.forest, name: "Production" },
                { dataKey: "target", fill: CHART_COLORS.gold, name: "Target" },
              ]}
              height={240}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Verification" title="Pending verification trend" subtitle={illustrativeCaption("Weekly backlog trajectory")} />
          <div className="mt-4">
            <EnterpriseAreaChart data={verificationTrend} xKey="week" yKey="pending" name="Pending" color={CHART_COLORS.amber} height={240} />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Scorecard" title="County operational scorecard" subtitle="Reporting completeness and field activity" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {opsCards.map((c) => (
            <div key={c.county} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink-900">{c.county}</span>
                <StatusBadge tone={c.dqIssues > 4 ? "danger" : c.dqIssues > 2 ? "warning" : "success"}>
                  {c.inputProgressPct}% inputs
                </StatusBadge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div><dt className="text-slate-500">Pending verify</dt><dd className="font-mono font-semibold tabular-nums">{c.pendingVerification}</dd></div>
                <div><dt className="text-slate-500">Field reports 7d</dt><dd className="font-mono font-semibold tabular-nums">{c.fieldReports7d}</dd></div>
                <div><dt className="text-slate-500">Disease alerts</dt><dd className="font-mono font-semibold tabular-nums">{c.diseaseAlerts}</dd></div>
                <div><dt className="text-slate-500">DQ issues</dt><dd className="font-mono font-semibold tabular-nums">{c.dqIssues}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <SectionHeader kicker="Growth" title="Farmer registration by county" subtitle="Registered farmers in scope" />
        <div className="mt-4">
          <EnterpriseBarChart
            layout="vertical"
            data={farmerGrowth}
            xKey="county"
            series={[{ dataKey: "farmers", fill: CHART_COLORS.forest, name: "Farmers" }]}
            valueFormatter={(v) => nf(v)}
            height={220}
          />
        </div>
      </DashboardPanel>
    </div>
  );
}

/**
 * These analytics are built from illustrative series, not live records, so they
 * render only in an explicitly illustrative training environment.
 */
export default function CountyIntelligenceAnalytics(props: React.ComponentProps<typeof CountyIntelligenceAnalyticsIllustrative>) {
  if (!ILLUSTRATIVE_DATA_ENABLED) return null;
  return <CountyIntelligenceAnalyticsIllustrative {...props} />;
}
