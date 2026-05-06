"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "distributed_at", header: "Distributed" },
  { key: "farmer_id", header: "Farmer" },
  { key: "warehouse_id", header: "Warehouse" },
  { key: "quantity", header: "Qty" },
  { key: "channel", header: "Channel" },
];

export default function SeedDistributionPage() {
  return (
    <GenericTablePage
      title="Seed distribution"
      description="Last-mile seed movements captured against beneficiary IDs."
      table="distribution_logs"
      select="distributed_at,farmer_id,warehouse_id,quantity,channel"
      columns={COLS}
      filename="seed-distribution.csv"
    />
  );
}
