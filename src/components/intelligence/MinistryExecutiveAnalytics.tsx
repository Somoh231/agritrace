"use client";

import * as React from "react";
import {
  countyProductionPerformance,
  foodSecurityIndicators,
  inputDistributionProgress,
} from "@/lib/demo/agriculture-pilot-data";
import { demoSource } from "@/lib/data/data-source";
import type { MinistryWorkspaceMetrics } from "@/components/workspace/MinistryWorkspaceClient";
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
import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

const nf = (n: number) => Intl.NumberFormat().format(n);

function MinistryExecutiveAnalyticsIllustrative({ metrics }: { metrics: MinistryWorkspaceMetrics }) {
  const countyRank = [...countyProductionPerformance]
    .sort((a, b) => b.productionMt - a.productionMt)
    .slice(0, 8)
    .map((c, i) => ({
      rank: i + 1,
      county: c.county.length > 10 ? c.county.slice(0, 9) + "…" : c.county,
      production: c.productionMt,
      loss: c.lossPct,
    }));

  const approvalVelocity = [
    { week: "W1", approved: 820 },
    { week: "W2", approved: 940 },
    { week: "W3", approved: 1010 },
    { week: "W4", approved: 1120 },
  ];

  const programPerformance = [
    { program: "Inputs", pct: Math.round((inputDistributionProgress.fertilizerDistributedMt / inputDistributionProgress.fertilizerAllocatedMt) * 100) },
    { program: "Seed", pct: Math.round((inputDistributionProgress.seedDistributedMt / inputDistributionProgress.seedAllocatedMt) * 100) },
    { program: "Verify", pct: Math.round((metrics.verifiedFarmers / Math.max(1, metrics.registeredFarmers)) * 100) },
    { program: "Reporting", pct: Math.round((metrics.countiesReporting / 15) * 100) },
  ];

  return (
    <div className="space-y-4">
      <DataSourceNotice source={demoSource("ministry workspace metrics + county production")} />

      <InsightRibbon
        tone={metrics.nationalRiskScore > 60 ? "warning" : "success"}
        title="Executive national brief"
      >
        {nf(metrics.registeredFarmers)} farmers registered · {metrics.countiesReporting}/15 counties reporting ·
        national food risk index {metrics.nationalRiskScore}. {metrics.pendingVerification} verifications awaiting CAC decision.
      </InsightRibbon>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Rankings" title="County production leaderboard" subtitle="Top counties by output (MT)" />
          <div className="mt-4">
            <EnterpriseBarChart
              layout="vertical"
              data={countyRank}
              xKey="county"
              series={[{ dataKey: "production", fill: CHART_COLORS.forest, name: "Production" }]}
              valueFormatter={(v) => `${nf(v)} t`}
              height={260}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Velocity" title="CAC approval throughput" subtitle="Weekly verification decisions" />
          <div className="mt-4">
            <EnterpriseAreaChart
              data={approvalVelocity}
              xKey="week"
              yKey="approved"
              name="Approved"
              color={CHART_COLORS.gold}
              valueFormatter={(v) => nf(v)}
              height={260}
            />
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Programmes" title="National programme performance" subtitle="Distribution and verification reach" />
          <div className="mt-4 space-y-3">
            {programPerformance.map((p) => (
              <div key={p.program}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-medium text-slate-700">{p.program}</span>
                  <span className="font-mono tabular-nums text-ink-900">{p.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Risk" title="County vulnerability heat" subtitle="Post-harvest loss ranking" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[...countyProductionPerformance]
              .sort((a, b) => b.lossPct - a.lossPct)
              .slice(0, 6)
              .map((c) => (
                <div key={c.county} className="rounded-lg border border-slate-100 px-3 py-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink-900">{c.county}</span>
                  <StatusBadge tone={c.lossPct >= 14 ? "danger" : c.lossPct >= 11 ? "warning" : "success"}>
                    {c.lossPct}%
                  </StatusBadge>
                </div>
              ))}
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            Food security index: {foodSecurityIndicators.nationalRiskScore} · {foodSecurityIndicators.countyForecastNote}
          </p>
        </DashboardPanel>
      </div>
    </div>
  );
}

/**
 * These analytics are built from illustrative series, not live records, so they
 * render only in an explicitly illustrative training environment.
 */
export default function MinistryExecutiveAnalytics(props: React.ComponentProps<typeof MinistryExecutiveAnalyticsIllustrative>) {
  if (!ILLUSTRATIVE_DATA_ENABLED) return null;
  return <MinistryExecutiveAnalyticsIllustrative {...props} />;
}
