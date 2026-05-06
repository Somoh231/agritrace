"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "name", header: "Supplier" },
  { key: "country", header: "Country" },
  { key: "notes", header: "Notes" },
  { key: "created_at", header: "Registered" },
];

export default function ProcurementOversightPage() {
  return (
    <GenericTablePage
      title="Procurement oversight"
      description="National supplier registry feeding procurement compliance workflows."
      table="supplier_records"
      select="name,country,notes,created_at"
      columns={COLS}
      filename="suppliers.csv"
    />
  );
}
