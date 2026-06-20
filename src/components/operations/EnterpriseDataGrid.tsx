"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Download } from "lucide-react";

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
  dense = false,
  stickyHeader = true,
  scrollMaxHeightClass = "max-h-[min(70vh,720px)]",
  renderExpanded,
  getRowKey,
  groupHeaderKey,
  groupHeaderTitle = "Group",
  theme = "light",
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
  /** Dense rows for ministry operational datasets */
  dense?: boolean;
  /** Surface theme — "dark" for the operational shell, "light" for the admin console */
  theme?: "dark" | "light";
  /** Sticky table header inside vertical scroll region */
  stickyHeader?: boolean;
  /** Tailwind max-height class for table body scroll; set "" to disable vertical clip */
  scrollMaxHeightClass?: string;
  /** Optional expandable audit / detail band beneath the row */
  renderExpanded?: (row: T) => React.ReactNode;
  /** Stable row id for expand state (defaults to row.id or row index) */
  getRowKey?: (row: T, index: number) => string;
  /** When set, inserts grouped section rows sorted by this field */
  groupHeaderKey?: keyof T | string;
  /** Label prefix for grouped header rows */
  groupHeaderTitle?: string;
}) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const rowKeyFn = React.useCallback(
    (row: T, i: number) => getRowKey?.(row, i) ?? String((row as Record<string, unknown>).id ?? `idx-${i}`),
    [getRowKey],
  );

  const toggleExpand = React.useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandable = Boolean(renderExpanded);
  // Clickable rows that don't expand get a trailing disclosure affordance so they read as actionable.
  const hasRowAction = Boolean(onRowClick) && !expandable;
  const colSpan = columns.length + (expandable ? 1 : 0) + (hasRowAction ? 1 : 0);

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
    const gk = groupHeaderKey ? String(groupHeaderKey) : "";
    if (gk) {
      list = [...list].sort((a, b) => {
        const cmpG = String(a[gk as keyof T] ?? "").localeCompare(String(b[gk as keyof T] ?? ""));
        if (cmpG !== 0) return cmpG;
        if (sortKey) {
          const av = String(a[sortKey as keyof T] ?? "");
          const bv = String(b[sortKey as keyof T] ?? "");
          const cmp = av.localeCompare(bv, undefined, { numeric: true });
          return sortDir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    } else if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = String(a[sortKey as keyof T] ?? "");
        const bv = String(b[sortKey as keyof T] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, q, columns, sortKey, sortDir, groupHeaderKey]);

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

  const cellPad = dense ? "px-3 py-1.5" : "px-4 py-2.5";
  const headPad = dense ? "px-3 py-2" : "px-4 py-2.5";
  const rowText = dense ? "text-[11px]" : "text-[12px]";
  const headText = dense ? "text-[9px]" : "text-[10px]";

  const light = theme === "light";
  const T = {
    container: light ? "border-gray-200 bg-white" : "border-slate-700/80 bg-slate-900/50",
    bar: light ? "border-b border-gray-100 bg-gray-50" : "border-b border-slate-700/80 bg-slate-950/60",
    title: light ? "text-gray-400" : "text-slate-500",
    titleMuted: light ? "text-gray-300" : "text-slate-600",
    input: light
      ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-forest-300 focus:ring-2 focus:ring-forest-50"
      : "border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-600",
    csvBtn: light
      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      : "border-slate-600 bg-slate-950 text-slate-200 hover:bg-slate-900",
    theadRow: light
      ? "border-b border-gray-200 bg-gray-50 text-gray-500 font-mono uppercase tracking-wide"
      : "border-b border-slate-700/80 bg-slate-950/95 text-slate-400 font-mono uppercase tracking-wide backdrop-blur-sm shadow-[0_1px_0_rgba(148,163,184,0.08)]",
    thHover: light ? "hover:text-forest-700" : "hover:text-emerald-300",
    sortArrow: light ? "text-forest-600" : "text-emerald-400",
    divide: light ? "divide-gray-100" : "divide-slate-800/90",
    emptyBox: light ? "border-gray-200 bg-gray-50" : "border-white/10 bg-black/20",
    emptyTitle: light ? "text-gray-900" : "text-white",
    emptyText: light ? "text-gray-600" : "text-slate-400",
    emptyHint: light ? "text-gray-500" : "text-slate-500",
    groupRow: light ? "bg-gray-50 border-t border-gray-200 text-gray-500" : "bg-slate-950/95 border-t border-slate-700/90 text-slate-500",
    row: light ? "hover:bg-gray-50 text-gray-800" : "hover:bg-slate-800/40 text-slate-200",
    expandBtn: light
      ? "border-gray-200 bg-white text-gray-500 hover:border-forest-300 hover:text-forest-700"
      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-emerald-700/60 hover:text-emerald-300",
    expandedBand: light ? "border-b border-gray-200 bg-gray-50 text-gray-600" : "border-b border-slate-800/90 bg-black/35 text-slate-400",
    actionChevron: light ? "text-gray-300 group-hover:text-forest-700" : "text-slate-600 group-hover:text-emerald-300",
    footer: light ? "border-t border-gray-100 bg-gray-50 text-gray-500" : "border-t border-slate-700/80 bg-slate-950/60 text-slate-500",
    pageBtn: light ? "border-gray-200 bg-white text-gray-600" : "border-slate-700 bg-slate-900 text-slate-300",
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${T.container}`}>
      <div className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 py-3 ${T.bar}`}>
        <div className="min-w-0">
          {title ? (
            <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${T.title}`}>{title}</div>
          ) : (
            <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${T.titleMuted}`}>Dataset</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter…"
            className={`w-[200px] rounded-lg border px-3 outline-none ${T.input} ${dense ? "h-8 text-[11px]" : "h-9 text-[12px]"}`}
            aria-label="Filter table"
          />
          {toolbar}
          <button
            type="button"
            onClick={onExport}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[12px] ${T.csvBtn}`}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            CSV
          </button>
        </div>
      </div>

      <div
        className={`overflow-x-auto ${scrollMaxHeightClass ? `${scrollMaxHeightClass} overflow-y-auto overscroll-contain` : ""}`}
      >
        <table className={`min-w-full text-left ${rowText}`}>
          <thead className={stickyHeader ? "sticky top-0 z-20" : undefined}>
            <tr
              className={`${T.theadRow} ${headText}`}
            >
              {expandable ? (
                <th className={`${headPad} w-10 text-center text-slate-600`} aria-label="Expand detail">
                  {/* chevron column */}
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={String(c.key)} className={`${headPad} whitespace-nowrap`} style={{ width: c.width }}>
                  <button
                    type="button"
                    onClick={() => onSort(String(c.key))}
                    className={`inline-flex items-center gap-1 ${T.thHover}`}
                  >
                    {c.header}
                    {sortKey === String(c.key) ? <span className={T.sortArrow}>{sortDir === "asc" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
              {hasRowAction ? <th className={`${headPad} w-10`} aria-label="Open detail" /> : null}
            </tr>
          </thead>
          <tbody className={`divide-y ${T.divide}`}>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className={`${cellPad} py-10 text-center`}>
                  <div className={`mx-auto max-w-[520px] rounded-xl border px-4 py-4 ${T.emptyBox}`}>
                    <div className={`font-display font-semibold ${T.emptyTitle} ${dense ? "text-[13px]" : "text-[14px]"}`}>No records in scope</div>
                    <div className={`mt-2 leading-relaxed ${T.emptyText} ${dense ? "text-[11px]" : "text-[12px]"}`}>
                      {emptyLabel}
                    </div>
                    <div className={`mt-3 text-[11px] ${T.emptyHint}`}>
                      Guidance: confirm date range, county/district scope, and role permissions. Example: “No DAO submissions received for this district this week.”
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              (() => {
                const frag: React.ReactNode[] = [];
                let lastGroup = "";
                const gk = groupHeaderKey ? String(groupHeaderKey) : "";
                slice.forEach((row, i) => {
                  const rk = rowKeyFn(row, i);
                  const open = expanded.has(rk);
                  const gVal = gk ? String(row[gk as keyof T] ?? "") : "";
                  if (gk && gVal !== lastGroup) {
                    lastGroup = gVal;
                    frag.push(
                      <tr key={`grp-${safePage}-${rk}-${gVal}`} className={T.groupRow}>
                        <td colSpan={colSpan} className={`${dense ? "px-3 py-1.5" : "px-4 py-2"} font-mono text-[10px] uppercase tracking-[0.14em]`}>
                          {groupHeaderTitle} · {gVal || "—"}
                        </td>
                      </tr>,
                    );
                  }
                  frag.push(
                    <React.Fragment key={rk}>
                      <tr
                        className={`group ${T.row} ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) ?? ""}`}
                        onClick={() => onRowClick?.(row)}
                      >
                        {expandable ? (
                          <td className={`${cellPad} align-middle text-center`} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={open ? "Collapse row detail" : "Expand row detail"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(rk);
                              }}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${T.expandBtn}`}
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                            </button>
                          </td>
                        ) : null}
                        {columns.map((c) => (
                          <td key={String(c.key)} className={`${cellPad} align-top whitespace-nowrap max-w-[280px] truncate`}>
                            {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                          </td>
                        ))}
                        {hasRowAction ? (
                          <td className={`${cellPad} w-10 text-right align-middle`}>
                            <ChevronRight className={`ml-auto h-4 w-4 transition ${T.actionChevron}`} aria-hidden />
                          </td>
                        ) : null}
                      </tr>
                      {expandable && renderExpanded && open ? (
                        <tr className={T.expandedBand}>
                          <td colSpan={colSpan} className={`${dense ? "px-3 py-2" : "px-4 py-3"} text-[11px]`}>
                            {renderExpanded(row)}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>,
                  );
                });
                return frag;
              })()
            )}
          </tbody>
        </table>
      </div>

      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-[11px] ${T.footer}`}>
        <span>
          {filtered.length === 0
            ? "0 rows"
            : `Showing ${safePage * pageSize + 1}–${Math.min(filtered.length, safePage * pageSize + pageSize)} of ${filtered.length}`}
          {" · "}page {safePage + 1}/{pages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={`h-8 w-8 rounded-lg border disabled:opacity-40 inline-flex items-center justify-center ${T.pageBtn}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className={`h-8 w-8 rounded-lg border disabled:opacity-40 inline-flex items-center justify-center ${T.pageBtn}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
