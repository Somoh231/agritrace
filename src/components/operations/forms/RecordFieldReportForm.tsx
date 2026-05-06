"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecordFieldReportForm({
  onSuccess,
  onCancel,
  category,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  category: "pest" | "extension";
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [county, setCounty] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [channel, setChannel] = React.useState("offline");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!county.trim() || !summary.trim()) {
      setError("County and summary required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const prefix = category === "pest" ? "[PEST/DISEASE] " : "[EXTENSION] ";
      const { error: insErr } = await supabase.from("field_reports").insert({
        county: county.trim(),
        officer_profile_id: user?.id ?? null,
        summary: prefix + summary.trim(),
        channel,
        payload: { category },
      } as any);
      if (insErr) throw insErr;
      await supabase.from("audit_log").insert({
        user_id: user?.id ?? null,
        action: "FIELD_REPORT_SUBMITTED",
        table_name: "field_reports",
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
        County *
        <input
          required
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="block text-slate-300">
        Summary *
        <textarea
          required
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="block text-slate-300">
        Channel
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-600"
        >
          <option value="offline">Offline</option>
          <option value="online">Online</option>
          <option value="call_center">Call center</option>
          <option value="sms">SMS</option>
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
          {saving ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
