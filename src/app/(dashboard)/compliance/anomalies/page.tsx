"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "created_at", header: "When" },
  { key: "movement_type", header: "Type" },
  { key: "quantity", header: "Qty" },
  { key: "warehouse_from", header: "From" },
  { key: "warehouse_to", header: "To" },
];

export default function DistributionAnomaliesPage() {
  return (
    <GenericTablePage
      title="Distribution anomalies"
      description="Ledger movements flagged as losses or adjustments requiring supervisory review."
      table="inventory_movements"
      select="created_at,movement_type,quantity,warehouse_from,warehouse_to"
      eqFilters={[{ column: "movement_type", value: "loss" }]}
      columns={COLS}
      filename="inventory-loss-movements.csv"
    />
  );
}
