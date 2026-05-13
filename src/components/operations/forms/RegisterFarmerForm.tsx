"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistRegisterFarmerPayload } from "@/lib/dao/dao-workflow-writers";

import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import type { OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";

const DRAFT_KEY = "agritrace-draft-register-farmer";

export default function RegisterFarmerForm({
  onSuccess,
  onCancel,
  countyDefault,
  districtDefault,
  readOnly,
  onQueueForSync,
  daoWorkflow,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  countyDefault?: string;
  districtDefault?: string;
  readOnly?: boolean;
  /** @deprecated Prefer `daoWorkflow.queuePending` (IndexedDB DAO queue). */
  onQueueForSync?: (snapshot: Record<string, unknown>) => void;
  daoWorkflow?: DaoWorkflowFormBindings;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    full_name: "",
    county: countyDefault ?? "",
    district: districtDefault ?? "",
    village: "",
    phone: "",
    national_id: "",
    main_crop: "rice",
    acreage_hectares: "",
    gender: "",
    cooperative: "",
    latitude: "",
    longitude: "",
    profile_photo_url: "",
    notes: "",
  });
  const [operationalBoundary, setOperationalBoundary] = React.useState<OperationalFarmBoundary | null>(null);

  const seededRef = React.useRef(false);
  React.useEffect(() => {
    if (seededRef.current) return;
    if (countyDefault || districtDefault) {
      setForm((f) => ({
        ...f,
        county: countyDefault ?? f.county,
        district: districtDefault ?? f.district,
      }));
      seededRef.current = true;
    }
  }, [countyDefault, districtDefault]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  const buildNotes = () => {
    const parts: string[] = [];
    if (form.cooperative.trim()) parts.push(`Cooperative: ${form.cooperative.trim()}`);
    if (form.profile_photo_url.trim()) parts.push(`Profile photo ref: ${form.profile_photo_url.trim()}`);
    if (form.notes.trim()) parts.push(form.notes.trim());
    return parts.length ? parts.join("\n") : null;
  };

  const queueSnapshot = (): Record<string, unknown> => ({
    ...form,
    notes_composed: buildNotes(),
    queued_at: new Date().toISOString(),
    operational_boundary: operationalBoundary,
  });

  const saveDraft = async () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
    if (daoWorkflow?.enabled && daoWorkflow.saveDraft) {
      await daoWorkflow.saveDraft(queueSnapshot());
    }
  };

  const syncLater = async () => {
    setError(null);
    if (!form.full_name.trim() || !form.county.trim()) {
      setError("Full name and county are required before queueing.");
      return;
    }
    const snap = queueSnapshot();
    if (daoWorkflow?.enabled) {
      await daoWorkflow.queuePending(snap);
      onSuccess();
    } else {
      onQueueForSync?.(snap);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError(null);
    if (!form.full_name.trim() || !form.county.trim()) {
      setError("Full name and county are required.");
      setSaving(false);
      return;
    }
    try {
      const snap = queueSnapshot();
      const res = await persistRegisterFarmerPayload(snap);
      if (!res.ok) {
        setError(`${res.error} — saved to DAO offline queue.`);
        if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap, res.error);
      } else {
        if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ full_name: form.full_name.trim(), county: form.county.trim() });
        localStorage.removeItem(DRAFT_KEY);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const disabled = Boolean(readOnly);

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

      <label className="block text-slate-300">
        Farmer name *
        <input
          required
          disabled={disabled}
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Gender
          <select
            disabled={disabled}
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          >
            <option value="">—</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </label>
        <label className="block text-slate-300">
          Phone
          <input
            disabled={disabled}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

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
        Village
        <input
          disabled={disabled}
          value={form.village}
          onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Cooperative / farmer group
        <input
          disabled={disabled}
          value={form.cooperative}
          onChange={(e) => setForm((f) => ({ ...f, cooperative: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Main crop
          <input
            disabled={disabled}
            value={form.main_crop}
            onChange={(e) => setForm((f) => ({ ...f, main_crop: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          Acreage (ha)
          <input
            disabled={disabled}
            type="number"
            step="0.01"
            value={form.acreage_hectares}
            onChange={(e) => setForm((f) => ({ ...f, acreage_hectares: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
        <FarmBoundaryCapture
          disabled={disabled}
          readOnly={disabled}
          value={operationalBoundary}
          onChange={setOperationalBoundary}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          GPS latitude
          <input
            disabled={disabled}
            value={form.latitude}
            onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
            placeholder="e.g. 6.3156"
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[12px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          GPS longitude
          <input
            disabled={disabled}
            value={form.longitude}
            onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
            placeholder="e.g. -10.8074"
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[12px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        National ID
        <input
          disabled={disabled}
          value={form.national_id}
          onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Profile photo (URL or ministry media id)
        <input
          disabled={disabled}
          value={form.profile_photo_url}
          onChange={(e) => setForm((f) => ({ ...f, profile_photo_url: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Notes
        <textarea
          disabled={disabled}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void saveDraft()}
          className="h-10 px-4 rounded-lg border border-slate-600 text-[12px] text-slate-200 hover:bg-slate-900 disabled:opacity-50"
        >
          Save draft
        </button>
        {(daoWorkflow?.enabled || onQueueForSync) && !disabled ? (
          <button type="button" onClick={() => void syncLater()} className="h-10 px-4 rounded-lg border border-amber-700/60 text-[12px] text-amber-100 hover:bg-amber-950/40">
            Queue sync
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        {!disabled ? (
          <button
            type="submit"
            disabled={saving}
            className="ml-auto h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        ) : null}
      </div>
      <p className="text-[11px] text-slate-500">
        Timestamp and officer attribution are recorded from your authenticated session on submit.
      </p>
    </form>
  );
}
