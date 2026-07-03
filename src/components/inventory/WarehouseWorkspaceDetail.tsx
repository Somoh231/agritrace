"use client";

import * as React from "react";
import Link from "next/link";

import {
  AlertCard,
  DashboardPanel,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
import { RegistryKpiStrip } from "@/components/registry";
import {
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { buildWarehouseOperationalBrief } from "@/lib/ops/warehouse-operational-narrative";
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

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 10);
}

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function expiryTone(days: number | null): "ok" | "soon" | "critical" | "unknown" {
  if (days == null) return "unknown";
  if (days < 0) return "critical";
  if (days <= 30) return "critical";
  if (days <= 90) return "soon";
  return "ok";
}

function qtyTone(qty: number): "ok" | "low" | "critical" {
  if (qty <= 0) return "critical";
  if (qty < 500) return "critical";
  if (qty < 1200) return "low";
  return "ok";
}

function StockBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? clamp01(value / max) : 0;
  const tone = pct < 0.15 ? "bg-rose-500" : pct < 0.35 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="h-2 w-[140px] rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full ${tone}`} style={{ width: `${Math.round(pct * 100)}%` }} />
    </div>
  );
}

function riskTone(status: string): "success" | "warning" | "danger" {
  if (status === "healthy") return "success";
  if (status === "warning") return "warning";
  return "danger";
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "emerald" | "amber" | "rose" | "slate";
}) {
  const map = {
    neutral: "neutral",
    emerald: "success",
    amber: "warning",
    rose: "danger",
    slate: "info",
  } as const;
  return <StatusBadge tone={map[tone]}>{label}</StatusBadge>;
}

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

  const maxQty = React.useMemo(() => {
    if (!stockLines.length) return 0;
    const m = Math.max(...stockLines.map((s) => s.quantity));
    return Number.isFinite(m) ? m : 0;
  }, [stockLines]);

  const stockByCategory = React.useMemo(() => {
    const m = new Map<string, StockLine[]>();
    for (const s of stockLines) {
      const k = (s.category || "Uncategorized").trim() || "Uncategorized";
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    const groups = [...m.entries()].map(([category, lines]) => ({
      category,
      lines: [...lines].sort((a, b) => b.quantity - a.quantity),
    }));
    groups.sort((a, b) => a.category.localeCompare(b.category));
    return groups;
  }, [stockLines]);

  const lowStockCount = React.useMemo(
    () => stockLines.filter((s) => qtyTone(s.quantity) !== "ok").length,
    [stockLines],
  );

  const narrative = React.useMemo(() => buildWarehouseOperationalBrief(code), [code]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        kicker={`Hub command · ${code}`}
        title={name}
        description="Hub profile · SKU custody · donor corridors · transfer workflows (TRF) · distributions · movement timeline scoped to this ministry code."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={riskTone(signalRisk)}>{signalRisk}</StatusBadge>
            {donor ? <StatusBadge tone="warning">Donor resupply</StatusBadge> : null}
            {utilization >= 92 ? <StatusBadge tone="danger">Near capacity</StatusBadge> : null}
          </div>
        }
      />

      <p className="-mt-2">
        <Link href="/inventory" className="text-[13px] font-medium text-forest-700 hover:text-forest-600">
          ← Logistics command center
        </Link>
      </p>

      <RegistryKpiStrip
        items={[
          { label: "County", value: county },
          { label: "Operational status", value: opStatus },
          { label: "Utilization", value: `${utilization.toFixed(1)}%`, hint: "Capacity pressure" },
          { label: "Stock / capacity", value: `${currentStock.toFixed(1)} / ${capacity.toFixed(1)} MT` },
          { label: "SKU lines", value: String(stockLines.length) },
          { label: "Custody manager", value: manager },
        ]}
      />

      {narrative ? (
        <DashboardPanel>
          <SectionHeader kicker="Operational narrative" title={narrative.headline} />
          <div className="mt-3 grid gap-2 text-[12px] text-slate-600 md:grid-cols-2">
            <p><span className="font-mono text-[10px] uppercase text-slate-500">Stock pressure · </span>{narrative.stockPressure}</p>
            <p><span className="font-mono text-[10px] uppercase text-slate-500">Donor shipments · </span>{narrative.donorOverview}</p>
            <p><span className="font-mono text-[10px] uppercase text-slate-500">County allocation · </span>{narrative.countyAllocation}</p>
            <p><span className="font-mono text-[10px] uppercase text-slate-500">Utilization · </span>{narrative.utilizationCommentary}</p>
            <p className="md:col-span-2"><span className="font-mono text-[10px] uppercase text-slate-500">Low stock · </span>{narrative.lowStockReasoning}</p>
            <p className="md:col-span-2"><span className="font-mono text-[10px] uppercase text-slate-500">Expiry risk · </span>{narrative.expiryRisk}</p>
          </div>
          <Timeline
            className="mt-4"
            items={narrative.movementSummary.map((m, i) => ({ id: `mv-${i}`, title: m, time: "Recent", tone: "default" as const }))}
          />
        </DashboardPanel>
      ) : null}

      <DashboardPanel>
        <SectionHeader
          kicker="Posture"
          title="Utilization · expiry · low stock"
          action={
            <div className="flex flex-wrap gap-2">
              {lowStockCount ? <Chip tone="amber" label={`${lowStockCount} low stock`} /> : <Chip tone="emerald" label="Stock stable" />}
              {expiryAlerts.length ? <Chip tone="rose" label={`${expiryAlerts.length} expiry risks`} /> : <Chip tone="slate" label="No expiry risks" />}
            </div>
          }
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] items-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600">Capacity utilization</span>
              <span className="font-mono tabular-nums text-ink-900">{utilization.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`${utilization >= 92 ? "bg-rose-500" : utilization >= 80 ? "bg-amber-400" : "bg-emerald-500"} h-full`}
                style={{ width: `${Math.round(clamp01(utilization / 100) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[12px] text-slate-500">
              {capacity > 0 ? `${currentStock.toFixed(1)} MT in custody · ${capacity.toFixed(1)} MT capacity` : "Capacity not configured"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="font-mono text-[10px] uppercase text-slate-500">Inbound TRF</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{incomingTransfers.length}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="font-mono text-[10px] uppercase text-slate-500">Outbound TRF</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{outgoingTransfers.length}</p>
            </div>
          </div>
        </div>
      </DashboardPanel>

      {assignedDistricts.length ? (
        <DashboardPanel>
          <SectionHeader kicker="Coverage" title="Assigned districts" subtitle={`Farmers with primary warehouse linkage to ${code}`} />
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedDistricts.map((d) => (
              <StatusBadge key={d} tone="neutral">{d}</StatusBadge>
            ))}
          </div>
        </DashboardPanel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel padding="none">
          <div className="border-b border-slate-100 px-5 py-3">
            <SectionHeader kicker="Inbound" title="Transfer workflow · inbound" />
          </div>
          <ul className="divide-y divide-slate-100 px-5 py-2 text-[12px]">
            {incomingTransfers.length ? (
              incomingTransfers.map((t) => (
                <li key={t.transferCode} className="py-2.5">
                  <Link href="/transfers" className="font-mono font-medium text-forest-700">{t.transferCode}</Link>
                  <span className="text-slate-600"> · {t.sku} · {t.quantity} · </span>
                  <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
                </li>
              ))
            ) : (
              <li className="py-4 text-slate-500">No inbound TRF rows for this hub.</li>
            )}
          </ul>
        </DashboardPanel>

        <DashboardPanel padding="none">
          <div className="border-b border-slate-100 px-5 py-3">
            <SectionHeader kicker="Outbound" title="Farmer-facing distributions" />
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table min-w-[480px]">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Farmer</th>
                  <th>Qty</th>
                  <th>Channel</th>
                </tr>
              </thead>
              <tbody>
                {distributions.length ? (
                  distributions.map((d) => (
                    <tr key={d.id}>
                      <td className="whitespace-nowrap">{new Date(d.at).toLocaleString()}</td>
                      <td>{d.farmer}</td>
                      <td className="tabular-nums">{d.qty}</td>
                      <td className="font-mono text-[11px]">{d.channel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-500">No distribution_logs rows for this warehouse.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-3 flex flex-wrap justify-between gap-2">
          <SectionHeader kicker="Custody" title="Inventory by SKU" subtitle="warehouse_stock · canonical fallback" />
          <Link href="/transfers" className="text-[12px] font-medium text-forest-700 hover:text-forest-600 self-center">
            Open transfer workflow →
          </Link>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="enterprise-table min-w-[980px]">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th>Stock level</th>
                <th>Expiry risk</th>
                <th>Donor</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {stockLines.length ? (
                stockByCategory.flatMap((g) => {
                  const header = (
                    <tr key={`cat-${g.category}`} className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{g.category}</div>
                          <div className="text-[11px] text-slate-500">{g.lines.length} lines</div>
                        </div>
                      </td>
                    </tr>
                  );

                  const rows = g.lines.map((s) => {
                    const days = daysUntil(s.expiry);
                    const eTone = expiryTone(days);
                    const qTone = qtyTone(s.quantity);
                    const rowCls =
                      qTone === "critical" ? "bg-rose-50" : qTone === "low" ? "bg-amber-50/50" : "";
                    return (
                      <tr key={s.sku + (s.batch ?? "")} className={rowCls}>
                        <td className="font-mono text-[11px] text-forest-700">{s.sku}</td>
                        <td className="min-w-[200px]">{s.name}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="tabular-nums font-mono text-[12px] w-[88px] text-right">
                              {Intl.NumberFormat().format(s.quantity)}
                            </div>
                            <StockBar value={s.quantity} max={Math.max(1, maxQty)} />
                            {qTone === "critical" ? <Chip tone="rose" label="LOW" /> : qTone === "low" ? <Chip tone="amber" label="WATCH" /> : <Chip tone="emerald" label="OK" />}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500">{fmtDate(s.expiry)}</span>
                            {eTone === "critical" ? (
                              <Chip tone="rose" label={days != null ? `${days}d` : "RISK"} />
                            ) : eTone === "soon" ? (
                              <Chip tone="amber" label={days != null ? `${days}d` : "SOON"} />
                            ) : eTone === "ok" ? (
                              <Chip tone="slate" label="OK" />
                            ) : (
                              <Chip tone="neutral" label="—" />
                            )}
                          </div>
                        </td>
                        <td>{s.donor ? <Chip tone="amber" label="Donor" /> : <span className="text-slate-400">—</span>}</td>
                        <td>{s.damaged ? <Chip tone="rose" label="Loss/Theft" /> : <span className="text-slate-400">—</span>}</td>
                      </tr>
                    );
                  });

                  return [header, ...rows];
                })
              ) : (
                <tr>
                  <td className="py-6 text-slate-500" colSpan={6}>
                    No SKU custody rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertCard tone="danger" title="Expiry alerts (90d)">
          {expiryAlerts.length ? (
            <ul className="space-y-1">
              {expiryAlerts.map((s) => (
                <li key={s.sku}>{s.sku} · {s.name} · expires {s.expiry}</li>
              ))}
            </ul>
          ) : (
            <p>No tracked lots inside the 90-day disposition window.</p>
          )}
        </AlertCard>
        <DashboardPanel>
          <SectionHeader title="Damaged / flagged inventory" />
          <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
            {damagedLines.length ? (
              damagedLines.map((s) => (
                <li key={`dmg-${s.sku}`}>{s.sku} · batch {s.batch ?? "—"}</li>
              ))
            ) : (
              <li className="text-slate-500">No loss / theft flags on live rows.</li>
            )}
          </ul>
        </DashboardPanel>
      </div>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-3">
          <SectionHeader kicker="Programmes" title="Donor shipments" />
        </div>
        <div className="overflow-x-auto p-2">
          <table className="enterprise-table min-w-[560px]">
            <thead>
              <tr>
                <th>Donor</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {donors.length ? (
                donors.map((d) => (
                  <tr key={d.id}>
                    <td>{d.donor}</td>
                    <td className="font-mono text-[11px]">{d.sku}</td>
                    <td className="tabular-nums">{d.qty}</td>
                    <td>{d.received}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-slate-500">
                    No donor_shipments linked to this warehouse id.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-3 flex flex-wrap justify-between gap-2">
          <SectionHeader kicker="Ledger" title="Inventory movement timeline" subtitle="Transfers · receipts · distributions" />
          <span className="font-mono text-[10px] text-slate-500 self-center">{warehouseUuid ? "Scoped to hub UUID" : "Fixture scope"}</span>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="enterprise-table min-w-[800px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Occurred</th>
              </tr>
            </thead>
            <tbody>
              {movements.length ? (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-[11px] text-forest-700">{m.ref}</td>
                    <td className="font-mono text-[11px]">{m.sku}</td>
                    <td className="tabular-nums">{m.qty}</td>
                    <td className="font-mono text-[11px]">{m.from}</td>
                    <td className="font-mono text-[11px]">{m.to}</td>
                    <td className="capitalize">{m.type}</td>
                    <td className="text-slate-500">{m.at ? new Date(m.at).toLocaleString() : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-slate-500">No movements yet for this warehouse code.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <SectionHeader title="Outgoing transfer spotlight" />
        <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
          {outgoingTransfers.length ? (
            outgoingTransfers.map((t) => (
              <li key={`out-${t.transferCode}`}>
                <Link href="/transfers" className="font-mono font-medium text-forest-700">{t.transferCode}</Link>
                <span> → {t.toMinistryCode} · {t.status.replace(/_/g, " ")}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No active outbound TRF rows.</li>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/transfers" className="inline-flex h-9 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
            Transfer command desk
          </Link>
          <Link href="/inventory/donor-shipments" className="inline-flex h-9 items-center rounded-lg btn-gov-outline px-4 text-[12px]">
            Donor shipments
          </Link>
          <Link href="/inventory/expiry" className="inline-flex h-9 items-center rounded-lg btn-gov-outline px-4 text-[12px]">
            Expiry monitoring
          </Link>
        </div>
      </DashboardPanel>
    </div>
  );
}
