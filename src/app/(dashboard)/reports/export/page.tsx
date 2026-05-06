"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "report_code", header: "Code" },
  { key: "title", header: "Title" },
  { key: "period_label", header: "Period" },
  { key: "status", header: "Status" },
];

export default function ReportsExportPage() {
  return (
    <GenericTablePage
      title="Export reports"
      description="Registered ministry report artefacts available for CSV extraction."
      table="reports"
      select="report_code,title,period_label,status"
      columns={COLS}
      filename="reports-registry.csv"
    />
  );
}
