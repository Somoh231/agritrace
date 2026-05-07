"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordDonorShipmentForm from "@/components/operations/forms/RecordDonorShipmentForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "donor_name", header: "Donor" },
  { key: "programme_code", header: "Programme" },
  { key: "quantity", header: "Qty" },
  { key: "received_at", header: "Received" },
  { key: "inventory_item_id", header: "Item ID" },
  { key: "warehouse_id", header: "Warehouse" },
  { key: "created_at", header: "Logged" },
];

export default function DonorShipmentsOperationsWorkspace() {
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
        title="Donor shipments"
        description="Formal donor programme receipts mapped to inventory lines and warehouses."
        table="donor_shipments"
        select="donor_name,programme_code,quantity,received_at,inventory_item_id,warehouse_id,created_at"
        columns={COLS}
        filename="donor-shipments.csv"
        reloadTrigger={tick}
        groupHeaderKey="donor_name"
        groupHeaderTitle="Donor programme"
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Log donor shipment
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Donor shipment" widthClassName="max-w-xl">
        <RecordDonorShipmentForm
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
