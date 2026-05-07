"use client";

import * as React from "react";

import { countyProductionPerformance, nationalHeroMetrics, type CountyProductionRow } from "@/lib/demo/agriculture-pilot-data";
import {
  countyMetricToProductionRow,
  countyMetricsFallbackRows,
} from "@/lib/data/ministry-data-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safePct, seasonLabel } from "@/lib/utils/rice";

export type NationalAISLive = {
  season: string;
  usingFallbackSignals: boolean;
  farmersCount: number;
  productionMt: number;
  targetMt: number;
  lossRatePct: number;
  countiesRanked: CountyProductionRow[];
};

export function useNationalAISLive(): NationalAISLive {
  const season = seasonLabel();
  const [state, setState] = React.useState<NationalAISLive>(() => ({
    season,
    usingFallbackSignals: true,
    farmersCount: nationalHeroMetrics.registeredFarmers,
    productionMt: nationalHeroMetrics.domesticRiceProductionMt,
    targetMt: nationalHeroMetrics.nationalProductionTargetMt,
    lossRatePct: nationalHeroMetrics.postHarvestLossRatePct,
    countiesRanked: countyProductionPerformance,
  }));

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const farmersRes = await supabase
          .from("farmers")
          .select("id", { count: "exact", head: true })
          .not("county", "is", null);

        const riceRes = await supabase
          .from("rice_production_records")
          .select("county, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg")
          .eq("season", season);

        if (cancelled) return;

        const fc = farmersRes.error ? 0 : farmersRes.count ?? 0;
        const rows = ((riceRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
          county: String(r.county ?? "Unknown"),
          expected: Number(r.expected_yield_kg ?? 0),
          actual: Number(r.actual_yield_kg ?? 0),
          loss: Number(r.post_harvest_loss_kg ?? 0),
        }));

        const { data: pilotMetricRows, error: pilotMetricErr } = await supabase
          .from("pilot_county_metrics")
          .select("county,production_index,food_risk,dao_compliance")
          .order("production_index", { ascending: false });

        const pilotCountyLive =
          !pilotMetricErr && pilotMetricRows?.length
            ? (pilotMetricRows as Record<string, unknown>[]).map((r) =>
                countyMetricToProductionRow(
                  {
                    county: String(r.county ?? ""),
                    productionIndex: Number(r.production_index ?? 0),
                    foodRisk: String(r.food_risk ?? "Low"),
                    daoCompliance: Number(r.dao_compliance ?? 70),
                    lng: 0,
                    lat: 0,
                  },
                  0,
                ),
              )
            : null;

        const useFullDemoFallback = fc === 0 && rows.length === 0 && !pilotCountyLive?.length;
        if (useFullDemoFallback) {
          setState({
            season,
            usingFallbackSignals: true,
            farmersCount: nationalHeroMetrics.registeredFarmers,
            productionMt: nationalHeroMetrics.domesticRiceProductionMt,
            targetMt: nationalHeroMetrics.nationalProductionTargetMt,
            lossRatePct: nationalHeroMetrics.postHarvestLossRatePct,
            countiesRanked: countyProductionPerformance,
          });
          return;
        }

        if (rows.length === 0 && pilotCountyLive?.length) {
          const merged = pilotCountyLive.map((r) => ({ ...r }));
          const prodSum = merged.reduce((s, r) => s + r.productionMt, 0);
          const lossAvg =
            merged.reduce((s, r) => s + r.lossPct * r.productionMt, 0) / Math.max(1, prodSum);
          const fcDisplay =
            fc > 0 ? fc : countyMetricsFallbackRows().reduce((s, r) => s + r.farmersRegistered, 0);
          setState({
            season,
            usingFallbackSignals: fc === 0,
            farmersCount: fcDisplay,
            productionMt: prodSum,
            targetMt: nationalHeroMetrics.nationalProductionTargetMt,
            lossRatePct: Number.isFinite(lossAvg) ? lossAvg : nationalHeroMetrics.postHarvestLossRatePct,
            countiesRanked: merged.sort((a, b) => b.productionMt - a.productionMt),
          });
          return;
        }

        if (rows.length === 0 && !pilotCountyLive?.length && fc > 0) {
          const merged = countyMetricsFallbackRows();
          const prodSum = merged.reduce((s, r) => s + r.productionMt, 0);
          const lossAvg =
            merged.reduce((s, r) => s + r.lossPct * r.productionMt, 0) / Math.max(1, prodSum);
          setState({
            season,
            usingFallbackSignals: true,
            farmersCount: fc,
            productionMt: prodSum,
            targetMt: nationalHeroMetrics.nationalProductionTargetMt,
            lossRatePct: Number.isFinite(lossAvg) ? lossAvg : nationalHeroMetrics.postHarvestLossRatePct,
            countiesRanked: merged.sort((a, b) => b.productionMt - a.productionMt),
          });
          return;
        }

        let actualKg = 0;
        let expectedKg = 0;
        let lossKg = 0;
        const byCounty = new Map<string, { p: number; t: number; l: number }>();
        for (const r of rows) {
          actualKg += r.actual;
          expectedKg += r.expected;
          lossKg += r.loss;
          const prev = byCounty.get(r.county) ?? { p: 0, t: 0, l: 0 };
          prev.p += r.actual;
          prev.t += r.expected;
          prev.l += r.loss;
          byCounty.set(r.county, prev);
        }
        const lr = safePct(lossKg, Math.max(1, expectedKg));
        const mapped: CountyProductionRow[] = Array.from(byCounty.entries()).map(([county, v]) => {
          const lossPct = safePct(v.l, Math.max(1, v.t));
          const status: CountyProductionRow["status"] =
            lossPct > 14 ? "critical" : lossPct > 11 ? "warning" : "healthy";
          return {
            county,
            productionMt: v.p / 1000,
            targetMt: Math.max(v.t / 1000, 0.001),
            lossPct,
            status,
            farmersRegistered: 0,
          };
        });

        setState({
          season,
          usingFallbackSignals: false,
          farmersCount: fc,
          productionMt: actualKg / 1000,
          targetMt: nationalHeroMetrics.nationalProductionTargetMt,
          lossRatePct: lr,
          countiesRanked: mapped.sort((a, b) => b.productionMt - a.productionMt),
        });
      } catch {
        if (!cancelled) {
          setState({
            season,
            usingFallbackSignals: true,
            farmersCount: nationalHeroMetrics.registeredFarmers,
            productionMt: nationalHeroMetrics.domesticRiceProductionMt,
            targetMt: nationalHeroMetrics.nationalProductionTargetMt,
            lossRatePct: nationalHeroMetrics.postHarvestLossRatePct,
            countiesRanked: countyProductionPerformance,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season]);

  return state;
}
