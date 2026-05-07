"use client";

import * as React from "react";

import InventoryWarehouseOverview from "@/components/ais/InventoryWarehouseOverview";
import InventoryOperationsClient from "@/components/pilot/InventoryOperationsClient";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordInventoryReceiptForm from "@/components/operations/forms/RecordInventoryReceiptForm";
import MinistryPageShell from "@/components/operations/MinistryPageShell";

export default function InventoryNationalWorkspace() {
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    const open = () => setDrawer(true);
    window.addEventListener("agritrace-primary-action", open);
    return () => window.removeEventListener("agritrace-primary-action", open);
  }, []);

  return (
    <>
      <MinistryPageShell
        title="National inventory"
        description="Inputs balances, allocations, transfers, and donor-tagged stock. Post receipts to update movements and warehouse balances."
        actions={
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="h-10 px-4 rounded-lg bg-emerald-700 text-[13px] font-medium text-white hover:bg-emerald-600"
          >
            Record receipt
          </button>
        }
      >
        <InventoryWarehouseOverview />
        <div className="rounded-xl border border-slate-700/60 bg-white/[0.03] p-1">
          <InventoryOperationsClient />
        </div>
      </MinistryPageShell>

      <OperationDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Inventory receipt"
        subtitle="Posts a receipt movement and increments warehouse stock."
        widthClassName="max-w-xl"
      >
        <RecordInventoryReceiptForm
          onCancel={() => setDrawer(false)}
          onSuccess={() => {
            setDrawer(false);
            window.dispatchEvent(new CustomEvent("agritrace-table-refresh"));
          }}
        />
      </OperationDrawer>
    </>
  );
}
