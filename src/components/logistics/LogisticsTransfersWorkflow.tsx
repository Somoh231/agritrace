"use client";

import * as React from "react";

import OperationDrawer from "@/components/operations/OperationDrawer";
import { listTransferOrders, advanceTransferOrder, disputeTransferOrder, createTransferRequest } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Opt = { id: string; label: string };

function statusStyle(s: TransferWorkflowStatus): string {
  switch (s) {
    case "completed":
      return "text-emerald-300";
    case "disputed":
      return "text-rose-300";
    case "in_transit":
    case "dispatched":
      return "text-sky-300";
    case "approved":
      return "text-amber-200";
    case "delivered":
      return "text-emerald-200/90";
    default:
      return "text-slate-300";
  }
}

function nextActionLabel(status: TransferWorkflowStatus): string {
  switch (status) {
    case "requested":
      return "Approve";
    case "approved":
      return "Dispatch";
    case "dispatched":
      return "Mark in transit";
    case "in_transit":
      return "Confirm delivered";
    case "delivered":
      return "Close (completed)";
    default:
      return "Advance";
  }
}

export default function LogisticsTransfersWorkflow() {
  const [rows, setRows] = React.useState<TransferOrderView[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [warehouses, setWarehouses] = React.useState<Opt[]>([]);
  const [items, setItems] = React.useState<Opt[]>([]);
  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTransferOrders();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [wh, inv] = await Promise.all([
          supabase.from("warehouses").select("id,name,ministry_code").order("name").limit(400),
          supabase.from("inventory_items").select("id,name,sku").order("name").limit(500),
        ]);
        if (c) return;
        setWarehouses((wh.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), label: `${r.name} (${r.ministry_code ?? "—"})` })));
        setItems((inv.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), label: `${r.name} (${r.sku})` })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const onAdvance = async (row: TransferOrderView) => {
    setMsg(null);
    const res = await advanceTransferOrder(row);
    setMsg(res.ok ? `Advanced ${row.transferCode}` : res.error ?? "Failed");
    await refresh();
  };

  const onDispute = async (row: TransferOrderView) => {
    setMsg(null);
    const res = await disputeTransferOrder(row);
    setMsg(res.ok ? `Marked disputed · ${row.transferCode}` : res.error ?? "Failed");
    await refresh();
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !itemId || !qty.trim()) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    const itemLabel = items.find((x) => x.id === itemId)?.label ?? itemId;
    setSaving(true);
    setMsg(null);
    const res = await createTransferRequest({
      fromWarehouseId: fromId,
      toWarehouseId: toId,
      inventoryItemId: itemId,
      skuLabel: itemLabel,
      quantity: q,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    setMsg(res.ok ? "Transfer request created with TRF-* routing code." : res.error ?? "Failed");
    if (res.ok) {
      setOpen(false);
      setQty("");
      setNotes("");
      await refresh();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Transfer workflow</div>
          <h2 className="font-display text-[17px] font-semibold text-white">Operational transfers · TRF-*-*-* routing</h2>
          <p className="mt-1 max-w-2xl text-[12px] text-slate-400">
            Lifecycle: requested → approved → dispatched → in transit → delivered → completed. Disputed pauses settlement. IDs mirror ministry convention (e.g.{" "}
            <span className="font-mono text-emerald-300/90">TRF-NIM-BON-0001</span>). Rows persist to <span className="font-mono">warehouse_transfer_orders</span>{" "}
            when migrated; otherwise local queue mirrors state.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="h-10 rounded-lg bg-emerald-700 px-4 text-[12px] font-medium text-white hover:bg-emerald-600">
          Request transfer
        </button>
      </div>

      {msg ? <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-[12px] text-slate-200">{msg}</div> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/45">
        <table className="min-w-[980px] w-full text-left text-[12px]">
          <thead className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Transfer ID</th>
              <th className="px-4 py-2">Corridor</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Operator</th>
              <th className="px-4 py-2">Requested</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/90 text-slate-200">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={8}>
                  Loading transfer manifest…
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id + r.transferCode} className="hover:bg-slate-900/40">
                  <td className="px-4 py-2 font-mono text-[11px] text-emerald-200/90">{r.transferCode}</td>
                  <td className="px-4 py-2">
                    <div className="font-mono text-[10px] text-slate-400">{r.fromMinistryCode}</div>
                    <div className="text-[11px] text-slate-500">→ {r.toMinistryCode}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px]">{r.sku}</td>
                  <td className="px-4 py-2 tabular-nums">{r.quantity}</td>
                  <td className={`px-4 py-2 font-medium capitalize ${statusStyle(r.status)}`}>{r.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-400">{r.operatorLabel ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(r.requestedAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {r.status !== "completed" && r.status !== "disputed" ? (
                        <button type="button" onClick={() => void onAdvance(r)} className="rounded border border-emerald-700/50 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-950/40">
                          {nextActionLabel(r.status)}
                        </button>
                      ) : null}
                      {r.status !== "disputed" && r.status !== "completed" ? (
                        <button type="button" onClick={() => void onDispute(r)} className="rounded border border-rose-800/55 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-950/35">
                          Dispute
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={8}>
                  No transfers loaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OperationDrawer open={open} onClose={() => setOpen(false)} title="Request warehouse transfer" subtitle="Creates TRF-* order in requested status." widthClassName="max-w-lg">
        <form onSubmit={(e) => void submitRequest(e)} className="space-y-4 text-[13px]">
          <label className="block text-slate-300">
            From warehouse *
            <select
              required
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-slate-300">
            To warehouse *
            <select
              required
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-slate-300">
            SKU *
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
            >
              <option value="">Select…</option>
              {items.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-slate-300">
            Quantity *
            <input
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
            />
          </label>
          <label className="block text-slate-300">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-[12px] text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
              {saving ? "Saving…" : "Submit request"}
            </button>
          </div>
        </form>
      </OperationDrawer>
    </div>
  );
}
