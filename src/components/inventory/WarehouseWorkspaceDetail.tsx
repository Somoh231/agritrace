"use client";

import * as React from "react";
import Link from "next/link";

import { OpsStatusBadge } from "@/components/pilot/pilot-ui";
import { MINISTRY_INVENTORY_MOVEMENTS, MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { ministryWarehouseToSignalRow } from "@/lib/data/ministry-data-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function WarehouseWorkspaceDetail({ code }: { code: string }) {
  const canon = MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code);
  const canonSignals = canon ? ministryWarehouseToSignalRow(canon) : null;

  const [liveRow, setLiveRow] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.from("warehouses").select("*").eq("ministry_code", code).maybeSingle();
        setLiveRow(data ?? null);
      } catch {
        setLiveRow(null);
      }
    })();
  }, [code]);

  const name =
    (liveRow?.name as string | undefined) ?? canon?.name ?? `Warehouse ${code}`;
  const county = (liveRow?.county as string | undefined) ?? canon?.county ?? "—";
  const utilization =
    Number(liveRow?.utilization_pct ?? canon?.utilizationPct ?? 0) || 0;
  const currentStock =
    Number(liveRow?.current_stock_mt ?? canon?.currentStockMt ?? 0) || 0;
  const capacity = Number(liveRow?.capacity_mt ?? canon?.capacityMt ?? 0) || 0;
  const manager =
    (liveRow?.manager_name as string | undefined) ?? canon?.managerName ?? "—";
  const opStatus =
    (liveRow?.operational_status as string | undefined) ?? canon?.operationalStatus ?? "Operational";
  const donor = Boolean(liveRow?.donor_resupply_flag ?? canon?.donorResupplyFlag);
  const signalRisk = canonSignals?.stockRisk ?? "warning";

  const movements = MINISTRY_INVENTORY_MOVEMENTS.filter(
    (m) => m.fromWarehouseCode === code || m.toWarehouseCode === code,
  ).slice(0, 18);

  return (
    <div className="space-y-6 text-slate-100 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/inventory" className="font-mono text-[11px] text-emerald-400 hover:text-emerald-300">
            ← National inventory
          </Link>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">{code}</div>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.5vw,1.95rem)] font-semibold text-white">{name}</h1>
          <p className="mt-2 text-[13px] text-slate-400 max-w-[720px] leading-relaxed">
            Warehouse logistics workspace · utilization, donor posture, and canonical movement references (for example TRF-NIM-BON-0001 style IDs).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OpsStatusBadge status={signalRisk} />
          {donor ? (
            <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 font-mono text-[10px] text-amber-100">
              Donor resupply corridor
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "County", value: county },
          { label: "Operational status", value: opStatus },
          { label: "Utilization", value: `${utilization.toFixed(1)}%` },
          { label: "Stock on hand", value: `${currentStock.toFixed(1)} / ${capacity.toFixed(1)} MT` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-700 bg-slate-950/55 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{m.label}</div>
            <div className="mt-1 font-display text-lg font-semibold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/45 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Custody</div>
        <div className="mt-2 grid gap-2 text-[13px] text-slate-300 sm:grid-cols-2">
          <div>
            <span className="text-slate-500">Manager · </span>
            <span className="text-white">{manager}</span>
          </div>
          <div>
            <span className="text-slate-500">Coordination · </span>
            <span className="text-white">County allocation desk & DAO field custody</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/inventory/transfers"
            className="rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-4 py-2 text-[12px] font-medium text-emerald-50 hover:bg-emerald-950/55"
          >
            Stock transfers
          </Link>
          <Link href="/inventory/donor-shipments" className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-emerald-100 hover:bg-white/[0.05]">
            Donor shipments
          </Link>
          <Link href="/inventory/expiry" className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-emerald-100 hover:bg-white/[0.05]">
            Expiry monitoring
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Movement timeline</div>
            <div className="font-display text-[15px] font-semibold text-white">Canonical pilot references</div>
          </div>
          <span className="font-mono text-[10px] text-slate-500">{liveRow ? "Live row synchronized" : "Fixture-backed movements"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-5 py-2">Reference</th>
                <th className="px-5 py-2">SKU</th>
                <th className="px-5 py-2">Qty</th>
                <th className="px-5 py-2">From</th>
                <th className="px-5 py-2">To</th>
                <th className="px-5 py-2">Type</th>
                <th className="px-5 py-2">Occurred</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {movements.length ? (
                movements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-800/90">
                    <td className="px-5 py-2 font-mono text-[11px] text-emerald-200/90">{m.reference}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.sku}</td>
                    <td className="px-5 py-2 tabular-nums">{m.quantity}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.fromWarehouseCode}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.toWarehouseCode}</td>
                    <td className="px-5 py-2 capitalize">{m.movementType}</td>
                    <td className="px-5 py-2 text-slate-400">{m.occurredAt.slice(0, 10)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    No canonical movements recorded for this hub yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
