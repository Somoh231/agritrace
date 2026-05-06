"use client";

import GenericTablePage from "@/components/operations/GenericTablePage";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "created_at", header: "When" },
  { key: "user_id", header: "Actor" },
  { key: "action", header: "Action" },
  { key: "table_name", header: "Table" },
];

export default function ComplianceAuditLogPage() {
  return (
    <GenericTablePage
      title="Audit logs"
      description="Immutable ministry audit trail across operational mutations."
      table="audit_log"
      select="created_at,user_id,action,table_name"
      columns={COLS}
      filename="audit-log.csv"
    />
  );
}
