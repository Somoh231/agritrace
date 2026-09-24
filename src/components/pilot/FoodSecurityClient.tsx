"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  ClipboardCheck,
  Map,
  ShieldAlert,
  TrendingDown,
  Wheat,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceNotice,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
import FoodSecurityAnalyticsPanels from "@/components/intelligence/FoodSecurityAnalyticsPanels";
import { RegistryKpiStrip } from "@/components/registry";
import { demoSource } from "@/lib/data/data-source";
import {
  countyProductionPerformance,
  foodSecurityIndicators,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";
import { illustrativeCaption } from "@/lib/data/illustrative-policy";

export default function FoodSecurityClient() {
  const fi = foodSecurityIndicators;
  const heat = [...countyProductionPerformance].sort((a, b) => b.lossPct - a.lossPct).slice(0, 10);
  const coveragePct = ((fi.domesticProductionMt / Math.max(1, fi.riceDemandMt)) * 100).toFixed(1);
  const avgLoss = countyProductionPerformance.length
    ? (
        countyProductionPerformance.reduce((s, c) => s + c.lossPct, 0) /
        countyProductionPerformance.length
      ).toFixed(1)
    : "0";
  const countiesAtRisk = postHarvestLossAlerts.length;
  const nf = (n: number) => Intl.NumberFormat().format(n);

  const riskTone = (lossPct: number) => (lossPct >= 15 ? "danger" : lossPct >= 10 ? "warning" : "info");

  return (
    <div className="space-y-6 pb-8">
      <DataSourceNotice source={demoSource("foodSecurityIndicators + countyProductionPerformance")} />
      <PageHeader
        kicker="National intelligence · Early warning"
        title="Food security command layer"
        description="Demand modeling, county vulnerability, seasonal deltas, and operational loss posture — unified for ministry executives and county early-warning desks."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/national-heat-map" className="btn-gov-outline inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[12px]">
              <Map className="h-4 w-4" aria-hidden />
              County heat map
            </Link>
            <Link href="/alerts" className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[12px] font-semibold">
              <Bell className="h-4 w-4" aria-hidden />
              Escalations desk
            </Link>
          </div>
        }
      />

      <RegistryKpiStrip
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
        items={[
          { label: "Indicative rice demand", value: `${nf(fi.riceDemandMt)} t`, hint: "National modeled demand" },
          { label: "Domestic production", value: `${nf(fi.domesticProductionMt)} t`, hint: "Estimated output", deltaTone: "up" },
          { label: "Supply coverage", value: `${coveragePct}%`, hint: "Modeled domestic share", deltaTone: Number(coveragePct) < 80 ? "down" : "up" },
          { label: "National risk index", value: String(fi.nationalRiskScore), hint: "Composite early-warning score", deltaTone: fi.nationalRiskScore > 60 ? "down" : "neutral" },
          { label: "Avg post-harvest loss", value: `${avgLoss}%`, hint: "Pilot county average", deltaTone: Number(avgLoss) > 10 ? "down" : "up" },
          { label: "Counties at risk", value: String(countiesAtRisk), hint: "Loss threshold breach", href: "/national-heat-map", deltaTone: countiesAtRisk > 0 ? "down" : "up" },
        ]}
      />

      {fi.nationalRiskScore > 55 ? (
        <AlertCard tone="warning" title="Elevated national risk posture" action={<Link href="/alerts" className="text-[12px] font-medium text-amber-900 hover:underline">Review escalations →</Link>}>
          Composite risk index at {fi.nationalRiskScore} — monitor county loss hotspots and verification backlog for supply anomalies.
        </AlertCard>
      ) : null}

      <FoodSecurityAnalyticsPanels />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Status" title="Import dependency modeling" subtitle="Domestic deficit scenarios benchmark against trade corridors" />
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="font-mono text-[11px] text-slate-600">
              Trend vector · <span className="font-medium text-amber-800">{fi.importDependencyTrend}</span>
            </p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Coefficients remain configurable by ministry statute. Trade corridor overlays publish when integrations are enabled.
          </p>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Status" title="Production gap analysis" subtitle="DAO reporting cadence reconciled with warehouse releases" />
          <AlertCard tone="success" title="Seasonal comparison">
            {fi.countyForecastNote}
          </AlertCard>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Gap diagnostics reconcile DAO reporting cadence with warehouse releases and seasonal planting telemetry.
          </p>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader
          kicker="Risk"
          title="County vulnerability heat"
          subtitle="Loss-adjusted production posture across pilot counties"
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {heat.map((c) => (
            <div
              key={c.county}
              className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm"
              style={{
                boxShadow: `inset 0 0 0 2px rgba(244,63,94,${Math.min(0.04 + c.lossPct / 200, 0.25)})`,
              }}
            >
              <div className="text-[12px] font-semibold text-ink-900">{c.county}</div>
              <div className="mt-1">
                <StatusBadge tone={riskTone(c.lossPct)}>{c.lossPct}% loss</StatusBadge>
              </div>
            </div>
          ))}
        </div>
        <Link href="/map" className="mt-4 inline-flex text-[12px] font-medium text-forest-700 hover:underline">
          Geospatial workspace →
        </Link>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Risk" title="Yield forecasting & rainfall correlation" subtitle="Forecast ensembles when meteorological connectors are enabled" />
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-[12px] text-slate-600">
            Precipitation anomaly overlays ship with Phase 2 meteorological connectors. Correlation matrices publish alongside DAO verification batches.
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Risk" title="Emergency escalation hotspots" subtitle="Counties breaching post-harvest loss thresholds" />
          <div className="mt-4 space-y-2">
            {postHarvestLossAlerts.length === 0 ? (
              <p className="text-[13px] text-slate-600">No active loss hotspots in pilot scope.</p>
            ) : (
              postHarvestLossAlerts.map((a) => (
                <AlertCard key={a.id} tone="warning" title={a.county}>
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {a.lossPct}% · {a.driver}
                  </span>
                </AlertCard>
              ))
            )}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Required action" title="Operational routing" subtitle="Route early-warning signals to county and ministry desks" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <QuickActionCard
            href="/alerts"
            icon={AlertTriangle}
            title="Escalations & incidents"
            description="Route unresolved early-warning signals to county and ministry desks."
          />
          <QuickActionCard
            href="/verification-queue"
            icon={ClipboardCheck}
            title="Verification queue"
            description="Clear DAO/CAC verification items tied to loss and supply anomalies."
          />
          <QuickActionCard
            href="/national-heat-map"
            icon={ShieldAlert}
            title="County heat map"
            description="Inspect county-level vulnerability and production signals on the map."
          />
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <SectionHeader kicker="Recent activity" title="Market intelligence brief" subtitle={illustrativeCaption("Market price watch", "Illustrative pilot price watch band")} />
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
            <Wheat className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-[13px] leading-relaxed text-slate-700">{fi.marketPriceWatch}</p>
        </div>
        <Timeline
          className="mt-4"
          items={postHarvestLossAlerts.map((a, i) => ({
            id: a.id,
            title: `${a.county} loss signal`,
            meta: a.driver,
            time: `T-${i + 1}d`,
            tone: a.lossPct > 12 ? "danger" : "warning",
          }))}
        />
      </DashboardPanel>
    </div>
  );
}
