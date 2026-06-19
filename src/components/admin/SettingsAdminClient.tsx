"use client";

import * as React from "react";
import { Loader2, RefreshCcw, Upload } from "lucide-react";

import AdminPageShell, { ADMIN_CARD } from "@/components/admin/AdminPageShell";
import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";

type SettingsRow = {
  id: string;
  app_name: string;
  country: string;
  theme: "light" | "dark";
  logo_url: string | null;
  notifications_enabled: boolean;
  updated_at: string;
};

export default function SettingsAdminClient() {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<SettingsRow | null>(null);

  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed to load settings (${res.status}).`);
      setSettings(j.settings ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async (patch: Partial<SettingsRow>) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Save failed (${res.status}).`);
      setSettings(j.settings ?? null);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminPageShell title="Settings" description="Basic branding + pilot preferences. (Super admin only)">
        <div className={`${ADMIN_CARD} p-5 text-[12px] text-gray-600 flex items-center gap-2`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Settings" description="Basic branding + pilot preferences. (Super admin only)">
        <AlertBanner severity="danger" message={error} actions={[{ label: "Retry", onClick: load }]} />
      </AdminPageShell>
    );
  }

  if (!settings) {
    return (
      <AdminPageShell title="Settings" description="Basic branding + pilot preferences. (Super admin only)">
        <AlertBanner
          severity="warning"
          message="No settings row found. Run schema.enterprise.sql to create app_settings."
          actions={[{ label: "Go to setup", onClick: () => (window.location.href = "/setup") }]}
        />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Settings"
      description="Basic branding + pilot preferences. (Super admin only)"
      actions={
        <button
          type="button"
          onClick={load}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      <div className={`${ADMIN_CARD} p-5 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="App name">
            <input
              value={settings.app_name}
              onChange={(e) => setSettings((s) => (s ? { ...s, app_name: e.target.value } : s))}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
            />
          </Field>
          <Field label="Country">
            <input
              value={settings.country}
              onChange={(e) => setSettings((s) => (s ? { ...s, country: e.target.value } : s))}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
            />
          </Field>
          <Field label="Theme">
            <select
              value={settings.theme}
              onChange={(e) => setSettings((s) => (s ? { ...s, theme: e.target.value as any } : s))}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </Field>
          <Field label="Notifications">
            <label className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px] flex items-center justify-between">
              <span className="text-gray-700">Enabled</span>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, notifications_enabled: e.target.checked } : s))
                }
              />
            </label>
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="font-display text-[14px] text-gray-900">Logo</div>
          <div className="mt-1 text-[12px] text-gray-600">
            Provide a URL (recommended), or upload an image to generate a temporary data URL for demos.
          </div>
          <div className="mt-3 flex flex-col md:flex-row gap-2">
            <input
              value={settings.logo_url ?? ""}
              onChange={(e) => setSettings((s) => (s ? { ...s, logo_url: e.target.value || null } : s))}
              placeholder="https://…"
              className="h-9 flex-1 rounded-md border border-gray-200 bg-white px-3 text-[12px]"
            />
            <label className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const buf = await f.arrayBuffer();
                  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                  const dataUrl = `data:${f.type};base64,${b64}`;
                  setSettings((s) => (s ? { ...s, logo_url: dataUrl } : s));
                  toast.info("Logo loaded", "Remember to replace with a hosted URL for production.");
                }}
              />
            </label>
          </div>
          {settings.logo_url ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-gray-200 bg-white overflow-hidden grid place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.logo_url} alt="Logo preview" className="h-full w-full object-cover" />
              </div>
              <div className="text-[11px] text-gray-500 truncate max-w-[520px]">{settings.logo_url}</div>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-gray-500">No logo set.</div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              save({
                app_name: settings.app_name.trim(),
                country: settings.country.trim(),
                theme: settings.theme,
                notifications_enabled: settings.notifications_enabled,
                logo_url: settings.logo_url,
              })
            }
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save settings"}
          </button>
        </div>

        <div className="text-[11px] text-gray-500 font-mono">Last updated: {settings.updated_at}</div>
      </div>
    </AdminPageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

