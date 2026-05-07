"use client";

import * as React from "react";

import LogisticsTransfersWorkflow from "@/components/logistics/LogisticsTransfersWorkflow";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";
import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordStockTransferForm from "@/components/operations/forms/RecordStockTransferForm";

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
      <MinistryPageShell
        title="Transfer & shipment operations"
        description="Operational TRF workflow (requested → completed), shipment custody milestones, and immutable inventory_movements ledger for reconciliation."
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 rounded-lg bg-emerald-700 px-4 text-[13px] font-medium text-white hover:bg-emerald-600"
          >
            Quick ledger transfer
          </button>
        }
      >
        <div className="space-y-10 pb-12">
          <LogisticsTransfersWorkflow />
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Movement ledger</div>
            <LiveQueryGrid
              table="inventory_movements"
              select="created_at,movement_type,quantity,warehouse_from,warehouse_to,reference"
              columns={COLS}
              filename="inventory-movements.csv"
              title="Immutable inventory_movements"
              reloadTrigger={tick}
            />
          </div>
        </div>
      </MinistryPageShell>
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Stock transfer (ledger)" widthClassName="max-w-xl">
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
