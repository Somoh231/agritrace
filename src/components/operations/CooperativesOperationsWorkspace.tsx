"use client";

import * as React from "react";
import { Building2, Plus } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  EmptyState,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordCooperativeForm from "@/components/operations/forms/RecordCooperativeForm";
import {
  CooperativeDetailPanel,
  RegistryFilterBar,
  RegistryKpiStrip,
} from "@/components/registry";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const nf = (n: number) => Intl.NumberFormat().format(n);

function CooperativeRowActions({
  row,
  onView,
}: {
  row: Record<string, unknown>;
  onView: (row: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onView(row)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
      >
        View record
      </button>
    </div>
  );
}

export default function CooperativesOperationsWorkspace() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Record<string, unknown> | null>(null);
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
        .from("organizations")
        .select("id,name,type,county,country,license_number,created_at")
        .eq("type", "cooperative")
        .limit(200);
      if (qErr) throw qErr;
      setRows((data ?? []) as Record<string, unknown>[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cooperatives");
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
      return [r.name, r.county, r.license_number, r.country]
        .some((v) => String(v ?? "").toLowerCase().includes(needle));
    });
  }, [rows, search, countyFilter]);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const licensed = rows.filter((r) => r.license_number != null && String(r.license_number).trim()).length;
    const countyCoverage = new Set(rows.map((r) => String(r.county ?? "")).filter(Boolean)).size;
    return { total, licensed, countyCoverage };
  }, [rows]);

  const columns = React.useMemo<GridColumn<Record<string, unknown>>[]>(
    () => [
      { key: "name", header: "Cooperative" },
      {
        key: "type",
        header: "Type",
        render: (r) => <StatusBadge tone="info">{String(r.type ?? "cooperative")}</StatusBadge>,
      },
      { key: "county", header: "County" },
      { key: "country", header: "Country" },
      {
        key: "license_number",
        header: "License",
        render: (r) =>
          r.license_number ? (
            <StatusBadge tone="success">{String(r.license_number)}</StatusBadge>
          ) : (
            <StatusBadge tone="warning">Pending</StatusBadge>
          ),
      },
      {
        key: "created_at",
        header: "Registered",
        render: (r) => String(r.created_at ?? "—").slice(0, 10),
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) => <CooperativeRowActions row={r} onView={setDetailRow} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Institutional registry · Farmer organizations"
        title="Cooperative registry"
        description="Registered farmer organizations and cooperative legal entities. New records append to organizations with audit log entries on create."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[13px] font-semibold">
            <Plus className="h-4 w-4" aria-hidden />
            Add cooperative
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard
          href="/farmers"
          icon={Building2}
          title="Farmer registry"
          description="View enrolled farmers linked to cooperative programmes and subsidy eligibility."
        />
        <QuickActionCard
          icon={Plus}
          title="Register cooperative"
          description="Add a new cooperative legal entity with county assignment and optional license."
          onClick={() => setCreateOpen(true)}
        />
        <QuickActionCard
          href="/compliance/audit-log"
          icon={Building2}
          title="Audit trail"
          description="Review cooperative creation events and institutional change history."
        />
      </div>

      {error ? (
        <AlertCard tone="danger" title="Registry unavailable" action={
          <button type="button" onClick={() => void load()} className="rounded-lg btn-gov-outline px-3 py-1.5 text-[12px]">
            Retry
          </button>
        }>
          {error}. This may indicate role-based redaction (RLS) or an unseeded organizations table.
        </AlertCard>
      ) : null}

      <RegistryKpiStrip
        items={[
          { label: "Total cooperatives", value: nf(stats.total), hint: "Registered legal entities" },
          { label: "Active licenses", value: nf(stats.licensed), hint: "License number on file", deltaTone: "up" },
          { label: "County coverage", value: nf(stats.countyCoverage), hint: "Counties with cooperatives" },
          {
            label: "In current view",
            value: nf(filteredRows.length),
            hint: "Rows matching filters",
          },
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
          <SectionHeader
            kicker="Master register"
            title="Cooperative organizations"
            subtitle={`${nf(filteredRows.length)} records in current filter scope`}
            action={
              <button type="button" onClick={() => void load()} className="text-[13px] font-medium text-forest-700 hover:text-forest-600">
                Refresh registry →
              </button>
            }
          />
        </div>

        {loading ? (
          <div className="p-8">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No cooperatives in scope"
              description="Adjust search or county filters, or register the first cooperative for this workspace."
              action={
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                  Add cooperative
                </button>
              }
            />
          </div>
        ) : (
          <EnterpriseDataGrid
            rows={filteredRows}
            columns={columns}
            filename="cooperatives.csv"
            dense
            theme="light"
            pageSize={25}
            onRowClick={setDetailRow}
            emptyLabel="No cooperatives match the current filters."
          />
        )}
      </DashboardPanel>

      <OperationDrawer open={createOpen} onClose={() => setCreateOpen(false)} title="Register cooperative">
        <RecordCooperativeForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            setTick((t) => t + 1);
          }}
        />
      </OperationDrawer>

      <OperationDrawer
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title="Cooperative record"
        subtitle="Read-only institutional registry detail."
        widthClassName="max-w-xl"
      >
        {detailRow ? <CooperativeDetailPanel row={detailRow} onClose={() => setDetailRow(null)} /> : null}
      </OperationDrawer>
    </div>
  );
}
