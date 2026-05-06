"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "name", header: "County" },
  { key: "is_pilot", header: "Pilot" },
  { key: "created_at", header: "Onboarded" },
];

export default function ProductionCountyPage() {
  return (
    <GenericTablePage
      title="County dashboards"
      description="Administrative counties configured for reporting scopes and pilot expansion toggles."
      table="counties"
      select="name,is_pilot,created_at"
      columns={COLS}
      filename="counties.csv"
    />
  );
}
