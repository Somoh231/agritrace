"use client";

import { OpsMetric } from "@/components/pilot/pilot-ui";

export default function CaoKpiStrip({
  farmersRegistered,
  activeDaos,
  overdueReports,
  productionEstimateMt,
  subsidyUtilizationPct,
  warehouseCoverage,
  activeAlerts,
  unresolvedEscalations,
}: {
  farmersRegistered: number | null;
  activeDaos: number;
  overdueReports: number;
  productionEstimateMt: number | null;
  subsidyUtilizationPct: number | null;
  warehouseCoverage: number;
  activeAlerts: number;
  unresolvedEscalations: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      <OpsMetric label="Registered farmers" value={farmersRegistered != null ? Intl.NumberFormat().format(farmersRegistered) : "—"} tone="forest" />
      <OpsMetric label="Active DAOs" value={String(activeDaos)} tone="navy" />
      <OpsMetric label="Overdue DAO reports" value={String(overdueReports)} tone="rose" />
      <OpsMetric
        label="Production estimate"
        value={productionEstimateMt != null ? `${Intl.NumberFormat().format(productionEstimateMt)} t` : "—"}
        tone="forest"
      />
      <OpsMetric label="Subsidy utilization" value={subsidyUtilizationPct != null ? `${subsidyUtilizationPct}%` : "—"} tone="amber" />
      <OpsMetric label="Warehouse coverage" value={String(warehouseCoverage)} tone="navy" />
      <OpsMetric label="Active alerts" value={String(activeAlerts)} tone="amber" />
      <OpsMetric label="Unresolved escalations" value={String(unresolvedEscalations)} tone="rose" />
    </div>
  );
}
