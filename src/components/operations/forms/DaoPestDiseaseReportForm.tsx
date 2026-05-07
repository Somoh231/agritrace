"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistPestDiseasePayload } from "@/lib/dao/dao-workflow-writers";

export default function DaoPestDiseaseReportForm({
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
    county: countyDefault ?? "",
    district: districtDefault ?? "",
    pest_type: "",
    severity: "moderate",
    crop: "rice",
    affected_area_ha: "",
    farmer_id: "",
    evidence_ref: "",
    notes: "",
    summary: "",
  });

  React.useEffect(() => {
    setForm((f) => ({
      ...f,
      county: countyDefault ?? f.county,
      district: districtDefault ?? f.district,
    }));
  }, [countyDefault, districtDefault]);

  const snapshot = (): Record<string, unknown> => ({
    county: form.county.trim(),
    district: form.district.trim() || null,
    pest_type: form.pest_type.trim(),
    severity: form.severity.trim(),
    crop: form.crop.trim() || null,
    affected_area_ha: form.affected_area_ha.trim() ? Number(form.affected_area_ha) : null,
    farmer_id: form.farmer_id.trim() || null,
    evidence_ref: form.evidence_ref.trim() || null,
    notes: form.notes.trim() || null,
    summary: form.summary.trim() || null,
    queued_at: new Date().toISOString(),
  });

  const validateRequired = () => {
    if (!form.county.trim() || !form.pest_type.trim() || !form.severity.trim()) {
      setError("County, pest or disease type, and severity are required.");
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
    if (!validateRequired()) return;
    if (!daoWorkflow?.enabled) return;
    await daoWorkflow.queuePending(snapshot());
    onSuccess();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validateRequired()) return;
    setSaving(true);
    setError(null);
    const snap = snapshot();
    const res = await persistPestDiseasePayload(snap);
    setSaving(false);
    if (res.ok) {
      if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ county: snap.county, pest_type: snap.pest_type });
      onSuccess();
    } else {
      setError(`${res.error} — saved to DAO offline queue.`);
      if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap as Record<string, unknown>, res.error);
    }
  };

  const disabled = Boolean(readOnly);

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      <p className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-400">
        DAO pest and disease capture writes to <span className="font-mono text-slate-200">field_reports</span> with a structured payload and audit trail when online.
      </p>
      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          County *
          <input
            required
            disabled={disabled}
            value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          District
          <input
            disabled={disabled}
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Pest or disease *
        <input
          required
          disabled={disabled}
          value={form.pest_type}
          onChange={(e) => setForm((f) => ({ ...f, pest_type: e.target.value }))}
          placeholder="e.g. Rice blast, stem borer"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Severity *
          <select
            required
            disabled={disabled}
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="severe">Severe</option>
          </select>
        </label>
        <label className="block text-slate-300">
          Crop
          <input
            disabled={disabled}
            value={form.crop}
            onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Affected area (ha)
        <input
          disabled={disabled}
          type="number"
          step="0.01"
          value={form.affected_area_ha}
          onChange={(e) => setForm((f) => ({ ...f, affected_area_ha: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Farmer UUID (optional)
        <input
          disabled={disabled}
          value={form.farmer_id}
          onChange={(e) => setForm((f) => ({ ...f, farmer_id: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Evidence reference
        <input
          disabled={disabled}
          value={form.evidence_ref}
          onChange={(e) => setForm((f) => ({ ...f, evidence_ref: e.target.value }))}
          placeholder="Photo bundle / trap id"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Summary override (optional)
        <input
          disabled={disabled}
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          placeholder="Leave blank to auto-build from pest + severity"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Notes
        <textarea
          disabled={disabled}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
        {daoWorkflow?.enabled && daoWorkflow.saveDraft && !disabled ? (
          <button type="button" onClick={() => void saveDraftLocal()} className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-200 hover:bg-slate-900">
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
            {saving ? "Submitting…" : "Submit report"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
