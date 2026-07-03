"use client";

import * as React from "react";

import {
  AlertCard,
  DashboardPanel,
  PageHeader,
} from "@/components/enterprise";
import InventoryWarehouseOverview from "@/components/ais/InventoryWarehouseOverview";
import LogisticsCommandCenter from "@/components/logistics/LogisticsCommandCenter";
import LogisticsMovementTimelineSection from "@/components/logistics/LogisticsMovementTimelineSection";
import InventoryOperationsClient from "@/components/pilot/InventoryOperationsClient";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordInventoryReceiptForm from "@/components/operations/forms/RecordInventoryReceiptForm";

export default function InventoryNationalWorkspace() {
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    const open = () => setDrawer(true);
    window.addEventListener("agritrace-primary-action", open);
    return () => window.removeEventListener("agritrace-primary-action", open);
  }, []);

  return (
    <>
      <div className="space-y-6 pb-8">
        <PageHeader
          kicker="National logistics · Warehouse command"
          title="Warehouse & logistics command"
          description="National hub oversight, TRF transfer workflows, corridor maps, donor flows, and immutable inventory movements — Agrivault AIS logistics platform."
          actions={
            <button type="button" onClick={() => setDrawer(true)} className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
              Record receipt
            </button>
          }
        />

        <LogisticsCommandCenter />
        <InventoryWarehouseOverview />

        <DashboardPanel padding="none">
          <LogisticsMovementTimelineSection limit={72} />
        </DashboardPanel>

        <AlertCard tone="info" title="Distribution & allocation">
          County allocation progress, warehouse risk posture, and illustrative donor inventory — paired with live stock when Supabase is connected.
        </AlertCard>

        <DashboardPanel padding="none">
          <InventoryOperationsClient />
        </DashboardPanel>
      </div>

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
