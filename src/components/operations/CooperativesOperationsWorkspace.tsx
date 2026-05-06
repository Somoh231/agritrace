"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordCooperativeForm from "@/components/operations/forms/RecordCooperativeForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  { key: "county", header: "County" },
  { key: "country", header: "Country" },
  { key: "license_number", header: "License" },
  { key: "created_at", header: "Created" },
];

export default function CooperativesOperationsWorkspace() {
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
        title="Cooperatives"
        description="Registered farmer organizations and cooperative legal entities. Adds append-only audit entries on create."
        table="organizations"
        select="id,name,type,county,country,license_number,created_at"
        eqFilters={[{ column: "type", value: "cooperative" }]}
        columns={COLS}
        filename="cooperatives.csv"
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Add cooperative
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Register cooperative">
        <RecordCooperativeForm
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
