"use client";

import {
  countyProductionPerformance,
  foodSecurityIndicators,
  inputDistributionProgress,
  postHarvestLossAlerts,
  warehouses,
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

const nf = (n: number) => Intl.NumberFormat().format(n);

export default function FoodSecurityAnalyticsPanels() {
  const fi = foodSecurityIndicators;
  const topCounties = [...countyProductionPerformance].slice(0, 8);

  const productionTrend = [
    { month: "Jan", mt: fi.domesticProductionMt * 0.82 },
    { month: "Feb", mt: fi.domesticProductionMt * 0.86 },
    { month: "Mar", mt: fi.domesticProductionMt * 0.91 },
    { month: "Apr", mt: fi.domesticProductionMt * 0.95 },
    { month: "May", mt: fi.domesticProductionMt },
  ].map((r) => ({ ...r, mt: Math.round(r.mt) }));

  const countyCompare = topCounties.map((c) => ({
    county: c.county.length > 8 ? c.county.slice(0, 7) + "…" : c.county,
    production: c.productionMt,
    target: c.targetMt,
    loss: c.lossPct,
  }));

  const reserveByCounty = warehouses.map((w) => ({
    hub: w.name.split("·")[0]?.trim() ?? w.name,
    rice: w.riceSeedTons,
    fertilizer: w.fertilizerTons,
  }));

  const coveragePct = ((fi.domesticProductionMt / Math.max(1, fi.riceDemandMt)) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <DataSourceNotice source={demoSource("foodSecurityIndicators + countyProductionPerformance + warehouses")} />

      <InsightRibbon tone={fi.nationalRiskScore > 55 ? "warning" : "info"} title="National situational brief">
        Domestic production covers {coveragePct}% of modeled rice demand. {postHarvestLossAlerts.length} counties breach
        post-harvest loss thresholds. Import dependency trend: {fi.importDependencyTrend}.
      </InsightRibbon>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Trend" title="National production trajectory" subtitle="Seasonal domestic output (modeled pilot series)" />
          <div className="mt-4">
            <EnterpriseAreaChart
              data={productionTrend}
              xKey="month"
              yKey="mt"
              name="Production (t)"
              valueFormatter={(v) => `${nf(v)} t`}
              color={CHART_COLORS.forest}
              height={240}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Comparison" title="County production vs target" subtitle="Top pilot counties — output gap analysis" />
          <div className="mt-4">
            <EnterpriseBarChart
              data={countyCompare}
              xKey="county"
              series={[
                { dataKey: "production", fill: CHART_COLORS.forest, name: "Production" },
                { dataKey: "target", fill: CHART_COLORS.gold, name: "Target" },
              ]}
              valueFormatter={(v) => `${nf(v)} t`}
              height={240}
            />
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel>
          <SectionHeader kicker="Risk" title="Post-harvest loss by county" subtitle="Vulnerability ranking" />
          <div className="mt-4">
            <EnterpriseBarChart
              layout="vertical"
              data={[...topCounties].sort((a, b) => b.lossPct - a.lossPct).slice(0, 6).map((c) => ({
                county: c.county,
                loss: c.lossPct,
              }))}
              xKey="county"
              series={[{ dataKey: "loss", fill: CHART_COLORS.rose, name: "Loss %" }]}
              valueFormatter={(v) => `${v}%`}
              height={220}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Reserves" title="Warehouse stock posture" subtitle="Pilot hub reserves (tons)" />
          <div className="mt-4">
            <EnterpriseBarChart
              data={reserveByCounty}
              xKey="hub"
              series={[
                { dataKey: "rice", fill: CHART_COLORS.forest, name: "Rice seed", stackId: "a" },
                { dataKey: "fertilizer", fill: CHART_COLORS.navy, name: "Fertilizer", stackId: "a" },
              ]}
              height={220}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Distribution" title="Input programme reach" subtitle="National allocation progress" />
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-[12px] text-slate-600">
                <span>Fertilizer distributed</span>
                <span className="font-mono tabular-nums">
                  {nf(inputDistributionProgress.fertilizerDistributedMt)} / {nf(inputDistributionProgress.fertilizerAllocatedMt)} t
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{
                    width: `${(inputDistributionProgress.fertilizerDistributedMt / inputDistributionProgress.fertilizerAllocatedMt) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] text-slate-600">
                <span>Seed distributed</span>
                <span className="font-mono tabular-nums">
                  {nf(inputDistributionProgress.seedDistributedMt)} / {nf(inputDistributionProgress.seedAllocatedMt)} t
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${(inputDistributionProgress.seedDistributedMt / inputDistributionProgress.seedAllocatedMt) * 100}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[12px] text-slate-500">
              {inputDistributionProgress.countiesFullyDistributed} counties fully distributed
            </p>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Hotspots" title="Escalation watchlist" subtitle="Counties requiring ministry attention" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {postHarvestLossAlerts.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink-900">{a.county}</span>
                <StatusBadge tone={a.lossPct > 12 ? "danger" : "warning"}>{a.lossPct}%</StatusBadge>
              </div>
              <p className="mt-1 text-[12px] text-slate-600">{a.driver}</p>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
