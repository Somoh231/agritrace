"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFarmerVerificationDecisionForm from "@/components/operations/forms/RecordFarmerVerificationDecisionForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "full_name", header: "Farmer" },
  { key: "county", header: "County" },
  { key: "verification_status", header: "Verification" },
  { key: "subsidy_eligible", header: "Subsidy" },
  { key: "id", header: "UUID" },
];

export default function SubsidyVerificationWorkspace() {
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
        title="Beneficiary verification"
        description="Farmers pending ministry adjudication for subsidy programmes."
        table="farmers"
        select="id,full_name,county,verification_status,subsidy_eligible"
        eqFilters={[{ column: "verification_status", value: "pending" }]}
        columns={COLS}
        filename="subsidy-beneficiary-queue.csv"
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Approve / adjust
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Beneficiary decision" widthClassName="max-w-lg">
        <RecordFarmerVerificationDecisionForm
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
