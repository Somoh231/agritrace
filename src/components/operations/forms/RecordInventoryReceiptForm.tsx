"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Opt = { id: string; label: string };

export default function RecordInventoryReceiptForm({
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
  const [warehouseId, setWarehouseId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [countyAllocation, setCountyAllocation] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [wh, inv] = await Promise.all([
          supabase.from("warehouses").select("id,name").order("name").limit(200),
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
    if (!warehouseId || !itemId || !qty.trim()) {
      setError("Warehouse, SKU, and quantity are required.");
      return;
    }
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setError("Quantity must be a positive number.");
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
        warehouse_from: null,
        warehouse_to: warehouseId,
        quantity: q,
        movement_type: "receipt",
        reference: reference.trim() || null,
        county_allocation: countyAllocation.trim() || null,
        created_by: user?.id ?? null,
      } as any);
      if (movErr) throw movErr;

      const { data: existing } = await supabase
        .from("warehouse_stock")
        .select("id,quantity")
        .eq("warehouse_id", warehouseId)
        .eq("inventory_item_id", itemId)
        .maybeSingle();

      if (existing?.id) {
        const nextQty = Number(existing.quantity ?? 0) + q;
        const { error: upErr } = await supabase.from("warehouse_stock").update({ quantity: nextQty }).eq("id", existing.id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("warehouse_stock").insert({
          warehouse_id: warehouseId,
          inventory_item_id: itemId,
          quantity: q,
        } as any);
        if (insErr) throw insErr;
      }

      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "INVENTORY_RECEIPT",
        table_name: "inventory_movements",
        new_values: { warehouse_id: warehouseId, inventory_item_id: itemId, quantity: q },
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
        Warehouse *
        <select
          required
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
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
        Inventory item *
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
        Reference / GRN
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="block text-slate-300">
        County allocation label
        <input
          value={countyAllocation}
          onChange={(e) => setCountyAllocation(e.target.value)}
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
          {saving ? "Posting…" : "Post receipt"}
        </button>
      </div>
    </form>
  );
}
