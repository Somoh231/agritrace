"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFieldInspectionForm from "@/components/operations/forms/RecordFieldInspectionForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "visited_at", header: "Visited" },
  { key: "farmer_id", header: "Farmer" },
  { key: "verification_status", header: "Outcome" },
  { key: "notes", header: "Notes" },
  { key: "gps_latitude", header: "Lat" },
  { key: "gps_longitude", header: "Lng" },
];

export default function FieldInspectionsWorkspace() {
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
        title="Inspection visits"
        description="Geo-resolved field inspections attributed to extension officers and ministry proxies."
        table="farmer_visits"
        select="visited_at,farmer_id,verification_status,notes,gps_latitude,gps_longitude"
        columns={COLS}
        filename="farmer-visits.csv"
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Record inspection
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Field inspection" widthClassName="max-w-xl">
        <RecordFieldInspectionForm
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
