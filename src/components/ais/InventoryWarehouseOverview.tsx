"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StockRow = {
  quantity: number;
  expiry_date: string | null;
  warehouses: {
    name: string;
    county: string | null;
    ministry_code: string | null;
    utilization_pct: number | null;
    current_stock_mt: number | null;
    operational_status: string | null;
    donor_resupply_flag: boolean | null;
  } | null;
  inventory_items: { name: string; sku: string } | null;
};

export default function InventoryWarehouseOverview() {
  const [rows, setRows] = React.useState<StockRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("warehouse_stock")
          .select(
            "quantity, expiry_date, warehouses(name, county, ministry_code, utilization_pct, current_stock_mt, operational_status, donor_resupply_flag), inventory_items(name, sku)",
          )
          .limit(800);
        if (cancelled) return;
        if (error || !data?.length) {
          setRows([]);
          setLoading(false);
          return;
        }
        setRows(data as StockRow[]);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = React.useMemo(() => {
    let totalQty = 0;
    let lowLines = 0;
    let expiryRisk = 0;
    let ministryHubs = 0;
    let donorHubs = 0;
    let utilizationMass = 0;
    let utilizationN = 0;
    const now = Date.now();
    const horizon = 90 * 24 * 60 * 60 * 1000;
    for (const r of rows) {
      const q = Number(r.quantity) || 0;
      totalQty += q;
      if (q > 0 && q < 500) lowLines++;
      if (r.expiry_date) {
        const t = new Date(r.expiry_date).getTime();
        if (!Number.isNaN(t) && t - now < horizon && t >= now) expiryRisk++;
      }
      const w = r.warehouses;
      if (w?.ministry_code) {
        ministryHubs++;
        if (w.donor_resupply_flag) donorHubs++;
        if (w.utilization_pct != null && Number.isFinite(Number(w.utilization_pct))) {
          utilizationMass += Number(w.utilization_pct);
          utilizationN++;
        }
      }
    }
    const avgUtilization = utilizationN ? Math.round(utilizationMass / utilizationN) : null;
    return { totalQty, lowLines, expiryRisk, skuLines: rows.length, ministryHubs, donorHubs, avgUtilization };
  }, [rows]);

  return (
    <div className="mb-6 space-y-3">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Stock lines</div>
        <div className="mt-1 font-display text-xl font-semibold text-white">{loading ? "—" : metrics.skuLines}</div>
      </div>
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Quantity on hand</div>
        <div className="mt-1 font-display text-xl font-semibold text-emerald-200 tabular-nums">
          {loading ? "—" : Intl.NumberFormat().format(Math.round(metrics.totalQty))}
        </div>
      </div>
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/70">Low stock SKUs</div>
        <div className="mt-1 font-display text-xl font-semibold text-amber-100">{loading ? "—" : metrics.lowLines}</div>
      </div>
      <div className="rounded-xl border border-rose-900/35 bg-rose-950/25 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-200/70">Expiry window (90d)</div>
        <div className="mt-1 font-display text-xl font-semibold text-rose-100">{loading ? "—" : metrics.expiryRisk}</div>
      </div>
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3 flex flex-col justify-center">
        <div className="text-[12px] text-slate-400 leading-snug">
          Live balances from <span className="font-mono text-slate-200">warehouse_stock</span>. Movement timelines reconcile via transfers and receipts.
        </div>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-emerald-900/35 bg-emerald-950/20 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Ministry-coded hubs</div>
        <div className="mt-1 font-display text-lg font-semibold text-emerald-100 tabular-nums">
          {loading ? "—" : metrics.ministryHubs}
        </div>
      </div>
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Avg utilization (coded rows)</div>
        <div className="mt-1 font-display text-lg font-semibold text-white tabular-nums">
          {loading || metrics.avgUtilization == null ? "—" : `${metrics.avgUtilization}%`}
        </div>
      </div>
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/70">Donor resupply flagged</div>
        <div className="mt-1 font-display text-lg font-semibold text-amber-100 tabular-nums">
          {loading ? "—" : metrics.donorHubs}
        </div>
      </div>
    </div>
    </div>
  );
}
