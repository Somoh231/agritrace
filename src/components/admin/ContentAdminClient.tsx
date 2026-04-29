"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";

export default function ContentAdminClient() {
  const [json, setJson] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load content.");
      setJson(JSON.stringify(data.content, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const parsed = JSON.parse(json);
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setOk("Content updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-[13px] text-gray-600">Loading content…</div>;
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h1 className="font-display text-[22px] text-gray-900">Public content editor</h1>
        <p className="mt-1 text-[12px] text-gray-600">
          Edit homepage, platform page, and contact details in one place.
        </p>
      </div>

      {error ? <AlertBanner severity="danger" message={error} /> : null}
      {ok ? <AlertBanner severity="info" message={ok} /> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full min-h-[520px] rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-[12px] text-gray-800"
          spellCheck={false}
        />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={save} disabled={saving} className="av-btn-primary">
            {saving ? "Saving..." : "Save content"}
          </button>
          <button type="button" onClick={load} className="av-btn-outline">
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}

