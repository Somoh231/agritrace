"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordWarehouseForm from "@/components/operations/forms/RecordWarehouseForm";
import { RegistryFilterBar, RegistryKpiStrip } from "@/components/registry";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function utilizationTone(pct: number | null): "success" | "warning" | "danger" | "neutral" {
  if (pct == null) return "neutral";
  if (pct >= 92) return "danger";
  if (pct >= 80) return "warning";
  return "success";
}

export default function WarehousesOperationsWorkspace() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [countyFilter, setCountyFilter] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: qErr } = await supabase
        .from("warehouses")
        .select("id,name,county,latitude,longitude,low_stock_threshold_pct,ministry_code,utilization_pct,created_at")
        .limit(200);
      if (qErr) throw qErr;
      setRows((data ?? []) as Record<string, unknown>[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load warehouses");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, tick]);

  React.useEffect(() => {
    const h = () => setCreateOpen(true);
    window.addEventListener("agritrace-primary-action", h);
    return () => window.removeEventListener("agritrace-primary-action", h);
  }, []);

  const counties = React.useMemo(
    () => [...new Set(rows.map((r) => String(r.county ?? "")).filter(Boolean))].sort(),
    [rows],
  );

  const filteredRows = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (countyFilter && String(r.county ?? "") !== countyFilter) return false;
      if (!needle) return true;
      return [r.name, r.county, r.ministry_code].some((v) => String(v ?? "").toLowerCase().includes(needle));
    });
  }, [rows, search, countyFilter]);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const counties = new Set(rows.map((r) => String(r.county ?? "")).filter(Boolean)).size;
    const highUtil = rows.filter((r) => Number(r.utilization_pct ?? 0) >= 90).length;
    return { total, counties, highUtil };
  }, [rows]);

  const columns = React.useMemo<GridColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: "ministry_code",
        header: "Code",
        render: (r) => {
          const code = String(r.ministry_code ?? "");
          return code ? (
            <Link href={`/inventory/warehouse/${encodeURIComponent(code)}`} className="font-mono text-[11px] font-medium text-forest-700 hover:underline">
              {code}
            </Link>
          ) : (
            <span className="text-slate-400">—</span>
          );
        },
      },
      { key: "name", header: "Warehouse" },
      { key: "county", header: "County" },
      {
        key: "utilization_pct",
        header: "Utilization",
        render: (r) => {
          const pct = r.utilization_pct != null ? Number(r.utilization_pct) : null;
          return pct != null ? <StatusBadge tone={utilizationTone(pct)}>{pct}%</StatusBadge> : <span>—</span>;
        },
      },
      { key: "low_stock_threshold_pct", header: "Low-stock %" },
      {
        key: "created_at",
        header: "Created",
        render: (r) => String(r.created_at ?? "—").slice(0, 10),
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const code = String(r.ministry_code ?? "");
          if (!code) return <span className="text-slate-400">—</span>;
          return (
            <Link href={`/inventory/warehouse/${encodeURIComponent(code)}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
              Open hub
            </Link>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="National logistics · Warehouse registry"
        title="Warehouse operations"
        description="National warehouse footprint, utilization thresholds, geo anchors, and hub command profiles for routing and compliance."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[13px] font-semibold">
            <Plus className="h-4 w-4" aria-hidden />
            Create warehouse
          </button>
        }
      />

      {error ? (
        <AlertCard tone="danger" title="Warehouse registry unavailable" action={
          <button type="button" onClick={() => void load()} className="rounded-lg btn-gov-outline px-3 py-1.5 text-[12px]">Retry</button>
        }>
          {error}
        </AlertCard>
      ) : null}

      <RegistryKpiStrip
        items={[
          { label: "Total warehouses", value: String(stats.total), hint: "Registered hubs" },
          { label: "County coverage", value: String(stats.counties), hint: "Counties with hubs" },
          { label: "High utilization", value: String(stats.highUtil), hint: "≥ 90% capacity", deltaTone: stats.highUtil ? "down" : "up" },
          { label: "In view", value: String(filteredRows.length), hint: "Filtered rows" },
        ]}
      />

      <RegistryFilterBar
        search={search}
        onSearchChange={setSearch}
        county={countyFilter}
        onCountyChange={setCountyFilter}
        counties={counties}
        status=""
        onStatusChange={() => {}}
        statusOptions={[]}
        showStatusFilter={false}
      />

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader title="National warehouse register" subtitle={`${filteredRows.length} hubs in scope`} action={
            <button type="button" onClick={() => void load()} className="text-[13px] font-medium text-forest-700">Refresh →</button>
          } />
        </div>

        {loading ? (
          <div className="p-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No warehouses in scope"
              description="Adjust filters or create a new warehouse hub for the national network."
              action={
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                  Create warehouse
                </button>
              }
            />
          </div>
        ) : (
          <EnterpriseDataGrid rows={filteredRows} columns={columns} filename="warehouses.csv" dense theme="light" pageSize={25} />
        )}
      </DashboardPanel>

      <OperationDrawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create warehouse">
        <RecordWarehouseForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            setTick((t) => t + 1);
          }}
        />
      </OperationDrawer>
    </div>
  );
}
