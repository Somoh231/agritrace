"use client";

import * as React from "react";

import { AlertCard } from "@/components/enterprise";
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
    <form onSubmit={submit} className="space-y-5">
      {error ?
        <AlertCard tone="danger" title="Could not save warehouse">
          {error}
        </AlertCard>
      : null}

      <div>
        <label htmlFor="wh-name" className="ent-label">
          Warehouse name *
        </label>
        <input
          id="wh-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="av-input mt-1.5"
          placeholder="e.g. Bong Central Storage"
        />
      </div>

      <div>
        <label htmlFor="wh-county" className="ent-label">
          County *
        </label>
        <input
          id="wh-county"
          required
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="av-input mt-1.5"
          placeholder="County name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="wh-lat" className="ent-label">
            Latitude
          </label>
          <input id="wh-lat" value={lat} onChange={(e) => setLat(e.target.value)} className="av-input mt-1.5" placeholder="6.3000" />
        </div>
        <div>
          <label htmlFor="wh-lng" className="ent-label">
            Longitude
          </label>
          <input id="wh-lng" value={lng} onChange={(e) => setLng(e.target.value)} className="av-input mt-1.5" placeholder="-10.8000" />
        </div>
      </div>

      <div>
        <label htmlFor="wh-threshold" className="ent-label">
          Low-stock threshold (%)
        </label>
        <input
          id="wh-threshold"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="av-input mt-1.5"
        />
        <p className="mt-1.5 text-[12px] text-slate-500">Alert when stock falls below this percentage of capacity.</p>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-emerald h-10 rounded-lg px-5 text-[13px] disabled:opacity-50">
          {saving ? "Saving…" : "Create warehouse"}
        </button>
      </div>
    </form>
  );
}
