"use client";

import * as React from "react";
import Link from "next/link";

import LogisticsNetworkMap from "@/components/logistics/LogisticsNetworkMap";
import { OpsMetric } from "@/components/pilot/pilot-ui";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { buildLogisticsAlerts } from "@/lib/logistics/logistics-alerts";
import {
  buildStockoutForecastText,
  exportDonorShipmentTracker,
  exportMinistryAllocationReport,
  exportWarehouseUtilization,
} from "@/lib/logistics/logistics-reporting";
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogisticsCommandCenter() {
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);
  const [lowSku, setLowSku] = React.useState(0);
  const [expiryRisk, setExpiryRisk] = React.useState(0);

  React.useEffect(() => {
    void listTransferOrders().then(setTransfers);
  }, []);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.from("warehouse_stock").select("quantity, expiry_date").limit(600);
        if (c || !data?.length) return;
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
        /* ignore */
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

  const inTransit = transfers.filter((t) => t.status === "in_transit").length;
  const pendingApproval = transfers.filter((t) => t.status === "requested").length;

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
      <div className="rounded-xl border border-emerald-900/35 bg-gradient-to-br from-emerald-950/40 to-slate-950/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">Warehouse command</div>
            <h2 className="mt-1 font-display text-[clamp(1.25rem,2vw,1.65rem)] font-semibold text-white">National logistics platform</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">
              Unified ministry view for hubs, corridors, donor flows, and bottleneck surveillance — paired with transfer workflow TRF routing and immutable movement ledger.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory/transfers" className="h-10 rounded-lg bg-emerald-600 px-4 text-[12px] font-medium text-white hover:bg-emerald-500 inline-flex items-center">
              Transfer operations
            </Link>
            <a href="#logistics-movements" className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900 inline-flex items-center">
              Movement timeline
            </a>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OpsMetric label="Coded hubs" value={String(MINISTRY_WAREHOUSES.length)} tone="navy" />
          <OpsMetric label="In transit (workflow)" value={String(inTransit)} tone="forest" />
          <OpsMetric label="Pending approvals" value={String(pendingApproval)} tone="amber" />
          <OpsMetric label="Expiry watch (90d)" value={String(expiryRisk)} tone="rose" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-700/80 bg-slate-950/45 p-4 lg:col-span-2">
          <div className="font-display text-[14px] font-semibold text-white">Operational alerts</div>
          <p className="mt-1 text-[11px] text-slate-500">Low stock, expiry, corridor delays, capacity pressure, missing confirmations.</p>
          <ul className="mt-3 space-y-2">
            {alerts.length === 0 ? (
              <li className="text-[12px] text-slate-500">No headline alerts from current signals.</li>
            ) : (
              alerts.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-lg border px-3 py-2 text-[12px] ${
                    a.severity === "critical"
                      ? "border-rose-800/50 bg-rose-950/25 text-rose-50"
                      : a.severity === "warning"
                        ? "border-amber-800/45 bg-amber-950/25 text-amber-50"
                        : "border-slate-800 bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <div className="font-medium text-white">{a.title}</div>
                  <div className="mt-1 text-[11px] opacity-90">{a.detail}</div>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-700/80 bg-slate-950/45 p-4">
          <div className="font-display text-[14px] font-semibold text-white">Reporting</div>
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={() => exportWarehouseUtilization()} className="rounded-lg border border-slate-600 px-3 py-2 text-left text-[12px] text-slate-100 hover:bg-slate-900">
              Warehouse utilization export
            </button>
            <button type="button" onClick={() => exportMinistryAllocationReport(transfers)} className="rounded-lg border border-slate-600 px-3 py-2 text-left text-[12px] text-slate-100 hover:bg-slate-900">
              Ministry allocation (TRF manifest)
            </button>
            <button type="button" onClick={() => void exportDonor()} className="rounded-lg border border-slate-600 px-3 py-2 text-left text-[12px] text-slate-100 hover:bg-slate-900">
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
              className="rounded-lg border border-emerald-800/45 px-3 py-2 text-left text-[12px] text-emerald-100 hover:bg-emerald-950/25"
            >
              Stockout forecasting note
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-700/80 bg-slate-950/35 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="font-display text-[14px] font-semibold text-white">Warehouse grid</div>
          <span className="text-[11px] text-slate-500">County allocation flow · click hub detail</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {MINISTRY_WAREHOUSES.map((w) => (
            <Link
              key={w.ministryCode}
              href={`/inventory/warehouse/${encodeURIComponent(w.ministryCode)}`}
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 hover:border-emerald-700/45"
            >
              <div className="font-mono text-[11px] text-emerald-300/90">{w.ministryCode}</div>
              <div className="text-[13px] font-medium text-white">{w.name}</div>
              <div className="mt-1 text-[11px] text-slate-500">
                {w.county} · {w.utilizationPct}% util
              </div>
            </Link>
          ))}
        </div>
      </section>

      <LogisticsNetworkMap />
    </div>
  );
}
