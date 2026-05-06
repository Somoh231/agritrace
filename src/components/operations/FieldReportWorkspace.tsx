"use client";

import * as React from "react";

import GenericTablePage from "@/components/operations/GenericTablePage";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFieldReportForm from "@/components/operations/forms/RecordFieldReportForm";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "submitted_at", header: "Submitted" },
  { key: "county", header: "County" },
  { key: "summary", header: "Summary" },
  { key: "channel", header: "Channel" },
];

export default function FieldReportWorkspace({
  title,
  description,
  category,
}: {
  title: string;
  description: string;
  category: "pest" | "extension";
}) {
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
        title={title}
        description={description}
        table="field_reports"
        select="submitted_at,county,summary,channel"
        columns={COLS}
        filename={`field-reports-${category}.csv`}
        reloadTrigger={tick}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600"
          >
            Submit report
          </button>
        }
      />
      <OperationDrawer open={open} onClose={() => setOpen(false)} title={category === "pest" ? "Pest / disease" : "Extension report"}>
        <RecordFieldReportForm
          category={category}
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
