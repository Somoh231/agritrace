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

export default function RegistrationApprovalsPage() {
  return (
    <GenericTablePage
      title="Registration approvals"
      description="Flagged registrations requiring supervisory sign-off."
      table="farmers"
      select="full_name,county,verification_status,national_id,created_at"
      eqFilters={[{ column: "verification_status", value: "flagged" }]}
      columns={COLS}
      filename="registration-flagged.csv"
    />
  );
}
