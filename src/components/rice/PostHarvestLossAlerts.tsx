"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import DataTable from "@/components/shared/DataTable";
import StatusPill from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/shared/Skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatLossRate, formatWeight } from "@/lib/utils/formatters";
import { safePct, seasonLabel } from "@/lib/utils/rice";

type Incident = {
  id: string;
  county: string;
  expected: number;
  actual: number;
  loss: number;
  cause: string;
};

export default function PostHarvestLossAlerts() {
  const [tab, setTab] = React.useState<"active" | "resolved" | "all">("active");
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const season = seasonLabel();

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("rice_production_records")
          .select("id, county, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg, post_harvest_loss_cause")
          .eq("season", season)
          .limit(200);

        if (cancelled) return;
        const rows: Incident[] =
          data?.map((r: any) => ({
            id: r.id,
            county: r.county ?? "—",
            expected: Number(r.expected_yield_kg ?? 0),
            actual: Number(r.actual_yield_kg ?? 0),
            loss: Number(r.post_harvest_loss_kg ?? 0),
            cause: r.post_harvest_loss_cause ?? "unknown",
          })) ?? [];

        const filtered = rows.filter((r) => safePct(r.loss, Math.max(1, r.expected)) > 10);
        setIncidents(filtered);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [season]);

  const severe = incidents.filter((i) => safePct(i.loss, Math.max(1, i.expected)) > 15);

  const active = incidents;
  const resolved: Incident[] = []; // MVP placeholder until we add resolution state table
  const all = incidents;

  const shown = tab === "active" ? active : tab === "resolved" ? resolved : all;

  const totals = shown.reduce(
    (acc, r) => {
      acc.expected += r.expected;
      acc.actual += r.actual;
      acc.loss += r.loss;
      return acc;
    },
    { expected: 0, actual: 0, loss: 0 },
  );

  const columns = [
    {
      key: "id",
      label: "Facility ID",
      width: "140px",
      render: (v: unknown) => <span className="font-mono text-[11px]">{String(v ?? "")}</span>,
    },
    { key: "county", label: "County", width: "90px" },
    { key: "cause", label: "Cause", width: "140px", render: (v: unknown) => String(v ?? "") },
    {
      key: "loss_rate",
      label: "Loss %",
      width: "80px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const expected = Number(row.expected ?? 0);
        const actual = Number(row.actual ?? 0);
        const pct = expected > 0 ? safePct(expected - actual, expected) : 0;
        const s = pct > 15 ? "error" : "warning";
        return <StatusPill status={s} label={formatLossRate(expected, actual)} showDot={false} />;
      },
    },
    {
      key: "loss",
      label: "Loss (kg)",
      width: "90px",
      render: (v: unknown) => <span className="font-mono">{Intl.NumberFormat("en-US").format(Number(v ?? 0))}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      <div className="space-y-3">
        {severe.length ? (
          <AlertBanner
            severity="danger"
            message={`${severe.length} storage facilities reporting loss rates above 15% threshold.`}
          />
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-[16px] text-gray-900">Loss incidents</div>
              <div className="text-[12px] text-gray-500">Season {season}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`h-8 px-3 rounded-md text-[12px] border ${
                  tab === "active" ? "bg-forest-50 border-forest-100 text-forest-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Active flags
              </button>
              <button
                type="button"
                onClick={() => setTab("resolved")}
                className={`h-8 px-3 rounded-md text-[12px] border ${
                  tab === "resolved" ? "bg-forest-50 border-forest-100 text-forest-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={() => setTab("all")}
                className={`h-8 px-3 rounded-md text-[12px] border ${
                  tab === "all" ? "bg-forest-50 border-forest-100 text-forest-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                All incidents
              </button>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={isLoading ? [] : (shown as any)}
          emptyMessage={isLoading ? "Loading…" : "No incidents above threshold."}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-display text-[15px] text-gray-900">Season loss summary</div>
          <div className="mt-3 space-y-2 text-[12px] text-gray-700">
            <div className="flex items-center justify-between">
              <span>Total volume tracked</span>
              <span className="font-mono">{formatWeight(totals.expected)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Volume lost</span>
              <span className="font-mono">{formatWeight(totals.loss)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Average loss rate</span>
              <span className="font-mono">{formatLossRate(totals.expected, totals.actual)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>NADP loss target</span>
              <span className="font-mono">≤7.0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Variance vs target</span>
              <span className="font-mono">
                {Math.max(0, safePct(totals.loss, Math.max(1, totals.expected)) - 7).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Est. value lost (USD)</span>
              <span className="font-mono">
                ${(totals.loss * 0.2).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-display text-[15px] text-gray-900">Field agent coverage</div>
          <div className="mt-2 text-[12px] text-gray-600">
            Agent sync telemetry will be wired once we add <span className="font-mono">last_seen</span>.
          </div>
          <div className="mt-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1 w-2/3">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : null}
            {[
              { name: "Agent A", county: "Nimba", status: "Active", pill: "ok" as const },
              { name: "Agent B", county: "Bong", status: "Delayed", pill: "warning" as const },
              { name: "Agent C", county: "Lofa", status: "No signal", pill: "error" as const },
            ].map((a) => (
              <div key={a.name} className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium text-gray-900">{a.name}</div>
                  <div className="text-[11px] text-gray-500">{a.county}</div>
                </div>
                <StatusPill status={a.pill} label={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

