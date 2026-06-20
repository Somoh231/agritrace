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
      <header className="mb-2 border-b border-slate-200 pb-4">
        <div className="gov-kicker gov-kicker-gold">National intelligence</div>
        <h1 className="mt-2 font-serif-display text-[28px] md:text-[32px] font-semibold tracking-tight text-slate-900">
          Food security command layer
        </h1>
        <p className="mt-2 max-w-[840px] text-[13px] text-slate-600 leading-relaxed">
          Demand modeling, county vulnerability, seasonal deltas, and operational loss posture — unified for ministry executives.
        </p>
      </header>

      <div className="gov-kicker">National status</div>
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
            <div className="font-serif-display text-[16px] font-semibold text-slate-900">Import dependency modeling</div>
            <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">
              Domestic deficit scenarios benchmark against trade corridors and strategic reserves. Coefficients remain configurable by ministry statute.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-[12px] text-slate-700">
              Trend vector · <span className="text-amber-700 font-medium">{fi.importDependencyTrend}</span>
            </div>
          </div>
          <div>
            <div className="font-serif-display text-[16px] font-semibold text-slate-900">Production gap analysis</div>
            <p className="mt-3 text-[12px] text-slate-600 leading-relaxed">
              Gap diagnostics reconcile DAO reporting cadence with warehouse releases and seasonal planting telemetry.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-[11px] text-emerald-700 uppercase tracking-wide font-mono">Seasonal comparison</div>
              <div className="mt-2 text-[13px] text-emerald-900">{fi.countyForecastNote}</div>
            </div>
          </div>
        </div>
      </OpsCard>

      <div className="gov-kicker">Risk &amp; hotspots</div>
      <OpsCard>
        <div className="font-serif-display text-[16px] font-semibold text-slate-900">County vulnerability heat · loss-adjusted</div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {heat.map((c) => (
            <div
              key={c.county}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center font-mono text-[11px]"
              style={{
                boxShadow: `inset 0 0 0 2px rgba(244,63,94,${Math.min(0.06 + c.lossPct / 200, 0.3)})`,
              }}
            >
              <div className="font-semibold text-slate-900">{c.county}</div>
              <div className="text-slate-500">{c.lossPct}% loss</div>
            </div>
          ))}
        </div>
        <Link href="/map" className="mt-4 inline-block text-[12px] font-medium text-emerald-700 hover:underline">
          Geospatial workspace →
        </Link>
      </OpsCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard>
          <div className="font-serif-display text-[16px] font-semibold text-slate-900">Yield forecasting & rainfall correlation</div>
          <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">
            Forecast ensembles ingest agronomic surveys and meteorological feeds when integrations are enabled. Correlation matrices publish alongside DAO verification batches.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-[11px] text-slate-500 font-mono">
            Precipitation anomaly overlays ship with Phase 2 meteorological connectors.
          </div>
        </OpsCard>
        <OpsCard>
          <div className="font-serif-display text-[16px] font-semibold text-slate-900">Emergency escalation hotspots</div>
          <div className="mt-3 grid gap-2">
            {postHarvestLossAlerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="text-[12px] font-semibold text-amber-900">{a.county}</div>
                <div className="text-[11px] text-amber-700">
                  {a.lossPct}% · {a.driver}
                </div>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>

      <div className="gov-kicker">Required action</div>
      <OpsCard>
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/alerts"
            className="group rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 transition hover:bg-rose-100/70"
          >
            <div className="font-serif-display text-[15px] font-semibold text-rose-900">Escalations & incidents</div>
            <p className="mt-1.5 text-[12px] text-rose-700 leading-relaxed">Route unresolved early-warning signals to county and ministry desks.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-rose-700 transition group-hover:translate-x-0.5">Open alerts →</span>
          </Link>
          <Link
            href="/verification-queue"
            className="group rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition hover:bg-amber-100/70"
          >
            <div className="font-serif-display text-[15px] font-semibold text-amber-900">Verification queue</div>
            <p className="mt-1.5 text-[12px] text-amber-700 leading-relaxed">Clear DAO/CAC verification items tied to loss and supply anomalies.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-amber-700 transition group-hover:translate-x-0.5">Open queue →</span>
          </Link>
          <Link
            href="/national-heat-map"
            className="group rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 transition hover:bg-emerald-100/70"
          >
            <div className="font-serif-display text-[15px] font-semibold text-emerald-900">County heat map</div>
            <p className="mt-1.5 text-[12px] text-emerald-700 leading-relaxed">Inspect county-level vulnerability and production signals on the map.</p>
            <span className="mt-2 inline-flex text-[12px] font-medium text-emerald-700 transition group-hover:translate-x-0.5">View map →</span>
          </Link>
        </div>
      </OpsCard>

      <OpsCard dense>
        <div className="font-medium text-slate-900">Market intelligence brief</div>
        <p className="mt-2 text-[12px] text-slate-600">{fi.marketPriceWatch}</p>
      </OpsCard>
    </div>
  );
}
