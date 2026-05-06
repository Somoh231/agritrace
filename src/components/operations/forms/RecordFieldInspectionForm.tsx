"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecordFieldInspectionForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [farmerId, setFarmerId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [verification, setVerification] = React.useState("verified");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        notes: notes.trim() || null,
        gps_latitude: lat.trim() ? Number(lat) : null,
        gps_longitude: lng.trim() ? Number(lng) : null,
        verification_status: verification || null,
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "FIELD_INSPECTION",
        table_name: "farmer_visits",
        record_id: farmerId,
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
        Farmer UUID *
        <input
          required
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
          placeholder="Paste farmer id from registry grid export"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="block text-slate-300">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          GPS latitude
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block text-slate-300">
          GPS longitude
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
      </div>
      <label className="block text-slate-300">
        Verification outcome
        <select
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        >
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
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
          {saving ? "Saving…" : "Save inspection"}
        </button>
      </div>
    </form>
  );
}
