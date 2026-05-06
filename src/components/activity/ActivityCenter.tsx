"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import StatusPill from "@/components/shared/StatusPill";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/utils/formatters";

type RawAuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  new_values: unknown;
  created_at: string;
  profiles?: { full_name: string; role: UserRole } | null;
};

type Module = "rice" | "cocoa" | "system";

function moduleFromTable(table: string | null): Module {
  const t = (table ?? "").toLowerCase();
  if (!t) return "system";
  if (t.includes("rice") || t.includes("report")) return "rice";
  if (
    t.includes("lot") ||
    t.includes("movement") ||
    t.includes("farmer") ||
    t.includes("plot") ||
    t.includes("compliance")
  )
    return "cocoa";
  return "system";
}

function toneForModule(m: Module) {
  switch (m) {
    case "rice":
      return "info" as const;
    case "cocoa":
      return "ok" as const;
    default:
      return "neutral" as const;
  }
}

export default function ActivityCenter() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<RawAuditRow[]>([]);

  const [moduleFilter, setModuleFilter] = React.useState<"" | Module>("");
  const [roleFilter, setRoleFilter] = React.useState<"" | UserRole>("");
  const [userQuery, setUserQuery] = React.useState("");
  const [range, setRange] = React.useState<"7d" | "30d" | "all">("30d");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();

        // Note: audit_log is RLS-restricted to super_admin by schema policy.
        const res = await supabase
          .from("audit_log")
          .select("id,user_id,action,table_name,record_id,new_values,created_at,profiles(full_name,role)")
          .order("created_at", { ascending: false })
          .limit(250);

        if (res.error) throw res.error;
        if (!cancelled) setRows((res.data ?? []) as RawAuditRow[]);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to load audit events. (Requires super admin access.)",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const now = Date.now();
    const ms =
      range === "7d" ? 7 * 86400000 : range === "30d" ? 30 * 86400000 : Number.POSITIVE_INFINITY;
    const since = now - ms;

    return rows.filter((r) => {
      if (ms !== Number.POSITIVE_INFINITY) {
        const t = new Date(r.created_at).getTime();
        if (!Number.isFinite(t) || t < since) return false;
      }

      const m = moduleFromTable(r.table_name);
      if (moduleFilter && m !== moduleFilter) return false;
      if (roleFilter && r.profiles?.role !== roleFilter) return false;
      if (userQuery.trim()) {
        const q = userQuery.trim().toLowerCase();
        const name = (r.profiles?.full_name ?? "").toLowerCase();
        if (!name.includes(q) && !(r.action ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, moduleFilter, roleFilter, userQuery, range]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div>
            <div className="font-display text-lg text-gray-900">Audit + Activity Center</div>
            <div className="mt-1 text-[12px] text-gray-600">
              A filtered, investor-ready timeline of system actions (RLS restricted).
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex items-end gap-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Module
              </div>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="">All</option>
                <option value="rice">Rice</option>
                <option value="cocoa">Cocoa</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Role
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="">All</option>
                <option value="super_admin">super_admin</option>
                <option value="admin">admin</option>
                <option value="ministry_officer">ministry_officer</option>
                <option value="government_officer">government_officer (legacy)</option>
                <option value="county_officer">county_officer</option>
                <option value="district_officer">district_officer</option>
                <option value="warehouse_manager">warehouse_manager</option>
                <option value="donor_partner">donor_partner</option>
                <option value="exporter">exporter</option>
                <option value="cooperative_manager">cooperative_manager</option>
                <option value="field_agent">field_agent</option>
                <option value="call_center_agent">call_center_agent</option>
                <option value="auditor">auditor</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                User / action
              </div>
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g. demo, CREATE, MOVE"
                className="h-9 w-full md:w-[220px] rounded-md border border-gray-200 bg-white px-3 text-[12px] outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-50"
              />
            </div>

            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Range
              </div>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <AlertBanner severity="warning" message={error} />
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[12px] text-gray-700">
            Showing <span className="font-mono">{filtered.length}</span> events
          </div>
          <a href="/setup" className="text-[12px] text-forest-800 hover:underline">
            Setup help
          </a>
        </div>

        {isLoading ? (
          <div className="p-5 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[12px] font-medium text-gray-900">No matching events</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Try broadening filters, or seed demo data to generate a baseline timeline.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const m = moduleFromTable(r.table_name);
              return (
                <div key={r.id} className="px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusPill status={toneForModule(m)} label={m.toUpperCase()} />
                        <div className="text-[12px] font-medium text-gray-900">
                          {r.action} {r.table_name ?? "system"}
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {(r.profiles?.full_name ?? "Unknown user") + (r.profiles?.role ? ` · ${r.profiles.role}` : "")}
                        {r.record_id ? ` · record ${r.record_id}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[10px] text-gray-400">
                      {formatDateTime(r.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

