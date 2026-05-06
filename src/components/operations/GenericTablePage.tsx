"use client";

import type { ReactNode } from "react";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";

/** Live Supabase-backed operational page with enterprise grid */
export default function GenericTablePage({
  title,
  description,
  table,
  select,
  columns,
  filename,
  actions,
  toolbar,
  limit,
  eqFilters,
  reloadTrigger,
}: {
  title: string;
  description: string;
  table: string;
  select: string;
  columns: GridColumn<Record<string, unknown>>[];
  filename: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  limit?: number;
  eqFilters?: { column: string; value: string }[];
  reloadTrigger?: number;
}) {
  return (
    <MinistryPageShell title={title} description={description} actions={actions}>
      <LiveQueryGrid
        table={table}
        select={select}
        columns={columns}
        filename={filename}
        title="Operational records"
        limit={limit}
        toolbar={toolbar}
        eqFilters={eqFilters}
        reloadTrigger={reloadTrigger}
      />
    </MinistryPageShell>
  );
}

/** Static rows (e.g. derived client-side) */
export function StaticGridPage({
  title,
  description,
  rows,
  columns,
  filename,
  actions,
}: {
  title: string;
  description: string;
  rows: Record<string, unknown>[];
  columns: GridColumn<Record<string, unknown>>[];
  filename: string;
  actions?: ReactNode;
}) {
  return (
    <MinistryPageShell title={title} description={description} actions={actions}>
      <EnterpriseDataGrid rows={rows} columns={columns} filename={filename} title="Dataset" />
    </MinistryPageShell>
  );
}
