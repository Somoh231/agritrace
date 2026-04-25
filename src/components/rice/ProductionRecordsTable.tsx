"use client";

import * as React from "react";

import DataTable from "@/components/shared/DataTable";
import Drawer from "@/components/shared/Drawer";
import StatusPill from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/shared/Skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatLossRate } from "@/lib/utils/formatters";
import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";
import { seasonLabel, safePct } from "@/lib/utils/rice";

type Row = {
  id: string;
  farmer_id: string;
  farmer_name: string;
  county: string;
  plot_area_ha: number | null;
  expected_kg: number;
  actual_kg: number;
  destination: string | null;
  recorded_at: string;
};

export default function ProductionRecordsTable() {
  const [county, setCounty] = React.useState<string>("");
  const [season, setSeason] = React.useState<string>(seasonLabel());
  const [rows, setRows] = React.useState<Row[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selected, setSelected] = React.useState<Row | null>(null);
  const [isNewOpen, setIsNewOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let q = supabase
        .from("rice_production_records")
        .select(
          "id, farmer_id, season, expected_yield_kg, actual_yield_kg, market_destination, county, recorded_at, farmers(full_name)",
        )
        .eq("season", season)
        .order("recorded_at", { ascending: false })
        .limit(200);

      if (county) q = q.eq("county", county);

      const { data } = await q;
      const mapped: Row[] =
        data?.map((r: any) => ({
          id: r.id,
          farmer_id: r.farmer_id,
          farmer_name: r.farmers?.full_name ?? "—",
          county: r.county ?? "—",
          plot_area_ha: null,
          expected_kg: Number(r.expected_yield_kg ?? 0),
          actual_kg: Number(r.actual_yield_kg ?? 0),
          destination: r.market_destination ?? null,
          recorded_at: r.recorded_at ?? new Date().toISOString(),
        })) ?? [];

      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [county, season]);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: "farmer_id",
      label: "Farmer ID",
      width: "110px",
      render: (v: unknown) => (
        <span className="font-mono text-[11px] text-blue-700">{String(v ?? "")}</span>
      ),
    },
    { key: "farmer_name", label: "Name", width: "140px" },
    { key: "county", label: "County", width: "90px" },
    {
      key: "plot_area_ha",
      label: "Plot (ha)",
      width: "70px",
      render: (v: unknown) => (v == null ? "—" : String(v)),
    },
    {
      key: "expected_kg",
      label: "Expected (kg)",
      width: "95px",
      render: (v: unknown) => Intl.NumberFormat("en-US").format(Number(v ?? 0)),
    },
    {
      key: "actual_kg",
      label: "Actual (kg)",
      width: "95px",
      render: (v: unknown) => Intl.NumberFormat("en-US").format(Number(v ?? 0)),
    },
    {
      key: "loss_pct",
      label: "Loss %",
      width: "70px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const expected = Number(row.expected_kg ?? 0);
        const actual = Number(row.actual_kg ?? 0);
        const pct = expected > 0 ? safePct(expected - actual, expected) : 0;
        const cls = pct < 5 ? "text-green-700" : pct <= 10 ? "text-amber-700" : "text-red-700";
        return <span className={`font-mono ${cls}`}>{formatLossRate(expected, actual)}</span>;
      },
    },
    { key: "destination", label: "Destination", width: "120px", render: (v: unknown) => String(v ?? "—") },
    {
      key: "status",
      label: "Status",
      width: "90px",
      render: () => <StatusPill status="info" label="Recorded" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
            <div>
              <div className="font-display text-[16px] text-gray-900">Production records</div>
              <div className="text-[12px] text-gray-500">Filter and review production entries.</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                  County
                </div>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">All</option>
                  {LIBERIA_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                  Season
                </div>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value={seasonLabel(new Date())}>{seasonLabel(new Date())}</option>
                  <option value={seasonLabel(new Date(Date.now() - 183 * 86400000))}>
                    {seasonLabel(new Date(Date.now() - 183 * 86400000))}
                  </option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOpen(true)}
                className="h-9 self-end px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
              >
                + New record
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ))}
          </div>
        ) : (
        <DataTable
          columns={columns}
          data={isLoading ? [] : (rows as any)}
          emptyMessage={isLoading ? "Loading…" : "No records for this filter."}
          onRowClick={(r) => setSelected(r as unknown as Row)}
        />
        )}
      </div>

      <div className="space-y-4">
        <Drawer
          title={selected ? "Record details" : "Details"}
          isOpen={Boolean(selected)}
          onClose={() => setSelected(null)}
        >
          {selected ? (
            <div className="space-y-2 text-[12px] text-gray-700">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  Farmer
                </div>
                <div className="mt-1 font-medium text-gray-900">{selected.farmer_name}</div>
                <div className="font-mono text-[11px] text-blue-700">{selected.farmer_id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    Expected
                  </div>
                  <div className="mt-1">{Intl.NumberFormat("en-US").format(selected.expected_kg)} kg</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    Actual
                  </div>
                  <div className="mt-1">{Intl.NumberFormat("en-US").format(selected.actual_kg)} kg</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">Select a row to view details.</div>
          )}
        </Drawer>

        <Drawer title="New record" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
          <div className="text-[12px] text-gray-600">
            Form entry UI is implemented in Phase 2, but inserts will be enabled after we
            finalize role policies and joins (Phase 4 QA). For now, use Supabase table editor
            or the seed script.
          </div>
        </Drawer>
      </div>
    </div>
  );
}

