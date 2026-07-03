"use client";

import * as React from "react";

import { AlertCard } from "@/components/enterprise";
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-[15px] font-semibold text-ink-900">CAC reporting</h2>
      <p className="mt-1 text-[12px] text-slate-600">
        One-click exports compose live KPIs with canonical ministry fallbacks — suitable for county situational meetings and ministry routing packs.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cac-weekly-brief-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.txt`, brief());
            setToast("Weekly briefing downloaded.");
          }}
          className="rounded-lg bg-forest-800 px-4 py-2 text-[12px] font-medium text-white hover:bg-forest-700"
        >
          Weekly county briefing
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cac-dao-compliance-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, buildDaoComplianceExport({ countyLabel, daoRows }));
            setToast("DAO compliance CSV exported.");
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50"
        >
          DAO compliance export
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cac-subsidy-summary-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.txt`, buildSubsidyUtilizationSummary(countyLabel, warehouses));
            setToast("Subsidy utilization summary downloaded.");
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50"
        >
          Subsidy utilization summary
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(`cac-district-compare-${countyLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, buildDistrictComparisonReport(countyLabel, districtCards));
            setToast("District comparison report exported.");
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50"
        >
          District comparison report
        </button>
      </div>
      {toast ? (
        <div className="mt-3">
          <AlertCard tone="success" title="Export complete" action={<button type="button" className="text-[12px] font-medium underline" onClick={() => setToast(null)}>Dismiss</button>}>
            {toast}
          </AlertCard>
        </div>
      ) : null}
    </section>
  );
}
