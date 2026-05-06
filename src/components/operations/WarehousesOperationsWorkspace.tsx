"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordWarehouseForm from "@/components/operations/forms/RecordWarehouseForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "name", header: "Warehouse" },
  { key: "county", header: "County" },
  { key: "latitude", header: "Lat" },
  { key: "longitude", header: "Lng" },
  { key: "low_stock_threshold_pct", header: "Low-stock %" },
  { key: "created_at", header: "Created" },
];

export default function WarehousesOperationsWorkspace() {
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
        title="Warehouse operations"
        description="National warehouse footprint, thresholds, and geo anchors for routing and compliance."
        table="warehouses"
        select="id,name,county,latitude,longitude,low_stock_threshold_pct,created_at"
        columns={COLS}
        filename="warehouses.csv"
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Create warehouse
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Create warehouse">
        <RecordWarehouseForm
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
