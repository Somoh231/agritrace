"use client";

import * as React from "react";
import Link from "next/link";

import {
  foodSecurityIndicators,
  postHarvestLossAlerts,
  countyProductionPerformance,
} from "@/lib/demo/agriculture-pilot-data";

import { OpsCard, OpsMetric } from "@/components/pilot/pilot-ui";

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

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">National intelligence</div>
        <h1 className="mt-1 font-display text-[22px] font-semibold tracking-tight text-white">Food security command layer</h1>
        <p className="mt-2 max-w-[840px] text-[13px] text-slate-400 leading-relaxed">
          Demand modeling, county vulnerability, seasonal deltas, and operational loss posture — unified for ministry executives.
        </p>
      </header>

      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">National status</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <OpsMetric label="Indicative rice demand" value={`${Intl.NumberFormat().format(fi.riceDemandMt)} t`} tone="navy" />
        <OpsMetric label="Domestic production (est.)" value={`${Intl.NumberFormat().format(fi.domesticProductionMt)} t`} tone="forest" />
        <OpsMetric label="Supply coverage (modeled)" value={`${coveragePct}%`} tone="amber" />
        <OpsMetric label="National risk index" value={String(fi.nationalRiskScore)} tone="rose" />
        <OpsMetric label="Avg post-harvest loss" value={`${avgLoss}%`} tone="amber" />
        <OpsMetric label="Counties at risk" value={String(countiesAtRisk)} tone="rose" />
      </div>

      <OpsCard>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="font-display text-[15px] font-semibold text-white">Import dependency modeling</div>
            <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
              Domestic deficit scenarios benchmark against trade corridors and strategic reserves. Coefficients remain configurable by ministry statute.
            </p>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-[12px] text-slate-200">
              Trend vector · <span className="text-amber-200">{fi.importDependencyTrend}</span>
            </div>
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold text-white">Production gap analysis</div>
            <p className="mt-3 text-[12px] text-slate-400 leading-relaxed">
              Gap diagnostics reconcile DAO reporting cadence with warehouse releases and seasonal planting telemetry.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3">
              <div className="text-[11px] text-emerald-100/70 uppercase tracking-wide font-mono">Seasonal comparison</div>
              <div className="mt-2 text-[13px] text-emerald-50">{fi.countyForecastNote}</div>
            </div>
          </div>
        </div>
      </OpsCard>

      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Risk &amp; hotspots</div>
      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-white">County vulnerability heat · loss-adjusted</div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {heat.map((c) => (
            <div
              key={c.county}
              className="rounded-lg border border-slate-800 bg-slate-950/45 px-2 py-2 text-center font-mono text-[11px]"
              style={{
                boxShadow: `inset 0 0 0 1px rgba(248,113,113,${Math.min(0.08 + c.lossPct / 200, 0.35)})`,
              }}
            >
              <div className="font-semibold text-slate-100">{c.county}</div>
              <div className="text-slate-400">{c.lossPct}% loss</div>
            </div>
          ))}
        </div>
        <Link href="/map" className="mt-4 inline-block text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
          Geospatial workspace →
        </Link>
      </OpsCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard>
          <div className="font-display text-[15px] font-semibold text-white">Yield forecasting & rainfall correlation</div>
          <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
            Forecast ensembles ingest agronomic surveys and meteorological feeds when integrations are enabled. Correlation matrices publish alongside DAO verification batches.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-slate-700 px-3 py-3 text-[11px] text-slate-500 font-mono">
            Precipitation anomaly overlays ship with Phase 2 meteorological connectors.
          </div>
        </OpsCard>
        <OpsCard>
          <div className="font-display text-[15px] font-semibold text-white">Emergency escalation hotspots</div>
          <div className="mt-3 grid gap-2">
            {postHarvestLossAlerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-amber-900/35 bg-amber-950/25 px-3 py-2">
                <div className="text-[12px] font-semibold text-amber-50">{a.county}</div>
                <div className="text-[11px] text-amber-100/90">
                  {a.lossPct}% · {a.driver}
                </div>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Required action</div>
      <OpsCard>
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/alerts"
            className="group rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3.5 transition hover:bg-rose-950/35"
          >
            <div className="font-display text-[14px] font-semibold text-rose-50">Escalations & incidents</div>
            <p className="mt-1.5 text-[12px] text-rose-100/70 leading-relaxed">Route unresolved early-warning signals to county and ministry desks.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-rose-200 transition group-hover:translate-x-0.5">Open alerts →</span>
          </Link>
          <Link
            href="/verification-queue"
            className="group rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3.5 transition hover:bg-amber-950/35"
          >
            <div className="font-display text-[14px] font-semibold text-amber-50">Verification queue</div>
            <p className="mt-1.5 text-[12px] text-amber-100/70 leading-relaxed">Clear DAO/CAC verification items tied to loss and supply anomalies.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-amber-200 transition group-hover:translate-x-0.5">Open queue →</span>
          </Link>
          <Link
            href="/national-heat-map"
            className="group rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3.5 transition hover:bg-emerald-950/35"
          >
            <div className="font-display text-[14px] font-semibold text-emerald-50">County heat map</div>
            <p className="mt-1.5 text-[12px] text-emerald-100/70 leading-relaxed">Inspect county-level vulnerability and production signals on the map.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-emerald-200 transition group-hover:translate-x-0.5">View map →</span>
          </Link>
        </div>
      </OpsCard>

      <OpsCard dense>
        <div className="font-medium text-slate-100">Market intelligence brief</div>
        <p className="mt-2 text-[12px] text-slate-400">{fi.marketPriceWatch}</p>
      </OpsCard>
    </div>
  );
}
