"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "inventory_item_id", header: "Inventory item" },
  { key: "warehouse_id", header: "Warehouse" },
  { key: "quantity", header: "Qty" },
  { key: "batch_code", header: "Batch" },
  { key: "expiry_date", header: "Expiry" },
  { key: "donor_tagged", header: "Donor tagged" },
  { key: "loss_flag", header: "Loss" },
];

export default function FertilizerInventoryPage() {
  return (
    <GenericTablePage
      title="Fertilizer tracking"
      description="Warehouse positions including batches and donor tagging — filter CSV exports downstream by SKU mapping."
      table="warehouse_stock"
      select="inventory_item_id,warehouse_id,quantity,batch_code,expiry_date,donor_tagged,loss_flag"
      columns={COLS}
      filename="warehouse-stock-fertilizer.csv"
    />
  );
}
