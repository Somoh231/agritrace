"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "alert_level", header: "Alert" },
  { key: "checked_at", header: "Checked" },
  { key: "warehouse_stock_id", header: "Stock" },
];

export default function ExpiryMonitoringPage() {
  return (
    <GenericTablePage
      title="Expiry monitoring"
      description="Automated expiry sentinel rows tied to warehouse stock positions."
      table="expiry_tracking"
      select="alert_level,checked_at,warehouse_stock_id"
      columns={COLS}
      filename="expiry-tracking.csv"
    />
  );
}
