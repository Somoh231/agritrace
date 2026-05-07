"use client";

import * as React from "react";
import Link from "next/link";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import { OpsMetric, OpsStatusBadge } from "@/components/pilot/pilot-ui";
import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import { fetchCountyWarehouseSignals, fetchDaoOversightRows } from "@/lib/data/ministry-data-service";
import type { UserRole } from "@/lib/supabase/types";
import type { WarehouseRow } from "@/lib/demo/agriculture-pilot-data";
import { warehouses as demoWarehouses } from "@/lib/demo/agriculture-pilot-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function normalizeCounty(c: string | null | undefined) {
  return (c ?? "").trim().toLowerCase();
}

const daoCols: GridColumn<DaoOversightRow>[] = [
  { key: "daoName", header: "DAO" },
  { key: "district", header: "District" },
  { key: "reportsSubmitted", header: "Reports" },
  { key: "overdueReports", header: "Overdue" },
  { key: "farmVisits", header: "Visits" },
  {
    key: "verificationRate",
    header: "Verification %",
    render: (r) => <span className="tabular-nums">{r.verificationRate}%</span>,
  },
  { key: "lastActivity", header: "Last activity" },
  {
    key: "riskScore",
    header: "Risk",
    render: (r) => (
      <span className={r.riskScore > 55 ? "text-rose-300" : r.riskScore > 35 ? "text-amber-300" : "text-emerald-300"}>
        {r.riskScore}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (r) => (
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("agritrace-dao-review", { detail: r.daoName }));
          }}
        >
          Review
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Message
        </button>
        <button
          type="button"
          className="rounded-md border border-rose-900/60 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-950/40"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Escalate
        </button>
      </div>
    ),
  },
];

export default function CountyOfficerDashboard({
  county,
  role,
  fullName,
}: {
  county: string | null;
  role: UserRole;
  fullName: string;
}) {
  const nc = normalizeCounty(county);
  const [farmersCount, setFarmersCount] = React.useState<number | null>(null);
  const [daoRows, setDaoRows] = React.useState<DaoOversightRow[]>([]);
  const [warehouseRows, setWarehouseRows] = React.useState<WarehouseRow[]>([]);

  React.useEffect(() => {
    void (async () => {
      const [dao, wh] = await Promise.all([fetchDaoOversightRows(county), fetchCountyWarehouseSignals(county)]);
      setDaoRows(dao);
      setWarehouseRows(wh);
    })();
  }, [county]);

  React.useEffect(() => {
    void (async () => {
      if (!county?.trim()) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const { count, error } = await supabase
          .from("farmers")
          .select("id", { count: "exact", head: true })
          .ilike("county", county.trim());
        if (!error && count != null) setFarmersCount(count);
      } catch {
        /* ignore */
      }
    })();
  }, [county]);

  const scopedWarehouses = React.useMemo(() => {
    if (warehouseRows.length) {
      if (!nc) return warehouseRows;
      return warehouseRows.filter((w) => normalizeCounty(w.county) === nc || w.county.toLowerCase().includes(nc));
    }
    if (!nc) return demoWarehouses;
    return demoWarehouses.filter((w) => normalizeCounty(w.county) === nc || w.county.toLowerCase().includes(nc));
  }, [nc, warehouseRows]);

  const unresolvedAlerts =
    daoRows.reduce((s, r) => s + r.overdueReports, 0) + (farmersCount !== null && farmersCount < 50 ? 1 : 0);

  const assignmentGap = role === "county_officer" && !county?.trim();

  return (
    <MinistryPageShell
      title={assignmentGap ? "County workspace" : `${county ?? "County"} · CAO command`}
      description={
        assignmentGap
          ? "Your profile has no county assignment. Contact the ministry administrator to bind scope."
          : `County Agriculture Officer view for ${fullName}. District DAO oversight, farmer registrations, warehouse posture, and subsidy cadence for this jurisdiction only.`
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/district-dashboard"
            className="h-10 inline-flex items-center rounded-lg border border-slate-600 px-4 text-[13px] text-slate-100 hover:bg-slate-800"
          >
            DAO field workspace
          </Link>
          <Link
            href="/farmers"
            className="h-10 inline-flex items-center rounded-lg bg-emerald-700 px-4 text-[13px] font-medium text-white hover:bg-emerald-600"
          >
            Farmer registry
          </Link>
        </div>
      }
    >
      {assignmentGap ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-50">
          County scope is required for automated KPI filtering. National ministry officers may use the national command center for multi-county analytics.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
        <OpsMetric
          label="Farmers registered"
          value={farmersCount != null ? Intl.NumberFormat().format(farmersCount) : "—"}
          tone="forest"
        />
        <OpsMetric label="District DAO rows" value={String(daoRows.length)} tone="navy" />
        <OpsMetric label="Warehouse nodes (signals)" value={String(scopedWarehouses.length)} tone="amber" />
        <OpsMetric label="Unresolved signals" value={String(unresolvedAlerts)} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-4">
          <div className="font-display text-[14px] font-semibold text-white">District comparison</div>
          <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
            Reporting throughput vs visit cadence. Escalations route to ministry coordination when DAO deadlines slip.
          </p>
          <div className="mt-3 space-y-2">
            {daoRows.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                <div>
                  <div className="text-[12px] font-medium text-slate-100">{r.district}</div>
                  <div className="text-[11px] text-slate-500">{r.daoName}</div>
                </div>
                <OpsStatusBadge status={r.riskScore > 55 ? "critical" : r.riskScore > 35 ? "warning" : "healthy"} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-4">
          <div className="font-display text-[14px] font-semibold text-white">Warehouse & subsidy posture</div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
            {scopedWarehouses.slice(0, 6).map((w) => (
              <li key={w.id} className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                <span>{w.name}</span>
                <OpsStatusBadge status={w.stockRisk} />
              </li>
            ))}
          </ul>
          <Link href="/inventory/transfers" className="mt-3 inline-block text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
            Transfer workflows →
          </Link>
        </div>
      </div>

      <EnterpriseDataGrid<DaoOversightRow>
        title="DAO oversight queue"
        rows={daoRows}
        columns={daoCols}
        filename="dao-oversight.csv"
        pageSize={15}
      />
    </MinistryPageShell>
  );
}
