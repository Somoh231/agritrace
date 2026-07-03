"use client";

import * as React from "react";

import { RegistryKpiStrip } from "@/components/registry";
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

const nf = (n: number) => Intl.NumberFormat().format(n);

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

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <RegistryKpiStrip
      items={[
        { label: "Stock lines", value: nf(metrics.skuLines), hint: "warehouse_stock rows" },
        { label: "Quantity on hand", value: nf(Math.round(metrics.totalQty)), hint: "Units across hubs", deltaTone: "up" },
        { label: "Low stock SKUs", value: nf(metrics.lowLines), hint: "Below threshold", deltaTone: metrics.lowLines ? "down" : "up" },
        { label: "Expiry window (90d)", value: nf(metrics.expiryRisk), hint: "Disposition risk", deltaTone: metrics.expiryRisk ? "down" : "up" },
        { label: "Ministry-coded hubs", value: nf(metrics.ministryHubs), hint: "Active custody nodes" },
        { label: "Avg utilization", value: metrics.avgUtilization == null ? "—" : `${metrics.avgUtilization}%`, hint: "Coded warehouse rows" },
        { label: "Donor resupply flagged", value: nf(metrics.donorHubs), hint: "Programme corridors" },
      ]}
    />
  );
}
