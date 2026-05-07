"use client";

import * as React from "react";
import Link from "next/link";

import { OpsStatusBadge } from "@/components/pilot/pilot-ui";
import {
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { ministryWarehouseToSignalRow } from "@/lib/data/ministry-data-service";
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StockLine = {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  expiry: string | null;
  donor: boolean;
  damaged: boolean;
  batch: string | null;
};

type MovRow = {
  id: string;
  ref: string;
  sku: string;
  qty: number;
  type: string;
  from: string;
  to: string;
  at: string;
};

export default function WarehouseWorkspaceDetail({ code }: { code: string }) {
  const canon = MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code);
  const canonSignals = canon ? ministryWarehouseToSignalRow(canon) : null;

  const [liveRow, setLiveRow] = React.useState<Record<string, unknown> | null>(null);
  const [stockLines, setStockLines] = React.useState<StockLine[]>([]);
  const [movements, setMovements] = React.useState<MovRow[]>([]);
  const [distributions, setDistributions] = React.useState<Array<{ id: string; qty: number; at: string; channel: string; farmer: string }>>([]);
  const [donors, setDonors] = React.useState<Array<{ id: string; donor: string; sku: string; qty: number; received: string }>>([]);
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);

  const warehouseUuid = liveRow?.id ? String(liveRow.id) : null;

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

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      const uuid = warehouseUuid;
      if (!uuid) {
        const canonStock = MINISTRY_INVENTORY_LINES.filter((l) => l.warehouseMinistryCode === code).map((l) => ({
          sku: l.sku,
          name: l.itemName,
          category: "canonical",
          quantity: l.quantity,
          expiry: l.expiryDate,
          donor: false,
          damaged: l.stockStatus.toLowerCase().includes("damage"),
          batch: l.inventoryCode,
        }));
        if (!cancelled) setStockLines(canonStock);
        const canonMov = MINISTRY_INVENTORY_MOVEMENTS.filter((m) => m.fromWarehouseCode === code || m.toWarehouseCode === code).map((m, i) => ({
          id: `cm-${i}`,
          ref: m.reference,
          sku: m.sku,
          qty: m.quantity,
          type: m.movementType,
          from: m.fromWarehouseCode,
          to: m.toWarehouseCode,
          at: m.occurredAt,
        }));
        if (!cancelled) setMovements(canonMov);
        if (!cancelled) setDistributions([]);
        if (!cancelled) setDonors([]);
        return;
      }

      try {
        const [{ data: ws }, { data: mov }, { data: dist }, { data: ds }] = await Promise.all([
          supabase
            .from("warehouse_stock")
            .select("quantity, expiry_date, donor_tagged, loss_flag, theft_flag, batch_code, inventory_items(name,sku,category)")
            .eq("warehouse_id", uuid)
            .limit(400),
          supabase
            .from("inventory_movements")
            .select("id, reference, quantity, movement_type, created_at, warehouse_from, warehouse_to, inventory_items(sku)")
            .or(`warehouse_from.eq.${uuid},warehouse_to.eq.${uuid}`)
            .order("created_at", { ascending: false })
            .limit(80),
          supabase
            .from("distribution_logs")
            .select("id, quantity, distributed_at, channel, farmers(full_name)")
            .eq("warehouse_id", uuid)
            .order("distributed_at", { ascending: false })
            .limit(40),
          supabase
            .from("donor_shipments")
            .select("id, donor_name, quantity, received_at, inventory_items(sku)")
            .eq("warehouse_id", uuid)
            .order("received_at", { ascending: false })
            .limit(40),
        ]);

        if (cancelled) return;

        const sl: StockLine[] =
          (ws as Record<string, unknown>[] | null)?.map((r) => {
            const inv = r.inventory_items as Record<string, unknown> | null;
            return {
              sku: String(inv?.sku ?? "—"),
              name: String(inv?.name ?? "—"),
              category: String(inv?.category ?? "—"),
              quantity: Number(r.quantity ?? 0),
              expiry: r.expiry_date ? String(r.expiry_date) : null,
              donor: Boolean(r.donor_tagged),
              damaged: Boolean(r.loss_flag) || Boolean(r.theft_flag),
              batch: r.batch_code ? String(r.batch_code) : null,
            };
          }) ?? [];

        setStockLines(sl.length ? sl : MINISTRY_INVENTORY_LINES.filter((l) => l.warehouseMinistryCode === code).map((l) => ({
          sku: l.sku,
          name: l.itemName,
          category: "fixture",
          quantity: l.quantity,
          expiry: l.expiryDate,
          donor: false,
          damaged: l.stockStatus.toLowerCase().includes("damage"),
          batch: l.inventoryCode,
        })));

        const whIds = new Set<string>();
        for (const r of (mov as Record<string, unknown>[] | null) ?? []) {
          if (r.warehouse_from) whIds.add(String(r.warehouse_from));
          if (r.warehouse_to) whIds.add(String(r.warehouse_to));
        }
        const { data: whNames } =
          whIds.size > 0 ? await supabase.from("warehouses").select("id,ministry_code").in("id", [...whIds]) : { data: [] as Record<string, unknown>[] };
        const whMap = new Map<string, string>(
          (whNames ?? []).map((w: Record<string, unknown>) => [String(w.id), String(w.ministry_code ?? "")]),
        );
        const warehouseCodeById = (warehouseId: unknown): string => {
          if (warehouseId == null || warehouseId === "") return "—";
          return whMap.get(String(warehouseId)) ?? "—";
        };

        const mr: MovRow[] =
          (mov as Record<string, unknown>[] | null)?.map((r) => {
            const inv = r.inventory_items as Record<string, unknown> | null;
            return {
              id: String(r.id),
              ref: String(r.reference ?? inv?.sku ?? "—"),
              sku: String(inv?.sku ?? "—"),
              qty: Number(r.quantity ?? 0),
              type: String(r.movement_type ?? ""),
              from: warehouseCodeById(r.warehouse_from),
              to: warehouseCodeById(r.warehouse_to),
              at: String(r.created_at ?? ""),
            };
          }) ?? [];

        setMovements(
          mr.length
            ? mr
            : MINISTRY_INVENTORY_MOVEMENTS.filter((m) => m.fromWarehouseCode === code || m.toWarehouseCode === code).map((m, i) => ({
                id: `cm-${i}`,
                ref: m.reference,
                sku: m.sku,
                qty: m.quantity,
                type: m.movementType,
                from: m.fromWarehouseCode,
                to: m.toWarehouseCode,
                at: m.occurredAt,
              })),
        );

        setDistributions(
          (dist as Record<string, unknown>[] | null)?.map((r) => {
            const f = r.farmers as Record<string, unknown> | null;
            return {
              id: String(r.id),
              qty: Number(r.quantity ?? 0),
              at: String(r.distributed_at ?? ""),
              channel: String(r.channel ?? "—"),
              farmer: String(f?.full_name ?? "Farmer"),
            };
          }) ?? [],
        );

        setDonors(
          (ds as Record<string, unknown>[] | null)?.map((r) => {
            const inv = r.inventory_items as Record<string, unknown> | null;
            return {
              id: String(r.id),
              donor: String(r.donor_name ?? ""),
              sku: String(inv?.sku ?? "—"),
              qty: Number(r.quantity ?? 0),
              received: String(r.received_at ?? ""),
            };
          }) ?? [],
        );
      } catch {
        if (!cancelled) {
          setStockLines(
            MINISTRY_INVENTORY_LINES.filter((l) => l.warehouseMinistryCode === code).map((l) => ({
              sku: l.sku,
              name: l.itemName,
              category: "fixture",
              quantity: l.quantity,
              expiry: l.expiryDate,
              donor: false,
              damaged: false,
              batch: l.inventoryCode,
            })),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, warehouseUuid]);

  React.useEffect(() => {
    void listTransferOrders().then((all) => {
      setTransfers(all.filter((t) => t.fromMinistryCode === code || t.toMinistryCode === code));
    });
  }, [code]);

  const name = (liveRow?.name as string | undefined) ?? canon?.name ?? `Warehouse ${code}`;
  const county = (liveRow?.county as string | undefined) ?? canon?.county ?? "—";
  const utilization = Number(liveRow?.utilization_pct ?? canon?.utilizationPct ?? 0) || 0;
  const currentStock = Number(liveRow?.current_stock_mt ?? canon?.currentStockMt ?? 0) || 0;
  const capacity = Number(liveRow?.capacity_mt ?? canon?.capacityMt ?? 0) || 0;
  const manager = (liveRow?.manager_name as string | undefined) ?? canon?.managerName ?? "—";
  const opStatus = (liveRow?.operational_status as string | undefined) ?? canon?.operationalStatus ?? "Operational";
  const donor = Boolean(liveRow?.donor_resupply_flag ?? canon?.donorResupplyFlag);
  const signalRisk = canonSignals?.stockRisk ?? "warning";

  const assignedDistricts = [...new Set(MINISTRY_FARMERS.filter((f) => f.primaryWarehouseCode === code).map((f) => f.district))];

  const now = Date.now();
  const horizon = 90 * 24 * 3600 * 1000;
  const expiryAlerts = stockLines.filter((s) => {
    if (!s.expiry) return false;
    const t = new Date(s.expiry).getTime();
    return !Number.isNaN(t) && t - now < horizon && t >= now;
  });

  const damagedLines = stockLines.filter((s) => s.damaged);

  const incomingTransfers = transfers.filter((t) => t.toMinistryCode === code && t.status !== "completed");
  const outgoingTransfers = transfers.filter((t) => t.fromMinistryCode === code && t.status !== "completed");

  return (
    <div className="space-y-8 text-slate-100 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/inventory" className="font-mono text-[11px] text-emerald-400 hover:text-emerald-300">
            ← Logistics command center
          </Link>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">{code}</div>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.5vw,1.95rem)] font-semibold text-white">{name}</h1>
          <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed text-slate-400">
            Hub profile · SKU custody · donor corridors · transfer workflows (<span className="font-mono text-emerald-300/80">TRF-*-*-*</span>) · distributions · movement
            timeline scoped to this ministry code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OpsStatusBadge status={signalRisk} />
          {donor ? (
            <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 font-mono text-[10px] text-amber-100">Donor resupply corridor</span>
          ) : null}
          {utilization >= 92 ? (
            <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 font-mono text-[10px] text-rose-100">Near capacity</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[
          { label: "County", value: county },
          { label: "Operational status", value: opStatus },
          { label: "Utilization", value: `${utilization.toFixed(1)}%` },
          { label: "Stock / capacity", value: `${currentStock.toFixed(1)} / ${capacity.toFixed(1)} MT` },
          { label: "SKU lines", value: String(stockLines.length) },
          { label: "Custody manager", value: manager },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-700 bg-slate-950/55 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{m.label}</div>
            <div className="mt-1 font-display text-[15px] font-semibold leading-snug text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {assignedDistricts.length ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-950/45 px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Assigned districts</div>
          <p className="mt-2 text-[12px] text-slate-400">Farmers with primary warehouse linkage to {code} (canonical registry).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedDistricts.map((d) => (
              <span key={d} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[12px] text-slate-200">
                {d}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Incoming shipments</div>
            <div className="font-display text-[15px] font-semibold text-white">Transfer workflow · inbound</div>
          </div>
          <ul className="divide-y divide-slate-800 px-5 py-2 text-[12px]">
            {incomingTransfers.length ? (
              incomingTransfers.map((t) => (
                <li key={t.transferCode} className="py-2">
                  <span className="font-mono text-emerald-300/90">{t.transferCode}</span> · {t.sku} · {t.quantity} ·{" "}
                  <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
                </li>
              ))
            ) : (
              <li className="py-4 text-slate-500">No inbound TRF rows for this hub.</li>
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Outgoing distributions</div>
            <div className="font-display text-[15px] font-semibold text-white">Farmer-facing ledger</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[12px]">
              <thead className="font-mono text-[10px] uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-2">When</th>
                  <th className="px-5 py-2">Farmer</th>
                  <th className="px-5 py-2">Qty</th>
                  <th className="px-5 py-2">Channel</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {distributions.length ? (
                  distributions.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/90">
                      <td className="px-5 py-2 whitespace-nowrap">{new Date(d.at).toLocaleString()}</td>
                      <td className="px-5 py-2">{d.farmer}</td>
                      <td className="px-5 py-2 tabular-nums">{d.qty}</td>
                      <td className="px-5 py-2 font-mono text-[11px]">{d.channel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={4}>
                      No distribution_logs rows for this warehouse (live DB empty).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3 flex flex-wrap justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Inventory by SKU</div>
            <div className="font-display text-[15px] font-semibold text-white">warehouse_stock · canonical fallback</div>
          </div>
          <Link href="/inventory/transfers" className="text-[12px] text-emerald-400 hover:text-emerald-300">
            Open transfer workflow →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-5 py-2">SKU</th>
                <th className="px-5 py-2">Item</th>
                <th className="px-5 py-2">Qty</th>
                <th className="px-5 py-2">Expiry</th>
                <th className="px-5 py-2">Donor-tagged</th>
                <th className="px-5 py-2">Flags</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {stockLines.length ? (
                stockLines.map((s) => (
                  <tr key={s.sku + (s.batch ?? "")} className="border-b border-slate-800/90">
                    <td className="px-5 py-2 font-mono text-[11px] text-emerald-200/90">{s.sku}</td>
                    <td className="px-5 py-2">{s.name}</td>
                    <td className="px-5 py-2 tabular-nums">{Intl.NumberFormat().format(s.quantity)}</td>
                    <td className="px-5 py-2 text-slate-400">{s.expiry ?? "—"}</td>
                    <td className="px-5 py-2">{s.donor ? "Yes" : "—"}</td>
                    <td className="px-5 py-2 text-rose-300/90">{s.damaged ? "Damaged / loss" : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    No SKU custody rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-rose-900/35 bg-rose-950/15 px-5 py-4">
          <div className="font-display text-[14px] font-semibold text-white">Expiry alerts (90d)</div>
          <ul className="mt-3 space-y-2 text-[12px] text-rose-100/90">
            {expiryAlerts.length ? (
              expiryAlerts.map((s) => (
                <li key={s.sku}>
                  {s.sku} · {s.name} · expires {s.expiry}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No tracked lots inside the 90-day disposition window.</li>
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-4">
          <div className="font-display text-[14px] font-semibold text-white">Damaged / flagged inventory</div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
            {damagedLines.length ? (
              damagedLines.map((s) => (
                <li key={`dmg-${s.sku}`}>
                  {s.sku} · batch {s.batch ?? "—"}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No loss / theft flags on live rows.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Donor shipments</div>
          <div className="font-display text-[15px] font-semibold text-white">Programme inbounds</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="font-mono text-[10px] uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-5 py-2">Donor</th>
                <th className="px-5 py-2">SKU</th>
                <th className="px-5 py-2">Qty</th>
                <th className="px-5 py-2">Received</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {donors.length ? (
                donors.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/90">
                    <td className="px-5 py-2">{d.donor}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{d.sku}</td>
                    <td className="px-5 py-2 tabular-nums">{d.qty}</td>
                    <td className="px-5 py-2">{d.received}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    No donor_shipments linked to this warehouse id — programme CSV exports still available nationally.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3 flex flex-wrap justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Inventory movement timeline</div>
            <div className="font-display text-[15px] font-semibold text-white">Transfers · receipts · distributions</div>
          </div>
          <span className="font-mono text-[10px] text-slate-500">{warehouseUuid ? "Scoped to hub UUID" : "Fixture scope"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
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
                    <td className="px-5 py-2 font-mono text-[11px] text-emerald-200/90">{m.ref}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.sku}</td>
                    <td className="px-5 py-2 tabular-nums">{m.qty}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.from}</td>
                    <td className="px-5 py-2 font-mono text-[11px]">{m.to}</td>
                    <td className="px-5 py-2 capitalize">{m.type}</td>
                    <td className="px-5 py-2 text-slate-400">{m.at ? new Date(m.at).toLocaleString() : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    No movements yet for this warehouse code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950/35 px-5 py-4">
        <div className="font-display text-[14px] font-semibold text-white">Outgoing transfer spotlight</div>
        <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
          {outgoingTransfers.length ? (
            outgoingTransfers.map((t) => (
              <li key={`out-${t.transferCode}`}>
                <span className="font-mono text-emerald-300/90">{t.transferCode}</span> → {t.toMinistryCode} · {t.status.replace(/_/g, " ")}
              </li>
            ))
          ) : (
            <li className="text-slate-500">No active outbound TRF rows.</li>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/inventory/transfers" className="rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-4 py-2 text-[12px] font-medium text-emerald-50 hover:bg-emerald-950/55">
            Transfer command desk
          </Link>
          <Link href="/inventory/donor-shipments" className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-emerald-100 hover:bg-white/[0.05]">
            Donor shipments
          </Link>
          <Link href="/inventory/expiry" className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-emerald-100 hover:bg-white/[0.05]">
            Expiry monitoring
          </Link>
        </div>
      </section>
    </div>
  );
}
