"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Opt = { id: string; label: string };

export default function RecordStockTransferForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warehouses, setWarehouses] = React.useState<Opt[]>([]);
  const [items, setItems] = React.useState<Opt[]>([]);
  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [reference, setReference] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [wh, inv] = await Promise.all([
          supabase.from("warehouses").select("id,name").order("name").limit(300),
          supabase.from("inventory_items").select("id,name,sku").order("name").limit(500),
        ]);
        if (cancelled) return;
        setWarehouses((wh.data ?? []).map((r: any) => ({ id: r.id, label: r.name })));
        setItems((inv.data ?? []).map((r: any) => ({ id: r.id, label: `${r.name} (${r.sku})` })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !itemId || !qty.trim()) {
      setError("From, to, item, and quantity are required.");
      return;
    }
    if (fromId === toId) {
      setError("Choose different warehouses.");
      return;
    }
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setError("Invalid quantity.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: movErr } = await supabase.from("inventory_movements").insert({
        inventory_item_id: itemId,
        warehouse_from: fromId,
        warehouse_to: toId,
        quantity: q,
        movement_type: "transfer",
        reference: reference.trim() || null,
        created_by: user?.id ?? null,
      } as any);
      if (movErr) throw movErr;

      const pull = async (wh: string) => {
        const { data: row } = await supabase
          .from("warehouse_stock")
          .select("id,quantity")
          .eq("warehouse_id", wh)
          .eq("inventory_item_id", itemId)
          .maybeSingle();
        return row as { id: string; quantity: number } | null;
      };

      const src = await pull(fromId);
      if (!src || Number(src.quantity) < q) throw new Error("Insufficient stock at source warehouse.");
      await supabase
        .from("warehouse_stock")
        .update({ quantity: Number(src.quantity) - q })
        .eq("id", src.id);

      const dst = await pull(toId);
      if (dst?.id) {
        await supabase.from("warehouse_stock").update({ quantity: Number(dst.quantity) + q }).eq("id", dst.id);
      } else {
        await supabase.from("warehouse_stock").insert({
          warehouse_id: toId,
          inventory_item_id: itemId,
          quantity: q,
        } as any);
      }

      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "INVENTORY_TRANSFER",
        table_name: "inventory_movements",
        new_values: { from: fromId, to: toId, quantity: q },
      } as any);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

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
        Item *
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
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="block text-slate-300">
        Reference
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Posting…" : "Execute transfer"}
        </button>
      </div>
    </form>
  );
}
