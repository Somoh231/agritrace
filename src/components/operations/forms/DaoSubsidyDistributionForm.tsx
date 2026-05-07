"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistSubsidyDeliveryPayload } from "@/lib/dao/dao-workflow-writers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Opt = { id: string; label: string };

export default function DaoSubsidyDistributionForm({
  countyHint,
  districtHint,
  readOnly,
  onSuccess,
  onCancel,
  daoWorkflow,
}: {
  countyHint?: string | null;
  districtHint?: string | null;
  readOnly?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  daoWorkflow?: DaoWorkflowFormBindings;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warehouses, setWarehouses] = React.useState<Opt[]>([]);
  const [items, setItems] = React.useState<Opt[]>([]);
  const [farmerId, setFarmerId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [quantitySeeds, setQuantitySeeds] = React.useState("");
  const [quantityFertilizer, setQuantityFertilizer] = React.useState("");
  const [quantityTools, setQuantityTools] = React.useState("");
  const [evidenceRef, setEvidenceRef] = React.useState("");
  const [verificationNote, setVerificationNote] = React.useState("");

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
        setWarehouses((wh.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), label: String(r.name) })));
        setItems((inv.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), label: `${r.name} (${r.sku})` })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const queueSnapshot = (): Record<string, unknown> => {
    const qSeed = Number(quantitySeeds);
    return {
      farmer_id: farmerId.trim(),
      warehouse_id: warehouseId,
      inventory_item_id: itemId,
      quantity: Number.isFinite(qSeed) ? qSeed : quantitySeeds,
      channel: `dao_subsidy:${districtHint ?? countyHint ?? "national"}`,
      quantity_fertilizer: quantityFertilizer.trim() ? Number(quantityFertilizer) : null,
      quantity_tools: quantityTools.trim() ? Number(quantityTools) : null,
      evidence_ref: evidenceRef.trim() || null,
      verification_note: verificationNote.trim() || null,
      queued_at: new Date().toISOString(),
    };
  };

  const validate = () => {
    if (!farmerId.trim() || !warehouseId || !itemId || !quantitySeeds.trim()) {
      setError("Farmer ID, warehouse, primary input SKU, and seed quantity are required.");
      return false;
    }
    const qSeed = Number(quantitySeeds);
    if (!Number.isFinite(qSeed) || qSeed <= 0) {
      setError("Seed quantity must be a positive number.");
      return false;
    }
    return true;
  };

  const saveDraftLocal = async () => {
    setError(null);
    if (daoWorkflow?.enabled && daoWorkflow.saveDraft) await daoWorkflow.saveDraft(queueSnapshot());
  };

  const syncLater = async () => {
    setError(null);
    if (!validate()) return;
    if (!daoWorkflow?.enabled) return;
    await daoWorkflow.queuePending(queueSnapshot());
    onSuccess();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const snap = queueSnapshot();
      const res = await persistSubsidyDeliveryPayload(snap);
      if (!res.ok) {
        setError(`${res.error} — saved to DAO offline queue.`);
        if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap, res.error);
      } else {
        if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ farmer_id: farmerId.trim(), warehouse_id: warehouseId });
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-400">
        Operational subsidy ledger posts to <span className="font-mono text-slate-200">distribution_logs</span> with ministry audit trail.
        {countyHint ? (
          <span className="block mt-1">
            County scope: <span className="text-emerald-200/90">{countyHint}</span>
            {districtHint ? (
              <>
                {" "}
                · District: <span className="text-emerald-200/90">{districtHint}</span>
              </>
            ) : null}
          </span>
        ) : null}
      </div>

      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

      <label className="block text-slate-300">
        Farmer UUID *
        <input
          required
          disabled={readOnly}
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
          placeholder="farmer row id from registry"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[12px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Warehouse source *
        <select
          required
          disabled={readOnly}
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
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
        Primary SKU (seeds / packaged inputs) *
        <select
          required
          disabled={readOnly}
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        >
          <option value="">Select…</option>
          {items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Seeds qty *
          <input
            required
            disabled={readOnly}
            type="number"
            step="0.01"
            value={quantitySeeds}
            onChange={(e) => setQuantitySeeds(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          Fertilizer qty
          <input
            disabled={readOnly}
            type="number"
            step="0.01"
            value={quantityFertilizer}
            onChange={(e) => setQuantityFertilizer(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Tools / implements (units)
        <input
          disabled={readOnly}
          type="number"
          step="1"
          value={quantityTools}
          onChange={(e) => setQuantityTools(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Delivery evidence reference
        <input
          disabled={readOnly}
          value={evidenceRef}
          onChange={(e) => setEvidenceRef(e.target.value)}
          placeholder="GRN / voucher / photo bundle id"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Farmer verification notes
        <textarea
          disabled={readOnly}
          value={verificationNote}
          onChange={(e) => setVerificationNote(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-800">
        {daoWorkflow?.enabled && daoWorkflow.saveDraft && !readOnly ? (
          <button type="button" onClick={() => void saveDraftLocal()} className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-200 hover:bg-slate-900">
            Save draft
          </button>
        ) : null}
        {daoWorkflow?.enabled && !readOnly ? (
          <button type="button" onClick={() => void syncLater()} className="h-10 rounded-lg border border-amber-700/60 px-4 text-[12px] text-amber-100 hover:bg-amber-950/40">
            Queue sync
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Close
        </button>
        {!readOnly ? (
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Posting…" : "Post distribution"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
