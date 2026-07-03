"use client";

import { RegistryKpiStrip } from "@/components/registry";

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
  const nf = (n: number) => Intl.NumberFormat().format(n);

  return (
    <RegistryKpiStrip
      items={[
        {
          label: "Registered farmers",
          value: farmersRegistered != null ? nf(farmersRegistered) : "—",
          hint: "County scope",
          href: "/farmers",
        },
        { label: "Active DAOs", value: String(activeDaos), hint: "District officers" },
        {
          label: "Overdue reports",
          value: String(overdueReports),
          hint: "DAO cadence gap",
          deltaTone: overdueReports > 0 ? "down" : "up",
        },
        {
          label: "Production estimate",
          value: productionEstimateMt != null ? `${nf(productionEstimateMt)} t` : "—",
          hint: "Modeled output",
        },
        {
          label: "Subsidy utilization",
          value: subsidyUtilizationPct != null ? `${subsidyUtilizationPct}%` : "—",
          hint: "Warehouse allocation",
        },
        { label: "Warehouses", value: String(warehouseCoverage), hint: "County coverage", href: "/operations/warehouses" },
        {
          label: "Active alerts",
          value: String(activeAlerts),
          hint: "County signals",
          href: "/alerts",
          deltaTone: activeAlerts > 0 ? "down" : "neutral",
        },
        {
          label: "Escalations",
          value: String(unresolvedEscalations),
          hint: "Unresolved",
          deltaTone: unresolvedEscalations > 0 ? "down" : "up",
        },
      ]}
    />
  );
}
