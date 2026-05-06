"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";

export default function LiveQueryGrid({
  table,
  select,
  columns,
  filename,
  title,
  limit = 200,
  toolbar,
  eqFilters,
  reloadTrigger = 0,
}: {
  table: string;
  select: string;
  columns: GridColumn<Record<string, unknown>>[];
  filename: string;
  title?: string;
  limit?: number;
  toolbar?: React.ReactNode;
  eqFilters?: { column: string; value: string }[];
  reloadTrigger?: number;
}) {
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const filterKey = JSON.stringify(eqFilters ?? []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      let qb = supabase.from(table).select(select);
      const filters = (JSON.parse(filterKey) ?? []) as { column: string; value: string }[];
      for (const f of filters) {
        qb = qb.eq(f.column, f.value);
      }
      const { data, error: qErr } = await qb.limit(limit);
      if (qErr) throw qErr;
      setRows((data ?? []) as Record<string, unknown>[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [table, select, limit, filterKey]);

  React.useEffect(() => {
    void load();
  }, [load, reloadTrigger]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 px-6 py-16 text-center text-[13px] text-slate-500">
        Loading operational dataset…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-6 py-10 text-[13px] text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <EnterpriseDataGrid
      title={title}
      rows={rows}
      columns={columns}
      filename={filename}
      toolbar={
        <>
          {toolbar}
          <button
            type="button"
            onClick={() => void load()}
            className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] text-slate-200 hover:bg-slate-900"
          >
            Refresh
          </button>
        </>
      }
    />
  );
}
