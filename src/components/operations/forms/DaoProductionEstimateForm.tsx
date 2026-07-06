"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistProductionEstimatePayload } from "@/lib/dao/dao-workflow-writers";

export default function DaoProductionEstimateForm({
  onSuccess,
  onCancel,
  readOnly,
  countyDefault,
  districtDefault,
  daoWorkflow,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  countyDefault?: string | null;
  districtDefault?: string | null;
  daoWorkflow?: DaoWorkflowFormBindings;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    farmer_id: "",
    season: "2026-A",
    expected_yield_kg: "",
    county: countyDefault ?? "",
    district: districtDefault ?? "",
    notes: "",
  });

  React.useEffect(() => {
    setForm((f) => ({
      ...f,
      county: countyDefault ?? f.county,
      district: districtDefault ?? f.district,
    }));
  }, [countyDefault, districtDefault]);

  const snapshot = (): Record<string, unknown> => {
    const expected = form.expected_yield_kg.trim() ? Number(form.expected_yield_kg) : NaN;
    return {
      farmer_id: form.farmer_id.trim(),
      season: form.season.trim(),
      expected_yield_kg: Number.isFinite(expected) ? expected : form.expected_yield_kg,
      county: form.county.trim() || null,
      district: form.district.trim() || null,
      notes: form.notes.trim() || null,
      queued_at: new Date().toISOString(),
    };
  };

  const validate = () => {
    const expected = form.expected_yield_kg.trim() ? Number(form.expected_yield_kg) : NaN;
    if (!form.farmer_id.trim() || !form.season.trim() || !Number.isFinite(expected) || expected <= 0) {
      setError("Farmer UUID, season, and expected yield (kg) are required.");
      return false;
    }
    return true;
  };

  const saveDraftLocal = async () => {
    setError(null);
    if (!daoWorkflow?.enabled || !daoWorkflow.saveDraft) return;
    await daoWorkflow.saveDraft(snapshot());
  };

  const syncLater = async () => {
    setError(null);
    if (!validate()) return;
    if (!daoWorkflow?.enabled) return;
    await daoWorkflow.queuePending(snapshot());
    onSuccess();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    setSaving(true);
    setError(null);
    const snap = snapshot();
    const res = await persistProductionEstimatePayload(snap);
    setSaving(false);
    if (res.ok) {
      if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ farmer_id: snap.farmer_id, season: snap.season });
      onSuccess();
    } else {
      setError(`${res.error} — saved to DAO offline queue.`);
      if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap as Record<string, unknown>, res.error);
    }
  };

  const disabled = Boolean(readOnly);

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
        Production estimates post to <span className="font-mono text-slate-200">rice_production_records</span> for DAO seasonal tracking.
      </p>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-900">{error}</div> : null}

      <label className="ent-label block">
        Farmer UUID *
        <input
          required
          disabled={disabled}
          value={form.farmer_id}
          onChange={(e) => setForm((f) => ({ ...f, farmer_id: e.target.value }))}
          className="mt-1 block w-full av-input font-mono text-[11px] disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="ent-label block">
          Season *
          <input
            required
            disabled={disabled}
            value={form.season}
            onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
            placeholder="2026-A"
            className="mt-1 block w-full av-input disabled:opacity-50"
          />
        </label>
        <label className="ent-label block">
          Expected yield (kg) *
          <input
            required
            disabled={disabled}
            type="number"
            step="1"
            min="1"
            value={form.expected_yield_kg}
            onChange={(e) => setForm((f) => ({ ...f, expected_yield_kg: e.target.value }))}
            className="mt-1 block w-full av-input disabled:opacity-50"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="ent-label block">
          County
          <input
            disabled={disabled}
            value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
            className="mt-1 block w-full av-input disabled:opacity-50"
          />
        </label>
        <label className="ent-label block">
          District
          <input
            disabled={disabled}
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            className="mt-1 block w-full av-input disabled:opacity-50"
          />
        </label>
      </div>

      <label className="ent-label block">
        Notes
        <textarea
          disabled={disabled}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="mt-1 block w-full av-input disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {daoWorkflow?.enabled && daoWorkflow.saveDraft && !disabled ? (
          <button type="button" onClick={() => void saveDraftLocal()} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
            Save draft
          </button>
        ) : null}
        {daoWorkflow?.enabled && !disabled ? (
          <button type="button" onClick={() => void syncLater()} className="h-10 rounded-lg border border-amber-700/60 px-4 text-[12px] text-amber-100 hover:bg-amber-950/40">
            Queue sync
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        {!disabled ? (
          <button type="submit" disabled={saving} className="ml-auto h-10 rounded-lg bg-emerald-700 px-5 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save estimate"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
