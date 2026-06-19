"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import StatusChip, { type ChipTone } from "@/components/shared/table/StatusChip";
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

function toneForModule(m: Module): ChipTone {
  switch (m) {
    case "rice":
      return "info";
    case "cocoa":
      return "ok";
    default:
      return "neutral";
  }
}

type ActivityRow = {
  id: string;
  module: Module;
  action: string;
  target: string;
  user: string;
  role: string;
  record: string;
  time: string;
};

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

  const gridRows = React.useMemo<ActivityRow[]>(
    () =>
      filtered.map((r) => ({
        id: r.id,
        module: moduleFromTable(r.table_name),
        action: r.action,
        target: r.table_name ?? "system",
        user: r.profiles?.full_name ?? "Unknown user",
        role: r.profiles?.role ?? "—",
        record: r.record_id ?? "—",
        time: formatDateTime(r.created_at),
      })),
    [filtered],
  );

  const columns: GridColumn<ActivityRow>[] = [
    {
      key: "module",
      header: "Module",
      render: (r) => (
        <StatusChip tone={toneForModule(r.module)} theme="dark">
          {r.module}
        </StatusChip>
      ),
    },
    { key: "action", header: "Action", render: (r) => <span className="font-mono text-[11px]">{r.action}</span> },
    { key: "target", header: "Table" },
    { key: "user", header: "User" },
    { key: "role", header: "Role", render: (r) => <span className="font-mono text-[10px] text-slate-400">{r.role}</span> },
    { key: "record", header: "Record", render: (r) => <span className="font-mono text-[10px] text-slate-500">{r.record}</span> },
    { key: "time", header: "Time", render: (r) => <span className="font-mono text-[10px] text-slate-400">{r.time}</span> },
  ];

  const selectClass =
    "h-9 rounded-lg border border-slate-600 bg-slate-950 px-2 text-[12px] text-slate-100 outline-none focus:border-emerald-600";

  return (
    <div className="w-full space-y-4">
      <div className="cmd-surface rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div>
            <div className="font-serif-display text-lg text-white">Audit &amp; Activity Center</div>
            <div className="mt-1 text-[12px] text-slate-400">
              A filtered, investor-ready timeline of system actions (RLS restricted).
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex items-end gap-2">
            <div>
              <div className="cmd-kicker mb-1">Module</div>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as any)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="rice">Rice</option>
                <option value="cocoa">Cocoa</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <div className="cmd-kicker mb-1">Role</div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="super_admin">super_admin</option>
                <option value="admin">admin</option>
                <option value="ministry_admin">ministry_admin</option>
                <option value="ministry_officer">ministry_officer</option>
                <option value="government_officer">government_officer</option>
                <option value="county_agriculture_coordinator">county_agriculture_coordinator</option>
                <option value="county_officer">county_officer</option>
                <option value="dao_officer">dao_officer</option>
                <option value="district_officer">district_officer</option>
                <option value="exporter">exporter</option>
                <option value="cooperative_manager">cooperative_manager</option>
                <option value="clan_technician">clan_technician</option>
                <option value="field_agent">field_agent</option>
                <option value="warehouse_manager">warehouse_manager</option>
                <option value="donor_observer">donor_observer</option>
                <option value="donor_partner">donor_partner</option>
                <option value="call_center_agent">call_center_agent</option>
                <option value="auditor">auditor</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="cmd-kicker mb-1">User / action</div>
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g. demo, CREATE, MOVE"
                className="h-9 w-full md:w-[220px] rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <div className="cmd-kicker mb-1">Range</div>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as any)}
                className={selectClass}
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

      {isLoading ? (
        <div className="cmd-surface rounded-2xl p-6 text-[12px] text-slate-400 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity…
        </div>
      ) : (
        <EnterpriseDataGrid<ActivityRow>
          title="System audit timeline"
          rows={gridRows}
          columns={columns}
          filename="activity-audit.csv"
          pageSize={50}
          dense
          getRowKey={(r) => r.id}
          emptyLabel="No audit events match the current module, role, user, or date filters. Broaden the range or seed demo data to generate a baseline timeline."
        />
      )}
    </div>
  );
}

