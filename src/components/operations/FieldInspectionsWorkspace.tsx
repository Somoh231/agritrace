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
  {
    key: "boundary_area_ha",
    header: "Boundary (ha est.)",
    render: (row) => {
      const v = row.boundary_area_ha;
      const ha = v != null && Number.isFinite(Number(v)) ? Number(v) : null;
      const hasPoly = Boolean(row.boundary_geometry);
      if (!hasPoly) return <span className="text-slate-500">—</span>;
      return <span className="font-mono tabular-nums text-emerald-200">{ha != null ? ha.toFixed(2) : "saved"}</span>;
    },
  },
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
        select="visited_at,farmer_id,verification_status,notes,gps_latitude,gps_longitude,boundary_geometry,boundary_area_ha,boundary_captured_at"
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
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Field inspection" widthClassName="max-w-3xl w-full">
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
