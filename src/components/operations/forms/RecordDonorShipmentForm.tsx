"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Opt = { id: string; label: string };

export default function RecordDonorShipmentForm({
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
  const [donorName, setDonorName] = React.useState("");
  const [programmeCode, setProgrammeCode] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [receivedAt, setReceivedAt] = React.useState(() => new Date().toISOString().slice(0, 10));

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
    if (!donorName.trim() || !itemId || !qty.trim() || !receivedAt) {
      setError("Donor, item, quantity, and receipt date are required.");
      return;
    }
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setError("Quantity must be positive.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("donor_shipments").insert({
        donor_name: donorName.trim(),
        inventory_item_id: itemId,
        quantity: q,
        warehouse_id: warehouseId || null,
        received_at: receivedAt,
        programme_code: programmeCode.trim() || null,
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "DONOR_SHIPMENT_RECORDED",
        table_name: "donor_shipments",
        new_values: { donor_name: donorName, quantity: q },
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
        Donor name *
        <input
          required
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="block text-slate-300">
        Programme code
        <input
          value={programmeCode}
          onChange={(e) => setProgrammeCode(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="block text-slate-300">
        Warehouse (optional)
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        >
          <option value="">—</option>
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
        Received date *
        <input
          type="date"
          required
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
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
          {saving ? "Saving…" : "Record shipment"}
        </button>
      </div>
    </form>
  );
}
