"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "programme", header: "Programme" },
  { key: "farmer_id", header: "Farmer" },
  { key: "amount_usd", header: "Amount (USD)" },
  { key: "period_label", header: "Period" },
];

export default function SubsidyAnalyticsPage() {
  return (
    <GenericTablePage
      title="Programme analytics"
      description="Beneficiary-level subsidy awards feeding treasury reconciliation dashboards."
      table="farmer_subsidies"
      select="programme,farmer_id,amount_usd,period_label"
      columns={COLS}
      filename="farmer-subsidies.csv"
    />
  );
}
