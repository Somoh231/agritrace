"use client";

import * as React from "react";

import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import type { CaoDistrictCard } from "@/lib/cao/cao-district-cards";
import {
  buildDaoComplianceExport,
  buildDistrictComparisonReport,
  buildSubsidyUtilizationSummary,
  buildWeeklyCountyBriefing,
  downloadTextFile,
} from "@/lib/cao/cao-reporting";
import type { WarehouseRow } from "@/lib/demo/agriculture-pilot-data";

export default function CaoReportingSection({
  countyLabel,
  fullName,
  farmersRegistered,
  daoRows,
  warehouses,
  districtCards,
  productionEstimateMt,
  subsidyUtilPct,
}: {
  countyLabel: string;
  fullName: string;
  farmersRegistered: number | null;
  daoRows: DaoOversightRow[];
  warehouses: WarehouseRow[];
  districtCards: CaoDistrictCard[];
  productionEstimateMt: number | null;
  subsidyUtilPct: number | null;
}) {
  const [toast, setToast] = React.useState<string | null>(null);

  const brief = () =>
    buildWeeklyCountyBriefing({
      countyLabel,
      fullName,
      farmersRegistered,
      daoRows,
      warehouses,
      productionMt: productionEstimateMt,
      subsidyUtilPct,
      generatedAt: new Date(),
    });

  return (
    <section className="rounded-xl border border-slate-700/85 bg-slate-950/45 p-4 sm:p-5">
      <h2 className="font-display text-[15px] font-semibold text-white">CAO reporting</h2>
      <p className="mt-1 text-[12px] text-slate-400">
        One-click exports compose live KPIs with canonical ministry fallbacks — suitable for county situational meetings and ministry routing packs.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cao-weekly-brief-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.txt`, brief());
            setToast("Weekly briefing downloaded.");
          }}
          className="rounded-lg bg-emerald-800 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700"
        >
          Weekly county briefing
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cao-dao-compliance-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, buildDaoComplianceExport({ countyLabel, daoRows }));
            setToast("DAO compliance CSV exported.");
          }}
          className="rounded-lg border border-slate-600 px-4 py-2 text-[12px] text-slate-100 hover:bg-slate-900"
        >
          DAO compliance export
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cao-subsidy-summary-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.txt`, buildSubsidyUtilizationSummary(countyLabel, warehouses));
            setToast("Subsidy utilization summary downloaded.");
          }}
          className="rounded-lg border border-slate-600 px-4 py-2 text-[12px] text-slate-100 hover:bg-slate-900"
        >
          Subsidy utilization summary
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cao-district-compare-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, buildDistrictComparisonReport(countyLabel, districtCards));
            setToast("District comparison report exported.");
          }}
          className="rounded-lg border border-slate-600 px-4 py-2 text-[12px] text-slate-100 hover:bg-slate-900"
        >
          District comparison report
        </button>
      </div>
      {toast ? (
        <p className="mt-3 rounded-lg border border-emerald-800/45 bg-emerald-950/25 px-3 py-2 text-[12px] text-emerald-100">
          {toast}{" "}
          <button type="button" className="ml-2 text-emerald-300 underline" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </p>
      ) : null}
    </section>
  );
}
