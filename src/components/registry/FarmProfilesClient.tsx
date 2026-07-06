"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  MapPin,
  Search,
  Sprout,
  Users,
  Warehouse,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  EmptyState,
  KpiCard,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import FarmerRegistryPreview from "@/components/registry/FarmerRegistryPreview";
import { verificationStatusTone } from "@/components/registry/registry-utils";
import {
  farmerRegistrySample,
  fieldReports,
  type FarmerRegistryDemoRow,
} from "@/lib/demo/agriculture-pilot-data";

function completenessScore(row: FarmerRegistryDemoRow): number {
  let score = 0;
  if (row.fullName) score += 15;
  if (row.county && row.district) score += 15;
  if (row.cooperative) score += 10;
  if (row.gpsStatus === "verified") score += 20;
  else if (row.gpsStatus === "pending") score += 10;
  if (row.verification === "verified") score += 20;
  if (row.primaryWarehouseCode) score += 10;
  if (row.daoOfficerCode) score += 10;
  return Math.min(100, score);
}

function completenessTone(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 80) return "success";
  if (score >= 55) return "warning";
  return "danger";
}

export default function FarmProfilesClient() {
  const [search, setSearch] = React.useState("");
  const [countyFilter, setCountyFilter] = React.useState("");
  const [preview, setPreview] = React.useState<FarmerRegistryDemoRow | null>(null);

  const counties = React.useMemo(
    () => [...new Set(farmerRegistrySample.map((r) => r.county))].sort(),
    [],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return farmerRegistrySample.filter((r) => {
      if (countyFilter && r.county !== countyFilter) return false;
      if (!needle) return true;
      return [r.fullName, r.id, r.registryPublicId, r.cooperative, r.district].some((v) =>
        String(v ?? "").toLowerCase().includes(needle),
      );
    });
  }, [search, countyFilter]);

  const stats = React.useMemo(() => {
    const total = farmerRegistrySample.length;
    const verified = farmerRegistrySample.filter((r) => r.verification === "verified").length;
    const gpsReady = farmerRegistrySample.filter((r) => r.gpsStatus === "verified").length;
    const avgCompleteness = Math.round(
      farmerRegistrySample.reduce((s, r) => s + completenessScore(r), 0) / Math.max(1, total),
    );
    return { total, verified, gpsReady, avgCompleteness };
  }, []);

  const columns = React.useMemo<GridColumn<FarmerRegistryDemoRow>[]>(
    () => [
      {
        key: "id",
        header: "Registry ID",
        render: (r) => (
          <span className="font-mono text-[11px] text-forest-700">{r.registryPublicId ?? r.id}</span>
        ),
      },
      { key: "fullName", header: "Farmer" },
      { key: "county", header: "County" },
      { key: "district", header: "District" },
      { key: "cooperative", header: "Cooperative" },
      {
        key: "verification",
        header: "Verification",
        render: (r) => (
          <StatusBadge tone={verificationStatusTone(r.verification)}>{r.verification}</StatusBadge>
        ),
      },
      {
        key: "gps",
        header: "Plot / GPS",
        render: (r) => (
          <StatusBadge tone={r.gpsStatus === "verified" ? "success" : r.gpsStatus === "pending" ? "warning" : "neutral"}>
            {r.gpsStatus}
          </StatusBadge>
        ),
      },
      {
        key: "completeness",
        header: "Completeness",
        render: (r) => {
          const score = completenessScore(r);
          return <StatusBadge tone={completenessTone(score)}>{score}%</StatusBadge>;
        },
      },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <button
            type="button"
            onClick={() => setPreview(r)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Open profile
          </button>
        ),
      },
    ],
    [],
  );

  const activityItems = fieldReports.slice(0, 5).map((r) => ({
    id: r.id,
    title: r.summary,
    meta: `${r.officer} · ${r.county} · ${r.channel.replace("_", " ")}`,
    time: r.submittedAt.slice(0, 16).replace("T", " "),
    tone: r.channel === "offline" ? ("warning" as const) : ("default" as const),
  }));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Farmer intelligence · National registry"
        title="Farm profiles"
        description="Farmer-scale dossiers with plot topology, cooperative linkage, inspection chronology, subsidy routing, and data completeness — anchored to ministry registry identifiers (e.g. NIM-0001, BON-0007)."
        actions={
          <Link href="/farmers" className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[13px] font-semibold">
            Open full registry
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Registry rows" value={String(stats.total)} hint="Pilot sample cohort" />
        <KpiCard label="Verified farmers" value={String(stats.verified)} hint="DAO / CAC cleared" deltaTone="up" />
        <KpiCard label="GPS-ready plots" value={String(stats.gpsReady)} hint="Boundary captured" />
        <KpiCard label="Avg. completeness" value={`${stats.avgCompleteness}%`} hint="Profile data quality" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/farmers"
          icon={Users}
          title="National farmer registry"
          description="Searchable master grid with verification, cooperative linkage, DAO assignment, and warehouse routing."
        />
        <QuickActionCard
          href="/geo-registry"
          icon={MapPin}
          title="Geo registry"
          description="Parcel captures, GPS QA, plot boundaries, and raster overlays for field verification."
        />
        <QuickActionCard
          href="/cooperatives"
          icon={Sprout}
          title="Cooperatives"
          description="Membership spine, cooperative registration numbers, and cluster linkage for farm groups."
        />
        <QuickActionCard
          href="/operations/warehouses"
          icon={Warehouse}
          title="Warehouse command"
          description="Subsidy and input routing — link farmers to primary warehouse hubs and stock corridors."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel className="lg:col-span-2" padding="none">
          <div className="border-b border-slate-100 px-5 py-4">
            <SectionHeader
              title="Farm profile lookup"
              subtitle={`${filtered.length} farmers in scope`}
              action={
                <Link href="/farmers" className="text-[13px] font-medium text-forest-700">
                  Full registry →
                </Link>
              }
            />
          </div>

          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="fp-search" className="ent-label">
                Search by name, ID, cooperative
              </label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="fp-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. James Toe, F-10492, Nimba Highlands"
                  className="av-input pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-44">
              <label htmlFor="fp-county" className="ent-label">
                County
              </label>
              <select
                id="fp-county"
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="av-input mt-1.5"
              >
                <option value="">All counties</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No farmers match"
                description="Adjust search or county filter, or register a new farmer from the national registry."
                action={
                  <Link href="/farmers" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                    Go to registry
                  </Link>
                }
              />
            </div>
          ) : (
            <EnterpriseDataGrid rows={filtered} columns={columns} filename="farm-profiles.csv" dense theme="light" pageSize={10} />
          )}
        </DashboardPanel>

        <div className="space-y-4">
          <DashboardPanel>
            <SectionHeader title="Data completeness" subtitle="Pilot cohort average" />
            <div className="mt-4 space-y-3">
              {["Identity & contact", "Location (county/district/village)", "Cooperative linkage", "Plot / GPS boundary", "DAO & warehouse routing"].map(
                (label, i) => {
                  const pct = [92, 85, 78, stats.gpsReady * 20, 65][i];
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-slate-700">{label}</span>
                        <span className="font-mono text-slate-500">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-forest-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader title="Recent field activity" subtitle="Inspections & reports" />
            <div className="mt-4">
              {activityItems.length ? (
                <Timeline items={activityItems} />
              ) : (
                <p className="text-[13px] text-slate-600">No recent activity logged.</p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>

      <AlertCard tone="info" title="Registry intelligence posture">
        Farm profiles aggregate national registry rows with plot topology, subsidy utilization, and inspection chronologies.
        Use the full registry for DAO verification workflows; this hub surfaces completeness and routing signals for county officers.
      </AlertCard>

      {preview ? (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/30">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl">
            <FarmerRegistryPreview row={preview} onClose={() => setPreview(null)} />
            <div className="mt-4 flex gap-2">
              <Link
                href="/farmers"
                className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[13px] font-semibold"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                Open in registry
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
