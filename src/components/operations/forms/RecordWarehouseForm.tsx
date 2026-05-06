"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecordWarehouseForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [threshold, setThreshold] = React.useState("15");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !county.trim()) {
      setError("Name and county required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("warehouses").insert({
        name: name.trim(),
        county: county.trim(),
        latitude: lat.trim() ? Number(lat) : null,
        longitude: lng.trim() ? Number(lng) : null,
        low_stock_threshold_pct: threshold.trim() ? Number(threshold) : 15,
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "WAREHOUSE_CREATED",
        table_name: "warehouses",
        new_values: { name, county },
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
        Warehouse name *
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="block text-slate-300">
        County *
        <input
          required
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Latitude
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block text-slate-300">
          Longitude
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
      </div>
      <label className="block text-slate-300">
        Low-stock threshold (%)
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
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
          {saving ? "Saving…" : "Create warehouse"}
        </button>
      </div>
    </form>
  );
}
