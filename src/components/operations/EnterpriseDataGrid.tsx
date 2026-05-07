"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export type GridColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
};

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const body = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EnterpriseDataGrid<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  pageSize = 25,
  toolbar,
  filename = "export.csv",
  emptyLabel = "No records match the current filters.",
  onRowClick,
  rowClassName,
}: {
  title?: string;
  rows: T[];
  columns: GridColumn<T>[];
  pageSize?: number;
  toolbar?: React.ReactNode;
  filename?: string;
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
}) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = needle
      ? rows.filter((r) =>
          columns.some((c) => {
            const v = r[c.key as keyof T];
            return String(v ?? "")
              .toLowerCase()
              .includes(needle);
          }),
        )
      : rows;
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = String(a[sortKey as keyof T] ?? "");
        const bv = String(b[sortKey as keyof T] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, q, columns, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => {
    setPage(0);
  }, [q, rows.length]);

  const onSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const onExport = () => {
    const headers = columns.map((c) => c.header);
    const csvRows = filtered.map((row) =>
      columns.map((c) => {
        const raw = row[c.key as keyof T];
        return raw == null ? "" : String(raw);
      }),
    );
    downloadCsv(filename, headers, csvRows);
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 py-3 border-b border-slate-700/80 bg-slate-950/60">
        <div className="min-w-0">
          {title ? (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{title}</div>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Dataset</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter…"
            className="h-9 w-[200px] rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-600"
            aria-label="Filter table"
          />
          {toolbar}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] text-slate-200 hover:bg-slate-900"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-slate-700/80 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wide">
              {columns.map((c) => (
                <th key={String(c.key)} className="px-4 py-2.5 whitespace-nowrap" style={{ width: c.width }}>
                  <button
                    type="button"
                    onClick={() => onSort(String(c.key))}
                    className="inline-flex items-center gap-1 hover:text-emerald-300"
                  >
                    {c.header}
                    {sortKey === String(c.key) ? <span className="text-emerald-400">{sortDir === "asc" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/90">
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="mx-auto max-w-[520px] rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="font-display text-[14px] font-semibold text-white">No records in scope</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-slate-400">
                      {emptyLabel}
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500">
                      Guidance: confirm date range, county/district scope, and role permissions. Example: “No DAO submissions received for this district this week.”
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={String((row as Record<string, unknown>).id ?? i)}
                  className={`hover:bg-slate-800/40 text-slate-200 ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) ?? ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-4 py-2.5 align-top whitespace-nowrap max-w-[280px] truncate">
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-700/80 bg-slate-950/60 text-[11px] text-slate-500">
        <span>
          {filtered.length} rows · page {safePage + 1}/{pages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-900 disabled:opacity-40 inline-flex items-center justify-center text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-900 disabled:opacity-40 inline-flex items-center justify-center text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
