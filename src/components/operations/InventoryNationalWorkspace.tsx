"use client";

import * as React from "react";

import InventoryWarehouseOverview from "@/components/ais/InventoryWarehouseOverview";
import LogisticsCommandCenter from "@/components/logistics/LogisticsCommandCenter";
import LogisticsMovementTimelineSection from "@/components/logistics/LogisticsMovementTimelineSection";
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
        title="Warehouse & logistics command"
        description="National hub oversight, TRF transfer workflows, corridor maps, donor flows, and immutable inventory movements — Agrivault AIS logistics platform."
        actions={
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="btn-emerald h-10 px-4 rounded-lg text-[13px]"
          >
            Record receipt
          </button>
        }
      >
        <div className="space-y-6">
          <LogisticsCommandCenter />
          <InventoryWarehouseOverview />
          <LogisticsMovementTimelineSection limit={72} />
          <div className="gov-card p-1">
            <InventoryOperationsClient />
          </div>
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
