"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "distributed_at", header: "When" },
  { key: "farmer_id", header: "Farmer" },
  { key: "quantity", header: "Qty" },
  { key: "channel", header: "Channel" },
];

export default function SubsidyDistributionPage() {
  return (
    <GenericTablePage
      title="Distribution tracking"
      description="Ground-truth issuance events reconciling allocations vs deliveries."
      table="distribution_logs"
      select="distributed_at,farmer_id,quantity,channel"
      columns={COLS}
      filename="distribution-tracking.csv"
    />
  );
}
