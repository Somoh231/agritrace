"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DRAFT_KEY = "agritrace-draft-register-farmer";

export default function RegisterFarmerForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    full_name: "",
    county: "",
    district: "",
    village: "",
    phone: "",
    national_id: "",
    main_crop: "rice",
    acreage_hectares: "",
    gender: "",
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!form.full_name.trim() || !form.county.trim()) {
      setError("Full name and county are required.");
      setSaving(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const acreage = form.acreage_hectares.trim() ? Number(form.acreage_hectares) : null;
      const { error: insErr } = await supabase.from("farmers").insert({
        full_name: form.full_name.trim(),
        county: form.county.trim(),
        district: form.district.trim() || null,
        village: form.village.trim() || null,
        phone: form.phone.trim() || null,
        national_id: form.national_id.trim() || null,
        main_crop: form.main_crop.trim() || "rice",
        acreage_hectares: acreage != null && Number.isFinite(acreage) ? acreage : null,
        gender: form.gender.trim() || null,
        registered_by: user?.id ?? null,
      } as any);
      if (insErr) throw insErr;

      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "FARMER_REGISTERED",
        table_name: "farmers",
        new_values: { full_name: form.full_name, county: form.county },
      } as any);

      localStorage.removeItem(DRAFT_KEY);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-[13px]">
      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

      <label className="block text-slate-300">
        Full name *
        <input
          required
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          County *
          <input
            required
            value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block text-slate-300">
          District
          <input
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Village
        <input
          value={form.village}
          onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block text-slate-300">
          National ID
          <input
            value={form.national_id}
            onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-slate-300">
          Main crop
          <input
            value={form.main_crop}
            onChange={(e) => setForm((f) => ({ ...f, main_crop: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block text-slate-300">
          Acreage (ha)
          <input
            type="number"
            step="0.01"
            value={form.acreage_hectares}
            onChange={(e) => setForm((f) => ({ ...f, acreage_hectares: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
          />
        </label>
      </div>

      <label className="block text-slate-300">
        Gender
        <select
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        >
          <option value="">—</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={saveDraft}
          className="h-10 px-4 rounded-lg border border-slate-600 text-[12px] text-slate-200 hover:bg-slate-900"
        >
          Save draft
        </button>
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="ml-auto h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Register farmer"}
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Timestamp and officer attribution are captured from your authenticated session on submit.
      </p>
    </form>
  );
}
