"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightLeft, Map, Package } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceBadge,
  DataSourceNotice,
  QuickActionCard,
  SectionHeader,
} from "@/components/enterprise";
import LogisticsNetworkMap from "@/components/logistics/LogisticsNetworkMap";
import WarehouseCommandAnalytics from "@/components/intelligence/WarehouseCommandAnalytics";
import { RegistryKpiStrip } from "@/components/registry";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { liveSource, pilotSource, resolveDisplaySource } from "@/lib/data/data-source";
import { buildLogisticsAlerts } from "@/lib/logistics/logistics-alerts";
import {
  buildStockoutForecastText,
  exportDonorShipmentTracker,
  exportMinistryAllocationReport,
  exportWarehouseUtilization,
} from "@/lib/logistics/logistics-reporting";
import { listTransferOrdersSourced } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogisticsCommandCenter() {
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);
  const [transferSource, setTransferSource] = React.useState<import("@/lib/data/data-source").DataSourceMeta | null>(null);
  const [stockSource, setStockSource] = React.useState<import("@/lib/data/data-source").DataSourceMeta | null>(null);
  const [lowSku, setLowSku] = React.useState(0);
  const [expiryRisk, setExpiryRisk] = React.useState(0);

  React.useEffect(() => {
    void listTransferOrdersSourced().then((r) => {
      setTransfers(r.data);
      setTransferSource(r.source);
    });
  }, []);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.from("warehouse_stock").select("quantity, expiry_date").limit(600);
        if (c || !data?.length) {
          if (!c) setStockSource(pilotSource("warehouse_stock empty — KPI heuristics unavailable"));
          return;
        }
        if (!c) setStockSource(liveSource("warehouse_stock"));
        let low = 0;
        let exp = 0;
        const now = Date.now();
        const horizon = 90 * 24 * 3600 * 1000;
        for (const r of data as Record<string, unknown>[]) {
          const q = Number(r.quantity ?? 0);
          if (q > 0 && q < 500) low++;
          if (r.expiry_date) {
            const t = new Date(String(r.expiry_date)).getTime();
            if (!Number.isNaN(t) && t - now < horizon && t >= now) exp++;
          }
        }
        setLowSku(low);
        setExpiryRisk(exp);
      } catch {
        if (!c) setStockSource(pilotSource("warehouse_stock unreachable — KPI heuristics unavailable"));
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const alerts = React.useMemo(
    () => buildLogisticsAlerts({ transfers, lowStockSkuApprox: lowSku, expiryWindowApprox: expiryRisk }),
    [transfers, lowSku, expiryRisk],
  );

  const inTransit = transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched").length;
  const pendingApproval = transfers.filter((t) => t.status === "requested").length;

  const pageSource = React.useMemo(
    () =>
      resolveDisplaySource([
        transferSource ?? pilotSource("Transfer ledger loading"),
        stockSource ?? pilotSource("warehouse_stock KPIs"),
        pilotSource("MINISTRY_WAREHOUSES network + logistics alerts"),
      ]),
    [stockSource, transferSource],
  );

  const exportDonor = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("donor_shipments")
        .select("donor_name, quantity, received_at, warehouses(ministry_code), inventory_items(sku)")
        .limit(120);
      const rows =
        (data as Record<string, unknown>[] | null)?.map((r) => {
          const wh = r.warehouses as Record<string, unknown> | null;
          const inv = r.inventory_items as Record<string, unknown> | null;
          return {
            donor: String(r.donor_name ?? ""),
            sku: String(inv?.sku ?? "—"),
            qty: String(r.quantity ?? ""),
            warehouse: String(wh?.ministry_code ?? "—"),
            received: String(r.received_at ?? ""),
          };
        }) ?? [];
      if (!rows.length) {
        exportDonorShipmentTracker([
          { donor: "Demo donor programme", sku: "RICE-SEED-001", qty: "120", warehouse: "WH-NIM-001", received: "2026-05-01" },
        ]);
        return;
      }
      exportDonorShipmentTracker(rows);
    } catch {
      exportDonorShipmentTracker([
        { donor: "Demo donor programme", sku: "RICE-SEED-001", qty: "120", warehouse: "WH-NIM-001", received: "2026-05-01" },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <DataSourceNotice source={pageSource} />
      <div className="flex justify-end">
        <DataSourceBadge source={pageSource} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard href="/transfers" icon={ArrowRightLeft} title="Transfer trace" description="National TRF chain-of-custody workflow and corridor approvals." />
        <QuickActionCard href="/operations/warehouses" icon={Package} title="Warehouse registry" description="National warehouse footprint, thresholds, and geo anchors." />
        <QuickActionCard href="/map" icon={Map} title="Corridor map" description="Operational map view for logistics routing and hub posture." />
      </div>

      <RegistryKpiStrip
        items={[
          { label: "Coded hubs", value: String(MINISTRY_WAREHOUSES.length), hint: "Ministry warehouse network" },
          { label: "In transit", value: String(inTransit), hint: "Active TRF legs" },
          { label: "Pending approvals", value: String(pendingApproval), hint: "Awaiting county sign-off", deltaTone: pendingApproval ? "down" : "neutral" },
          { label: "Expiry watch (90d)", value: String(expiryRisk), hint: "SKU lots in window", deltaTone: expiryRisk ? "down" : "up" },
        ]}
      />

      <WarehouseCommandAnalytics transfers={transfers} />

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel className="lg:col-span-2">
          <SectionHeader kicker="Risk signals" title="Operational alerts" subtitle="Low stock, expiry, corridor delays, capacity pressure, missing confirmations." />
          <ul className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <li className="text-[13px] text-slate-500">No headline alerts from current signals.</li>
            ) : (
              alerts.map((a) => (
                <li key={a.id}>
                  <AlertCard tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"} title={a.title}>
                    {a.detail}
                  </AlertCard>
                </li>
              ))
            )}
          </ul>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Exports" title="Reporting" />
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => exportWarehouseUtilization()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50">
              Warehouse utilization export
            </button>
            <button type="button" onClick={() => exportMinistryAllocationReport(transfers)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50">
              Ministry allocation (TRF manifest)
            </button>
            <button type="button" onClick={() => void exportDonor()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50">
              Donor shipment tracker CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([buildStockoutForecastText(transfers)], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "stockout-forecast.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[12px] text-emerald-800 hover:bg-emerald-100"
            >
              Stockout forecasting note
            </button>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Hub network" title="Warehouse grid" subtitle="County allocation flow — open hub command profile" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {MINISTRY_WAREHOUSES.map((w) => (
            <Link
              key={w.ministryCode}
              href={`/inventory/warehouse/${encodeURIComponent(w.ministryCode)}`}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 transition hover:border-forest-300 hover:bg-white hover:shadow-sm"
            >
              <p className="font-mono text-[11px] text-forest-700">{w.ministryCode}</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink-900">{w.name}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {w.county} · {w.utilizationPct}% util
              </p>
            </Link>
          ))}
        </div>
      </DashboardPanel>

      <LogisticsNetworkMap />
    </div>
  );
}
