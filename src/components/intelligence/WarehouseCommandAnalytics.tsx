"use client";

import * as React from "react";

import {
  DashboardPanel,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import {
  CHART_COLORS,
  EnterpriseAreaChart,
  EnterpriseBarChart,
  InsightRibbon,
  UtilizationGauge,
} from "@/components/enterprise/analytics";
import { inventoryTransfers, warehouses } from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView } from "@/lib/logistics/types";

function deriveThroughput(transfers: TransferOrderView[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const completed = transfers.filter((t) => t.status === "completed" || t.status === "delivered").length;
  const inTransit = transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched").length;
  const base = Math.max(1, completed + inTransit);
  return days.map((d, i) => ({ day: d, tons: Math.round((base * (0.7 + (i % 3) * 0.15)) * 12) }));
}

export default function WarehouseCommandAnalytics({
  transfers = [],
  warehouseRows,
}: {
  transfers?: TransferOrderView[];
  warehouseRows?: Record<string, unknown>[];
}) {
  const hubs = React.useMemo(() => {
    if (warehouseRows?.length) {
      return warehouseRows.map((r) => ({
        name: String(r.name ?? r.ministry_code ?? "Hub"),
        county: String(r.county ?? "—"),
        util: Number(r.utilization_pct ?? 0),
      }));
    }
    return MINISTRY_WAREHOUSES.map((w) => ({
      name: w.name,
      county: w.county,
      util: w.utilizationPct,
    }));
  }, [warehouseRows]);

  const stockByCounty = warehouses.map((w) => ({
    county: w.county,
    total: w.riceSeedTons + w.fertilizerTons + w.pesticideTons,
  }));

  const transferFlow = [
    { status: "Completed", count: inventoryTransfers.filter((t) => t.status === "completed").length + transfers.filter((t) => t.status === "completed" || t.status === "delivered").length },
    { status: "In transit", count: inventoryTransfers.filter((t) => t.status === "in_transit").length + transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched").length },
    { status: "Scheduled", count: inventoryTransfers.filter((t) => t.status === "scheduled").length + transfers.filter((t) => t.status === "requested").length },
  ];

  const throughput = deriveThroughput(transfers);
  const critical = hubs.filter((h) => h.util >= 90).length;
  const pending = transferFlow[2].count + transferFlow[1].count;

  return (
    <div className="space-y-4">
      <InsightRibbon tone={critical > 0 ? "warning" : "success"} title="Logistics command posture">
        {hubs.length} hubs in network · {critical} at critical utilization · {pending} transfer legs active or pending.
        Monitor regional distribution and corridor delays before county allocation windows close.
      </InsightRibbon>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hubs.slice(0, 4).map((h) => (
          <UtilizationGauge key={h.name} label={`${h.name} · ${h.county}`} value={h.util} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel className="lg:col-span-2">
          <SectionHeader kicker="Throughput" title="Daily movement volume" subtitle="Estimated tonnage through national corridors (pilot)" />
          <div className="mt-4">
            <EnterpriseAreaChart data={throughput} xKey="day" yKey="tons" name="Tons" color={CHART_COLORS.navy} height={220} />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Transfers" title="Movement pipeline" subtitle="Status distribution" />
          <div className="mt-4 space-y-2">
            {transferFlow.map((t) => (
              <div key={t.status} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-[13px] text-slate-700">{t.status}</span>
                <StatusBadge tone={t.status === "In transit" ? "warning" : t.status === "Scheduled" ? "info" : "success"}>
                  {t.count}
                </StatusBadge>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Regional" title="Stock concentration by county" subtitle="Combined hub inventory (demo tons)" />
          <div className="mt-4">
            <EnterpriseBarChart
              data={stockByCounty}
              xKey="county"
              series={[{ dataKey: "total", fill: CHART_COLORS.forest, name: "Total tons" }]}
              height={220}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Risk" title="Hub utilization ranking" subtitle="Capacity pressure indicators" />
          <div className="mt-4">
            <EnterpriseBarChart
              layout="vertical"
              data={[...hubs].sort((a, b) => b.util - a.util).slice(0, 6).map((h) => ({
                hub: h.name.length > 14 ? h.name.slice(0, 13) + "…" : h.name,
                util: h.util,
              }))}
              xKey="hub"
              series={[{ dataKey: "util", fill: CHART_COLORS.amber, name: "Utilization %" }]}
              valueFormatter={(v) => `${v}%`}
              height={220}
            />
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
