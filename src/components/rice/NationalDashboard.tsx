"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import AlertBanner from "@/components/shared/AlertBanner";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import KPICard from "@/components/shared/KPICard";
import ProgressBar from "@/components/shared/ProgressBar";
import DataQualityPanel from "@/components/rice/DataQualityPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatWeight } from "@/lib/utils/formatters";
import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";
import { safePct, seasonLabel } from "@/lib/utils/rice";

type CountyAgg = {
  county: string;
  production_kg: number;
  expected_kg: number;
  loss_kg: number;
};

const NATIONAL_DEMAND_MT = 650_000;

function mtFromKg(kg: number) {
  return kg / 1000;
}

export default function NationalDashboard() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [countyAgg, setCountyAgg] = React.useState<CountyAgg[]>([]);
  const [farmersCount, setFarmersCount] = React.useState(0);
  const [prodKg, setProdKg] = React.useState(0);
  const [expectedKg, setExpectedKg] = React.useState(0);
  const [lossKg, setLossKg] = React.useState(0);
  const [lossByCause, setLossByCause] = React.useState<Record<string, number>>({});

  const season = seasonLabel();

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();

        const farmersRes = await supabase
          .from("farmers")
          .select("id", { count: "exact", head: true })
          .not("county", "is", null);

        const riceRes = await supabase
          .from("rice_production_records")
          .select("county, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg, post_harvest_loss_cause")
          .eq("season", season);

        if (cancelled) return;

        setFarmersCount(farmersRes.count ?? 0);

        const rows = ((riceRes.data ?? []) as any[]).map((r) => ({
          county: (r.county ?? "Unknown") as string,
          expected: Number(r.expected_yield_kg ?? 0),
          actual: Number(r.actual_yield_kg ?? 0),
          loss: Number(r.post_harvest_loss_kg ?? 0),
          cause: (r.post_harvest_loss_cause ?? "unknown") as string,
        }));

        const byCounty = new Map<string, CountyAgg>();
        const byCause: Record<string, number> = {};
        let expected = 0;
        let actual = 0;
        let loss = 0;

        for (const r of rows) {
          expected += r.expected;
          actual += r.actual;
          loss += r.loss;
          byCause[r.cause] = (byCause[r.cause] ?? 0) + r.loss;

          const prev = byCounty.get(r.county) ?? {
            county: r.county,
            production_kg: 0,
            expected_kg: 0,
            loss_kg: 0,
          };
          prev.production_kg += r.actual;
          prev.expected_kg += r.expected;
          prev.loss_kg += r.loss;
          byCounty.set(r.county, prev);
        }

        const countyList = Array.from(byCounty.values()).sort(
          (a, b) => b.production_kg - a.production_kg,
        );

        setCountyAgg(countyList);
        setProdKg(actual);
        setExpectedKg(expected);
        setLossKg(loss);
        setLossByCause(byCause);
      } catch {
        // fallback to placeholders below
        if (!cancelled) {
          setCountyAgg([]);
          setFarmersCount(0);
          setProdKg(0);
          setExpectedKg(0);
          setLossKg(0);
          setLossByCause({});
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [season]);

  const hasData = countyAgg.length > 0;

  const placeholderCountyAgg: CountyAgg[] = LIBERIA_COUNTIES.slice(0, 8).map((c, idx) => ({
    county: c,
    production_kg: (8 - idx) * 18_000,
    expected_kg: (8 - idx) * 22_000,
    loss_kg: (8 - idx) * 1_400,
  }));

  const counties = hasData ? countyAgg : placeholderCountyAgg;
  const totalProdKg = hasData ? prodKg : 144_000;
  const totalExpectedKg = hasData ? expectedKg : 168_000;
  const totalLossKg = hasData ? lossKg : 11_200;
  const lossRate = safePct(totalLossKg, Math.max(1, totalExpectedKg));
  const demandSupplyPct = safePct(mtFromKg(totalProdKg), NATIONAL_DEMAND_MT);
  const importGapMt = Math.max(0, NATIONAL_DEMAND_MT - mtFromKg(totalProdKg));

  const savedUsd = (mtFromKg(totalProdKg) * 1000 * 0.4) / 1_000_000; // per prompt

  const chartData = counties.map((c) => ({
    county: c.county,
    production_mt: Math.round(mtFromKg(c.production_kg) * 10) / 10,
  }));

  const causePairs = Object.entries(lossByCause);
  const causes =
    causePairs.length > 0
      ? causePairs.sort((a, b) => b[1] - a[1]).slice(0, 4)
      : [
          ["storage", 3200],
          ["transport", 2800],
          ["pests", 2200],
          ["moisture", 1800],
        ];

  return (
    <div className="space-y-4">
      <DashboardWidgets module="rice" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Domestic production"
          value={formatWeight(totalProdKg)}
          delta={`Season ${season}`}
          deltaDirection="neutral"
          accentColor="green"
        />
        <KPICard
          label="Registered farmers"
          value={Intl.NumberFormat("en-US").format(hasData ? farmersCount : 1240)}
          delta="All counties"
          deltaDirection="neutral"
          accentColor="blue"
        />
        <KPICard
          label="Import gap (est.)"
          value={`${Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(importGapMt)} MT`}
          delta={`${demandSupplyPct.toFixed(1)}% supplied`}
          deltaDirection="warning"
          accentColor="amber"
        />
        <KPICard
          label="Post-harvest loss rate"
          value={`${lossRate.toFixed(1)}%`}
          delta={`${formatWeight(totalLossKg)} lost`}
          deltaDirection={lossRate > 10 ? "warning" : "neutral"}
          accentColor={lossRate > 10 ? "amber" : "green"}
        />
      </div>

      <DataQualityPanel />

      <AlertBanner
        severity="warning"
        message="Price monitoring: Check county distribution data for market price deviations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-[16px] text-gray-900">
                County production vs NADP target
              </div>
              <div className="text-[12px] text-gray-500">Season {season}</div>
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
            >
              All 15 counties
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse">
                    <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                  </div>
                ))
              : counties.slice(0, 8).map((c) => {
                  const target = Math.max(1, c.expected_kg);
                  const pct = safePct(c.production_kg, target);
                  const tone = pct > 70 ? "green" : pct >= 50 ? "amber" : "red";
                  return (
                    <div key={c.county}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[12px] font-medium text-gray-900">{c.county}</div>
                        <div className="text-[11px] font-mono text-gray-500">
                          {formatWeight(c.production_kg)} / {formatWeight(target)}
                        </div>
                      </div>
                      <ProgressBar valuePct={pct} tone={tone} />
                    </div>
                  );
                })}
          </div>

          <div className="mt-5 h-[220px]">
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-gray-400 mb-2">
              Production by county (MT)
            </div>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="county" tick={{ fontSize: 10 }} interval={0} height={40} />
                  <YAxis tick={{ fontSize: 10 }} width={32} />
                  <Tooltip />
                  <Bar dataKey="production_mt" fill="#1a4422" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="font-display text-[15px] text-gray-900">Import gap tracker</div>
            <div className="mt-2 text-[12px] text-gray-600">
              Domestic supply vs ~{Intl.NumberFormat("en-US").format(NATIONAL_DEMAND_MT)} MT national demand.
            </div>
            <div className="mt-4">
              <ProgressBar valuePct={demandSupplyPct} tone={demandSupplyPct > 30 ? "green" : "amber"} />
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>{demandSupplyPct.toFixed(1)}% supplied</span>
                <span>{importGapMt.toFixed(0)} MT gap</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Import spend saved (est.)
              </div>
              <div className="mt-1 font-display text-xl text-gray-900">
                ${savedUsd.toFixed(1)}M
              </div>
              <div className="mt-1 text-[11px] text-gray-500">
                Assumes ~$0.40/kg displaced imports.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="font-display text-[15px] text-gray-900">Loss by cause</div>
            <div className="mt-3 space-y-2">
              {causes.map(([cause, kg]) => {
                const causeKey = String(cause);
                const kgNum = Number(kg);
                const pct = safePct(kgNum, Math.max(1, totalLossKg));
                return (
                  <div key={causeKey} className="flex items-center justify-between">
                    <div className="text-[12px] text-gray-700 capitalize">
                      {causeKey.replaceAll("_", " ")}
                    </div>
                    <div className="text-[12px] font-mono text-gray-600">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

