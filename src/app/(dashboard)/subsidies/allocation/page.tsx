"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "county", header: "County" },
  { key: "season", header: "Season" },
  { key: "quantity_allocated", header: "Allocated" },
  { key: "quantity_distributed", header: "Distributed" },
  { key: "inventory_item_id", header: "Input SKU" },
];

export default function SubsidyAllocationPage() {
  return (
    <GenericTablePage
      title="Subsidy allocation"
      description="County-season envelopes for agricultural inputs managed under MoA programmes."
      table="input_allocations"
      select="county,season,quantity_allocated,quantity_distributed,inventory_item_id"
      columns={COLS}
      filename="input-allocations.csv"
    />
  );
}
