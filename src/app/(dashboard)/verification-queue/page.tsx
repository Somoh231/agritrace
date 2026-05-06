"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "full_name", header: "Farmer" },
  { key: "county", header: "County" },
  { key: "verification_status", header: "Status" },
  { key: "national_id", header: "National ID" },
  { key: "created_at", header: "Registered" },
];

export default function VerificationQueuePage() {
  return (
    <GenericTablePage
      title="Verification queue"
      description="Farmers awaiting ministry verification decisions prior to subsidy enrollment."
      table="farmers"
      select="full_name,county,verification_status,national_id,created_at"
      eqFilters={[{ column: "verification_status", value: "pending" }]}
      columns={COLS}
      filename="verification-queue.csv"
    />
  );
}
