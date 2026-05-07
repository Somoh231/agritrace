"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function composeInspectionNotes(
  farmCondition: string,
  pestIssue: string,
  irrigation: string,
  fertilizerUse: string,
  expectedYield: string,
  photoBundle: string,
  freeNotes: string,
) {
  const lines = [
    farmCondition.trim() ? `Farm condition: ${farmCondition.trim()}` : "",
    pestIssue.trim() ? `Pest / disease: ${pestIssue.trim()}` : "",
    irrigation.trim() ? `Irrigation: ${irrigation.trim()}` : "",
    fertilizerUse.trim() ? `Fertilizer use: ${fertilizerUse.trim()}` : "",
    expectedYield.trim() ? `Expected yield (kg est.): ${expectedYield.trim()}` : "",
    photoBundle.trim() ? `Photo bundle ref: ${photoBundle.trim()}` : "",
    freeNotes.trim() ? `Notes: ${freeNotes.trim()}` : "",
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}

export default function RecordFieldInspectionForm({
  onSuccess,
  onCancel,
  readOnly,
  onQueueForSync,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  onQueueForSync?: (snapshot: Record<string, unknown>) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [farmerId, setFarmerId] = React.useState("");
  const [farmCondition, setFarmCondition] = React.useState("");
  const [pestIssue, setPestIssue] = React.useState("");
  const [irrigation, setIrrigation] = React.useState("");
  const [fertilizerUse, setFertilizerUse] = React.useState("");
  const [expectedYield, setExpectedYield] = React.useState("");
  const [photoBundle, setPhotoBundle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [verification, setVerification] = React.useState("verified");

  const composedNotes = () =>
    composeInspectionNotes(farmCondition, pestIssue, irrigation, fertilizerUse, expectedYield, photoBundle, notes);

  const queueSnapshot = (): Record<string, unknown> => ({
    farmer_id: farmerId.trim(),
    farm_condition: farmCondition,
    pest_issue: pestIssue,
    irrigation,
    fertilizer_use: fertilizerUse,
    expected_yield: expectedYield,
    photo_bundle_id: photoBundle,
    notes_free: notes,
    gps_latitude: lat.trim(),
    gps_longitude: lng.trim(),
    verification_status: verification,
    composed_notes: composedNotes(),
    queued_at: new Date().toISOString(),
  });

  const syncLater = () => {
    setError(null);
    if (!farmerId.trim()) {
      setError("Farmer ID is required before queueing.");
      return;
    }
    onQueueForSync?.(queueSnapshot());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!farmerId.trim()) {
      setError("Farmer ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("farmer_visits").insert({
        farmer_id: farmerId.trim(),
        visited_by: user?.id ?? null,
        notes: composedNotes(),
        gps_latitude: lat.trim() ? Number(lat) : null,
        gps_longitude: lng.trim() ? Number(lng) : null,
        verification_status: verification || null,
      } as Record<string, unknown>);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "FIELD_INSPECTION",
        table_name: "farmer_visits",
        record_id: farmerId,
      } as Record<string, unknown>);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const disabled = Boolean(readOnly);

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}
      <label className="block text-slate-300">
        Farmer UUID *
        <input
          required
          disabled={disabled}
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
          placeholder="Paste farmer id from registry"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Farm condition
        <input
          disabled={disabled}
          value={farmCondition}
          onChange={(e) => setFarmCondition(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Pest / disease issue
        <input
          disabled={disabled}
          value={pestIssue}
          onChange={(e) => setPestIssue(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Irrigation
          <input
            disabled={disabled}
            value={irrigation}
            onChange={(e) => setIrrigation(e.target.value)}
            placeholder="Rain-fed / supplemental"
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          Fertilizer use
          <input
            disabled={disabled}
            value={fertilizerUse}
            onChange={(e) => setFertilizerUse(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Expected yield (kg, estimate)
        <input
          disabled={disabled}
          type="number"
          step="0.01"
          value={expectedYield}
          onChange={(e) => setExpectedYield(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Photo uploads / evidence bundle id
        <input
          disabled={disabled}
          value={photoBundle}
          onChange={(e) => setPhotoBundle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <label className="block text-slate-300">
        Additional notes
        <textarea
          disabled={disabled}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          GPS latitude
          <input
            disabled={disabled}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
        <label className="block text-slate-300">
          GPS longitude
          <input
            disabled={disabled}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Verification outcome
        <select
          disabled={disabled}
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50"
        >
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </label>

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-800">
        {onQueueForSync && !disabled ? (
          <button type="button" onClick={syncLater} className="h-10 px-4 rounded-lg border border-amber-700/60 text-[12px] text-amber-100 hover:bg-amber-950/40">
            Sync later
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        {!disabled ? (
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit inspection"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
