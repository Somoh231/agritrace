"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils/formatters";

type AuditRow = {
  id: string;
  action: string;
  table_name: string | null;
  new_values: any;
  created_at: string;
};

function tag(action: string) {
  switch (action) {
    case "CREATE":
      return { cls: "bg-green-50 text-green-800", label: "CREATE" };
    case "MOVE":
      return { cls: "bg-blue-50 text-blue-800", label: "MOVE" };
    case "FLAG":
      return { cls: "bg-red-50 text-red-800", label: "FLAG" };
    case "UPDATE":
      return { cls: "bg-gray-100 text-gray-600", label: "UPDATE" };
    default:
      return { cls: "bg-gray-100 text-gray-600", label: action };
  }
}

export default function AuditTrail() {
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [limit, setLimit] = React.useState(50);
  const [filter, setFilter] = React.useState<string>("");

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      let q = supabase
        .from("audit_log")
        .select("id, action, table_name, new_values, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filter) q = q.eq("action", filter);
      const { data } = await q;
      setRows((data as any) ?? []);
    }
    load();
  }, [limit, filter]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="font-display text-[16px] text-gray-900">Audit trail</div>
          <div className="text-[12px] text-gray-500">Read-only system actions.</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
          >
            <option value="">All</option>
            {["CREATE", "MOVE", "FLAG", "UPDATE"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Export log
          </button>
        </div>
      </div>

      <div>
        {rows.map((r, idx) => {
          const t = tag(r.action);
          const text = `${r.action}${r.table_name ? ` · ${r.table_name}` : ""}${
            r.new_values ? ` · ${JSON.stringify(r.new_values)}` : ""
          }`;
          return (
            <div
              key={r.id}
              className={`px-4 py-3 flex items-start gap-3 ${idx === rows.length - 1 ? "" : "border-b border-gray-100"}`}
            >
              <span className={`shrink-0 w-[70px] text-center rounded-md px-2 py-1 text-[9px] font-mono ${t.cls}`}>
                {t.label}
              </span>
              <div className="flex-1 text-[12px] text-gray-800 leading-relaxed break-words">
                {text}
              </div>
              <div className="shrink-0 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                {formatDateTime(r.created_at)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[11px] text-gray-500">Showing {rows.length} records.</div>
        <button
          type="button"
          onClick={() => setLimit((l) => l + 50)}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
        >
          Load more
        </button>
      </div>
    </div>
  );
}

