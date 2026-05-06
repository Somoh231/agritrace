"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "season", header: "Season" },
  { key: "county", header: "County" },
  { key: "actual_yield_kg", header: "Actual (kg)" },
  { key: "expected_yield_kg", header: "Expected (kg)" },
  { key: "recorded_at", header: "Recorded" },
];

export default function SeasonalPerformancePage() {
  return (
    <GenericTablePage
      title="Seasonal performance"
      description="Production telemetry sliced by agronomic season for ministry programme reviews."
      table="rice_production_records"
      select="season,county,actual_yield_kg,expected_yield_kg,recorded_at"
      columns={COLS}
      filename="rice-seasonal-performance.csv"
    />
  );
}
