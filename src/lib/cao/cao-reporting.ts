import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import type { WarehouseRow } from "@/lib/demo/agriculture-pilot-data";
import type { CaoDistrictCard } from "@/lib/cao/cao-district-cards";

export function downloadTextFile(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildWeeklyCountyBriefing(params: {
  countyLabel: string;
  fullName: string;
  farmersRegistered: number | null;
  daoRows: DaoOversightRow[];
  warehouses: WarehouseRow[];
  productionMt: number | null;
  subsidyUtilPct: number | null;
  generatedAt: Date;
}): string {
  const lines = [
    `County Agriculture Officer — Weekly briefing`,
    `County: ${params.countyLabel}`,
    `Prepared for: ${params.fullName}`,
    `Generated: ${params.generatedAt.toISOString()}`,
    ``,
    `Executive snapshot`,
    `- Registered farmers (live query): ${params.farmersRegistered != null ? params.farmersRegistered : "—"}`,
    `- Active DAO profiles in county view: ${params.daoRows.length}`,
    `- Aggregate overdue DAO reports: ${params.daoRows.reduce((s, r) => s + r.overdueReports, 0)}`,
    `- District production estimate (canonical index scaled): ${params.productionMt != null ? `${params.productionMt.toLocaleString()} t` : "—"}`,
    `- County warehouse nodes surfaced: ${params.warehouses.length}`,
    `- Mean subsidy / stock utilization (canonical warehouses): ${params.subsidyUtilPct != null ? `${params.subsidyUtilPct}%` : "—"}`,
    ``,
    `DAO throughput`,
    ...params.daoRows.slice(0, 12).map(
      (r) =>
        ` · ${r.daoId} · ${r.daoName} · ${r.district} · reports ${r.reportsSubmitted} · overdue ${r.overdueReports} · GPS verify ${r.gpsVerificationRate}%`,
    ),
    ``,
    `Notes`,
    `- Figures blend Supabase reads with ministry canonical fallbacks when tables are sparse.`,
    `- Approval outcomes remain authoritative once routed through CAC queues.`,
  ];
  return lines.join("\n");
}

export function buildDaoComplianceExport(params: { countyLabel: string; daoRows: DaoOversightRow[] }): string {
  const header = ["dao_id", "dao_name", "district", "assigned_farmers", "reports", "overdue", "visits", "subsidy_verify_n", "gps_pct", "sync", "risk_score", "risk_band"].join(",");
  const rows = params.daoRows.map((r) =>
    [
      r.daoId,
      `"${r.daoName.replace(/"/g, '""')}"`,
      `"${r.district.replace(/"/g, '""')}"`,
      r.assignedFarmers,
      r.reportsSubmitted,
      r.overdueReports,
      r.farmVisits,
      r.subsidyVerifications,
      r.gpsVerificationRate,
      r.syncStatus,
      r.riskScore,
      r.riskStatus,
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export function buildSubsidyUtilizationSummary(countyLabel: string, warehouses: WarehouseRow[]): string {
  const lines = [
    `Subsidy & warehouse utilization — ${countyLabel}`,
    `Nodes: ${warehouses.length}`,
    ...warehouses.map(
      (w) =>
        ` · ${w.name} · seed ${w.riceSeedTons} t · fertilizer ${w.fertilizerTons} t · posture ${w.stockRisk} · donor-tagged ${w.donorTaggedPct}%`,
    ),
  ];
  return lines.join("\n");
}

export function buildDistrictComparisonReport(countyLabel: string, cards: CaoDistrictCard[]): string {
  const header = ["district", "production_idx", "farmer_reg_pct", "subsidy_pct", "dao_activity", "food_risk", "reporting_pct"].join(",");
  const rows = cards.map((c) =>
    [c.district, c.productionIndex, c.farmerRegProgressPct, c.subsidyCompletionPct, c.daoActivityScore, `"${c.foodSecurityRisk}"`, c.reportingCompliancePct].join(
      ",",
    ),
  );
  return [`District comparison — ${countyLabel}`, header, ...rows].join("\n");
}
