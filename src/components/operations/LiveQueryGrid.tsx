"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";

function GridSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/80 bg-slate-950/60">
        <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse" />
      </div>
      <div className="p-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 rounded bg-white/[0.05] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function SoftWarning({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-900/45 bg-amber-950/15 px-6 py-5 text-[13px] text-amber-100">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-1 text-[12px] text-amber-100/80 leading-relaxed">{detail}</div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-[12px] text-slate-200 hover:bg-slate-800"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

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
  dense = true,
  groupHeaderKey,
  groupHeaderTitle,
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
  /** Institutional dense rows for operational tables */
  dense?: boolean;
  groupHeaderKey?: keyof Record<string, unknown> | string;
  groupHeaderTitle?: string;
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
    return <GridSkeleton />;
  }

  if (error) {
    return (
      <SoftWarning
        title="Operational dataset unavailable"
        detail={`${error}. This may indicate role-based redaction (RLS) or an unseeded table. Use the Refresh control or confirm your workspace role has read access.`}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <EnterpriseDataGrid
      title={title}
      rows={rows}
      columns={columns}
      filename={filename}
      dense={dense}
      groupHeaderKey={groupHeaderKey}
      groupHeaderTitle={groupHeaderTitle}
      emptyLabel="No operational rows returned for the current scope."
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
