"use client";

import * as React from "react";
import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";
import EnterpriseDataGrid from "@/components/operations/EnterpriseDataGrid";
import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { downloadLogisticsCsv } from "@/lib/logistics/logistics-reporting";
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";

function Card({
  kicker,
  title,
  value,
  hint,
  tone = "emerald",
}: {
  kicker: string;
  title: string;
  value: string;
  hint?: string;
  tone?: "emerald" | "amber" | "sky" | "rose" | "slate";
}) {
  const ring =
    tone === "amber"
      ? "border-amber-800/45"
      : tone === "sky"
        ? "border-sky-800/45"
        : tone === "rose"
          ? "border-rose-800/45"
          : tone === "slate"
            ? "border-slate-700/70"
            : "border-emerald-900/35";
  const glow =
    tone === "amber"
      ? "bg-amber-950/15"
      : tone === "sky"
        ? "bg-sky-950/15"
        : tone === "rose"
          ? "bg-rose-950/15"
          : tone === "slate"
            ? "bg-slate-950/40"
            : "bg-emerald-950/15";
  return (
    <div className={`rounded-xl border ${ring} ${glow} px-4 py-3`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">{kicker}</div>
      <div className="mt-1 text-[13px] font-medium text-white">{title}</div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

const COUNTY_COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "county", header: "County" },
  { key: "production_index", header: "Production index" },
  { key: "food_risk", header: "Food risk" },
  { key: "dao_compliance", header: "DAO compliance" },
  { key: "beneficiaries", header: "Beneficiaries" },
  { key: "allocation_mt", header: "Subsidy allocated (mt)" },
];

const DELIVERY_COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "transfer_code", header: "Transfer" },
  { key: "from", header: "From" },
  { key: "to", header: "To" },
  { key: "sku", header: "SKU" },
  { key: "qty", header: "Qty" },
  { key: "status", header: "Status" },
];

export default function DonorDashboardClient() {
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);

  React.useEffect(() => {
    void listTransferOrders().then(setTransfers);
  }, []);

  const farmerCount = MINISTRY_FARMERS.length;
  const beneficiaryCount = MINISTRY_FARMERS.filter((f) => f.subsidyEligible).length;
  const verifiedCount = MINISTRY_FARMERS.filter((f) => f.verification === "Verified").length;
  const allocationMt = MINISTRY_FARMERS.filter((f) => f.subsidyEligible).reduce((s, f) => s + f.subsidyAllocationQty, 0);
  const utilizationPct = beneficiaryCount > 0 ? Math.min(100, Math.round((allocationMt / (beneficiaryCount * 12)) * 100)) : 0;
  const donorWarehouses = MINISTRY_WAREHOUSES.filter((w) => w.donorResupplyFlag).length;
  const stockoutWatch = MINISTRY_INVENTORY_LINES.filter((l) => l.stockStatus.toLowerCase().includes("low")).length;
  const openIncidents = MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.status === "Open" || e.status === "Escalated").length;

  const countyRows = React.useMemo(() => {
    const byCounty = new Map<string, { beneficiaries: number; alloc: number }>();
    for (const f of MINISTRY_FARMERS) {
      const c = f.county;
      const cur = byCounty.get(c) ?? { beneficiaries: 0, alloc: 0 };
      if (f.subsidyEligible) {
        cur.beneficiaries += 1;
        cur.alloc += f.subsidyAllocationQty;
      }
      byCounty.set(c, cur);
    }
    return [...MINISTRY_COUNTY_METRICS]
      .map((m) => {
        const b = byCounty.get(m.county) ?? { beneficiaries: 0, alloc: 0 };
        return {
          county: m.county,
          production_index: m.productionIndex,
          food_risk: m.foodRisk,
          dao_compliance: `${m.daoCompliance}%`,
          beneficiaries: String(b.beneficiaries),
          allocation_mt: (Math.round(b.alloc * 10) / 10).toFixed(1),
        };
      })
      .sort((a, b) => Number(b.production_index) - Number(a.production_index));
  }, []);

  const deliveryRows = React.useMemo(() => {
    return transfers.slice(0, 120).map((t) => ({
      transfer_code: t.transferCode,
      from: t.fromMinistryCode,
      to: t.toMinistryCode,
      sku: t.sku,
      qty: String(t.quantity),
      status: t.status,
    }));
  }, [transfers]);

  const exportCountyCsv = () => {
    downloadLogisticsCsv(
      "donor-county-comparisons.csv",
      ["county", "production_index", "food_risk", "dao_compliance", "beneficiaries", "allocation_mt"],
      countyRows.map((r) => [String(r.county), String(r.production_index), String(r.food_risk), String(r.dao_compliance), String(r.beneficiaries), String(r.allocation_mt)]),
    );
  };

  const exportDeliveryCsv = () => {
    downloadLogisticsCsv(
      "donor-delivery-verification.csv",
      ["transfer_code", "from", "to", "sku", "qty", "status"],
      deliveryRows.map((r) => [String(r.transfer_code), String(r.from), String(r.to), String(r.sku), String(r.qty), String(r.status)]),
    );
  };

  return (
    <MinistryPageShell
      title="Donor dashboard"
      description="Read-only programme transparency workspace — utilization, distributions, beneficiary posture, warehouse allocations, and delivery verification."
      actions={
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/reports/donor-programme"
            className="h-10 rounded-lg border border-emerald-700/45 bg-emerald-950/40 px-4 text-[12px] text-emerald-100 hover:bg-emerald-950/60 inline-flex items-center"
          >
            PDF donor report
          </a>
          <button
            type="button"
            onClick={exportCountyCsv}
            className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
          >
            County CSV
          </button>
          <button
            type="button"
            onClick={exportDeliveryCsv}
            className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
          >
            Delivery CSV
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10">
        <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-950/80 via-emerald-950/25 to-slate-950/60 p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.26em] text-emerald-300/75">Transparent execution · read-only</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card kicker="Beneficiaries" title="Verified farmers" value={Intl.NumberFormat().format(verifiedCount)} hint={`${Intl.NumberFormat().format(farmerCount)} registry`} tone="emerald" />
            <Card kicker="Programme" title="Subsidy utilization" value={`${utilizationPct}%`} hint={`${beneficiaryCount} eligible · ${allocationMt.toFixed(1)} mt allocated`} tone="amber" />
            <Card kicker="Warehouses" title="Donor corridors" value={String(donorWarehouses)} hint="Donor resupply flagged hubs" tone="sky" />
            <Card kicker="Risk" title="Incidents & stockouts" value={`${openIncidents} / ${stockoutWatch}`} hint="Open escalations / low-stock SKUs (pilot)" tone="rose" />
          </div>
          <div className="mt-4 text-[12px] leading-relaxed text-slate-400">
            This workspace provides transparency without operational control. To request a correction, use your governance channel — no write actions are exposed here.
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-display text-[14px] font-semibold text-white">County comparisons</div>
                <p className="mt-1 text-[11px] text-slate-500">Production index, food risk, DAO compliance, and subsidy footprint by county.</p>
              </div>
            </div>
            <div className="mt-3">
              <EnterpriseDataGrid rows={countyRows} columns={COUNTY_COLS} filename="donor-county-comparisons.csv" title="County signals" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Warehouse allocation</div>
            <p className="mt-1 text-[11px] text-slate-500">Read-only warehouse disposition snapshot (canonical), with live DB grids below.</p>
            <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
              {MINISTRY_WAREHOUSES.slice(0, 8).map((w) => (
                <li key={w.ministryCode} className="rounded-lg border border-slate-800 bg-black/25 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-emerald-200/90">{w.ministryCode}</span>
                    <span className="text-[11px] text-slate-500">{w.utilizationPct}% util</span>
                  </div>
                  <div className="mt-1 text-[12px] text-white">{w.name}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{w.county}</div>
                </li>
              ))}
            </ul>
            <Link href="/map" className="mt-4 inline-flex text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
              Open operational map →
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Distribution progress (distribution_logs)</div>
            <p className="mt-1 text-[11px] text-slate-500">Verified subsidy deliveries posted by DAO workflows. Read-only for donor_partner role.</p>
            <div className="mt-3">
              <LiveQueryGrid
                table="distribution_logs"
                select="distributed_at,quantity,channel,warehouse_id,inventory_item_id,farmer_id"
                columns={[
                  { key: "distributed_at", header: "When" },
                  { key: "quantity", header: "Qty" },
                  { key: "channel", header: "Channel" },
                  { key: "warehouse_id", header: "Warehouse" },
                  { key: "inventory_item_id", header: "Item" },
                  { key: "farmer_id", header: "Farmer" },
                ]}
                filename="distribution-logs.csv"
                limit={200}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Donor shipments (donor_shipments)</div>
            <p className="mt-1 text-[11px] text-slate-500">Receipts mapped to inventory items and warehouses. Read-only for donor_partner/auditor.</p>
            <div className="mt-3">
              <LiveQueryGrid
                table="donor_shipments"
                select="donor_name,programme_code,quantity,received_at,warehouse_id,inventory_item_id,created_at"
                columns={[
                  { key: "donor_name", header: "Donor" },
                  { key: "programme_code", header: "Programme" },
                  { key: "quantity", header: "Qty" },
                  { key: "received_at", header: "Received" },
                  { key: "warehouse_id", header: "Warehouse" },
                  { key: "inventory_item_id", header: "Item" },
                  { key: "created_at", header: "Logged" },
                ]}
                filename="donor-shipments.csv"
                limit={200}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-display text-[14px] font-semibold text-white">Delivery verification</div>
              <p className="mt-1 text-[11px] text-slate-500">Workflow transfers used for corridor-level verification (TRF) — read-only view.</p>
            </div>
            <Link href="/inventory/transfers" className="text-[12px] text-emerald-400 hover:text-emerald-300">
              View ministry transfer workspace →
            </Link>
          </div>
          <div className="mt-3">
            <EnterpriseDataGrid rows={deliveryRows} columns={DELIVERY_COLS} filename="donor-delivery-verification.csv" title="Delivery verification" />
          </div>
        </section>
      </div>
    </MinistryPageShell>
  );
}

