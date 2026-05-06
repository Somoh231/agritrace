"use client";

import * as React from "react";
import Link from "next/link";

import {
  foodSecurityIndicators,
  postHarvestLossAlerts,
  countyProductionPerformance,
} from "@/lib/demo/agriculture-pilot-data";

import { OpsCard, OpsMetric, OpsSectionTitle, PilotDatasetNotice } from "@/components/pilot/pilot-ui";

export default function FoodSecurityClient() {
  const fi = foodSecurityIndicators;
  const heat = [...countyProductionPerformance].sort((a, b) => b.lossPct - a.lossPct).slice(0, 8);

  return (
    <div className="space-y-5">
      <OpsSectionTitle
        kicker="Intelligence"
        title="National food security intelligence"
        subtitle="Demand/production balance, import dependency lens, loss hotspots, and market watch · illustrative pilot analytics only."
      />
      <PilotDatasetNotice />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OpsMetric
          label="National rice demand (indic.)"
          value={`${Intl.NumberFormat().format(fi.riceDemandMt)} t`}
          tone="navy"
        />
        <OpsMetric
          label="Domestic production (est.)"
          value={`${Intl.NumberFormat().format(fi.domesticProductionMt)} t`}
          tone="forest"
        />
        <OpsMetric label="Import dependency trend" value={fi.importDependencyTrend} tone="amber" />
        <OpsMetric label="Emergency alerts (demo)" value={String(fi.emergencyAlerts)} tone="rose" />
      </div>

      <OpsCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="font-display text-[15px] font-semibold text-slate-900">Demand vs domestic supply</div>
            <p className="mt-2 text-[12px] text-slate-600">
              Gap visualization connects to national accounting models · placeholder for ministry-approved coefficients.
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-[12px] text-slate-800">
              Supply coverage (illustrative):{" "}
              {((fi.domesticProductionMt / fi.riceDemandMt) * 100).toFixed(1)}% of indicative demand.
            </div>
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold text-slate-900">Food security risk score</div>
            <div className="mt-3 font-display text-4xl font-semibold tabular-nums text-[#b45309]">{fi.nationalRiskScore}</div>
            <p className="mt-2 text-[11px] text-slate-600">Pilot composite · not an official government classification.</p>
            <p className="mt-3 text-[12px] text-slate-700">{fi.countyForecastNote}</p>
          </div>
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Loss hotspots</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {postHarvestLossAlerts.map((a) => (
            <div key={a.id} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
              <div className="text-[12px] font-semibold text-amber-950">{a.county}</div>
              <div className="text-[11px] text-amber-950/90">{a.lossPct}% · {a.driver}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">County production heat panel (loss-adjusted)</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {heat.map((c) => (
            <div
              key={c.county}
              className="rounded-md border border-slate-200 px-2 py-2 text-center font-mono text-[11px]"
              style={{
                background: `rgba(185, 28, 28, ${Math.min(0.08 + c.lossPct / 200, 0.35)})`,
              }}
            >
              <div className="font-semibold text-slate-900">{c.county}</div>
              <div className="text-slate-700">{c.lossPct}% loss</div>
            </div>
          ))}
        </div>
        <Link href="/map" className="mt-3 inline-block text-[12px] font-medium text-[#14532d] underline-offset-2 hover:underline">
          Map workspace →
        </Link>
      </OpsCard>

      <OpsCard dense>
        <div className="font-medium text-slate-900">Market price watch</div>
        <p className="mt-2 text-[12px] text-slate-700">{fi.marketPriceWatch}</p>
      </OpsCard>
    </div>
  );
}
