"use client";

import * as React from "react";

import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import { StatusBadge } from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";

const cols: GridColumn<DaoOversightRow>[] = [
  { key: "daoId", header: "DAO ID" },
  { key: "daoName", header: "DAO name" },
  { key: "district", header: "District" },
  { key: "assignedFarmers", header: "Assigned farmers" },
  { key: "reportsSubmitted", header: "Reports submitted" },
  {
    key: "overdueReports",
    header: "Overdue reports",
    render: (r) => <span className={r.overdueReports > 0 ? "font-semibold text-rose-700 tabular-nums" : "tabular-nums text-slate-700"}>{r.overdueReports}</span>,
  },
  { key: "farmVisits", header: "Farm visits" },
  { key: "subsidyVerifications", header: "Subsidy verifications" },
  {
    key: "gpsVerificationRate",
    header: "GPS verify %",
    render: (r) => <span className="tabular-nums">{r.gpsVerificationRate}%</span>,
  },
  {
    key: "syncStatus",
    header: "Sync status",
    render: (r) => (
      <StatusBadge tone={r.syncStatus === "at_risk" ? "danger" : r.syncStatus === "pending" ? "warning" : "success"}>
        {r.syncStatus.replace(/_/g, " ")}
      </StatusBadge>
    ),
  },
  { key: "lastActivity", header: "Last activity" },
  {
    key: "riskStatus",
    header: "Risk status",
    render: (r) => (
      <StatusBadge tone={r.riskStatus === "high" ? "danger" : r.riskStatus === "medium" ? "warning" : "success"}>
        {r.riskStatus}
      </StatusBadge>
    ),
  },
  {
    key: "actions",
    header: "Quick actions",
    render: (r) => (
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("agritrace-cac-dao-review", { detail: r.daoId }));
          }}
        >
          Review
        </button>
        <button
          type="button"
          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("agritrace-cac-correction", { detail: r.daoId }));
          }}
        >
          Corrections
        </button>
        <button
          type="button"
          className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-800 hover:bg-rose-100"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("agritrace-cac-escalate", { detail: r.daoId }));
          }}
        >
          Escalate
        </button>
      </div>
    ),
  },
];

export default function CaoDaoOversightGrid({
  rows,
  districtFilter,
  syncFilter,
  onDistrictFilterChange,
  onSyncFilterChange,
}: {
  rows: DaoOversightRow[];
  districtFilter: string;
  syncFilter: string;
  onDistrictFilterChange: (v: string) => void;
  onSyncFilterChange: (v: string) => void;
}) {
  const districts = React.useMemo(() => {
    const s = new Set(rows.map((r) => r.district));
    return ["all", ...[...s].sort()];
  }, [rows]);

  const filtered = React.useMemo(() => {
    let list = rows;
    if (districtFilter !== "all") list = list.filter((r) => r.district === districtFilter);
    if (syncFilter !== "all") list = list.filter((r) => r.syncStatus === syncFilter);
    return list;
  }, [rows, districtFilter, syncFilter]);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-[11px] text-slate-600">
        District
        <select
          value={districtFilter}
          onChange={(e) => onDistrictFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-800 outline-none focus:border-forest-400"
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d === "all" ? "All districts" : d}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-[11px] text-slate-600">
        Sync risk
        <select
          value={syncFilter}
          onChange={(e) => onSyncFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-800 outline-none focus:border-forest-400"
        >
          <option value="all">All</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
          <option value="at_risk">At risk</option>
        </select>
      </label>
    </div>
  );

  return (
    <EnterpriseDataGrid<DaoOversightRow>
      rows={filtered}
      columns={cols}
      filename="cac-dao-oversight.csv"
      pageSize={12}
      theme="light"
      toolbar={toolbar}
      rowClassName={(row) => {
        const parts: string[] = [];
        if (row.overdueReports > 0) parts.push("bg-rose-50/80 border-l-2 border-l-rose-400");
        if (row.syncStatus === "at_risk") parts.push("ring-1 ring-inset ring-amber-300/60");
        return parts.join(" ");
      }}
    />
  );
}
