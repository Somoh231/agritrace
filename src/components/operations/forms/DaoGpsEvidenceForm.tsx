"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistGpsEvidencePayload } from "@/lib/dao/dao-workflow-writers";

export default function DaoGpsEvidenceForm({
  onSuccess,
  onCancel,
  readOnly,
  daoWorkflow,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  daoWorkflow?: DaoWorkflowFormBindings;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locBusy, setLocBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    farmer_id: "",
    latitude: "",
    longitude: "",
    accuracy_m: "",
    evidence_ref: "",
    plot_notes: "",
  });

  const snapshot = (): Record<string, unknown> => ({
    farmer_id: form.farmer_id.trim(),
    latitude: form.latitude.trim() ? Number(form.latitude) : form.latitude,
    longitude: form.longitude.trim() ? Number(form.longitude) : form.longitude,
    accuracy_m: form.accuracy_m.trim() ? Number(form.accuracy_m) : null,
    evidence_ref: form.evidence_ref.trim() || null,
    plot_notes: form.plot_notes.trim() || null,
    queued_at: new Date().toISOString(),
  });

  const validate = () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.farmer_id.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Farmer UUID and valid GPS latitude / longitude are required.");
      return false;
    }
    return true;
  };

  const useDeviceGps = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available on this device.");
      return;
    }
    setLocBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
          accuracy_m: pos.coords.accuracy != null ? String(Math.round(pos.coords.accuracy)) : f.accuracy_m,
        }));
        setLocBusy(false);
      },
      () => {
        setError("Could not read GPS — enter coordinates manually.");
        setLocBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
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
    const res = await persistGpsEvidencePayload(snap);
    setSaving(false);
    if (res.ok) {
      if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ farmer_id: snap.farmer_id });
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
        GPS capture logs to <span className="font-mono text-slate-200">geo_locations</span> for plot verification and traceability.
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
          Latitude *
          <input
            required
            disabled={disabled}
            value={form.latitude}
            onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
            className="mt-1 block w-full av-input font-mono text-[12px] disabled:opacity-50"
          />
        </label>
        <label className="ent-label block">
          Longitude *
          <input
            required
            disabled={disabled}
            value={form.longitude}
            onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
            className="mt-1 block w-full av-input font-mono text-[12px] disabled:opacity-50"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || locBusy}
          onClick={useDeviceGps}
          className="h-9 rounded-lg border border-sky-700/50 px-3 text-[11px] text-sky-100 hover:bg-sky-950/40 disabled:opacity-50"
        >
          {locBusy ? "Locating…" : "Use device GPS"}
        </button>
      </div>

      <label className="ent-label block">
        Accuracy (m)
        <input
          disabled={disabled}
          type="number"
          step="0.1"
          value={form.accuracy_m}
          onChange={(e) => setForm((f) => ({ ...f, accuracy_m: e.target.value }))}
          className="mt-1 block w-full av-input disabled:opacity-50"
        />
      </label>

      <label className="ent-label block">
        Evidence reference
        <input
          disabled={disabled}
          value={form.evidence_ref}
          onChange={(e) => setForm((f) => ({ ...f, evidence_ref: e.target.value }))}
          placeholder="Photo id / DAO voucher"
          className="mt-1 block w-full av-input disabled:opacity-50"
        />
      </label>

      <label className="ent-label block">
        Plot notes
        <textarea
          disabled={disabled}
          value={form.plot_notes}
          onChange={(e) => setForm((f) => ({ ...f, plot_notes: e.target.value }))}
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
            {saving ? "Saving…" : "Save GPS point"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
