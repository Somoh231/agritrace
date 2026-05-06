"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordStockTransferForm from "@/components/operations/forms/RecordStockTransferForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "created_at", header: "When" },
  { key: "movement_type", header: "Type" },
  { key: "quantity", header: "Qty" },
  { key: "warehouse_from", header: "From" },
  { key: "warehouse_to", header: "To" },
  { key: "reference", header: "Ref" },
];

export default function InventoryTransfersWorkspace() {
  const [open, setOpen] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("agritrace-primary-action", h);
    return () => window.removeEventListener("agritrace-primary-action", h);
  }, []);

  return (
    <>
      <GenericTablePage
        title="Inventory transfers"
        description="Inter-warehouse movements with immutable ledger rows and stock reconciliation."
        table="inventory_movements"
        select="created_at,movement_type,quantity,warehouse_from,warehouse_to,reference"
        columns={COLS}
        filename="inventory-movements.csv"
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Transfer stock
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Stock transfer" widthClassName="max-w-xl">
        <RecordStockTransferForm
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setTick((t) => t + 1);
          }}
        />
      </OperationDrawer>
    </>
  );
}
