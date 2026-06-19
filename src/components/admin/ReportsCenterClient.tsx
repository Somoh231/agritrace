"use client";

import * as React from "react";
import { Download, Loader2, Save } from "lucide-react";

import AdminPageShell, { ADMIN_CARD } from "@/components/admin/AdminPageShell";
import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PILOT_COUNTIES, PILOT_COMMODITIES, PILOT_SEASON } from "@/lib/utils/pilot-config";

type Template = {
  id: string;
  name: string;
  module: "rice" | "cocoa";
  format: "pdf" | "csv";
};

const DEFAULT_TEMPLATES: Template[] = [
  { id: "rice-summary-pdf", name: "Rice summary (PDF layout)", module: "rice", format: "pdf" },
  { id: "rice-summary-csv", name: "Rice summary (CSV export)", module: "rice", format: "csv" },
  { id: "cocoa-dds-pdf", name: "EUDR DDS (PDF)", module: "cocoa", format: "pdf" },
];

export default function ReportsCenterClient() {
  const toast = useToast();
  const [templates] = React.useState(DEFAULT_TEMPLATES);
  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "");

  const [season, setSeason] = React.useState<string>(PILOT_SEASON);
  const [county, setCounty] = React.useState("");
  const [orgId, setOrgId] = React.useState("");
  const [commodity, setCommodity] = React.useState<"" | "rice" | "cocoa">(
    (PILOT_COMMODITIES[0] as any) ?? "",
  );

  const [orgs, setOrgs] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("organizations").select("id,name").order("name").limit(200);
        if (error) throw error;
        if (!cancelled) setOrgs((data ?? []) as any);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orgs.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = templates.find((t) => t.id === templateId) ?? templates[0];

  const exportNow = async () => {
    try {
      if (!selected) throw new Error("Select a template.");

      // Pilot-ready: reuse existing exports endpoints.
      if (selected.module === "rice") {
        const url = `/api/reports/rice?format=${selected.format}&season=${encodeURIComponent(season)}${
          county ? `&county=${encodeURIComponent(county)}` : ""
        }`;
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Export started", selected.format.toUpperCase());
        return;
      }

      if (selected.module === "cocoa") {
        // DDS endpoint currently generates a sample statement; filters are UI-only until schema grows.
        const url = `/api/reports/dds`;
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Export started", "DDS PDF");
        return;
      }
    } catch (e) {
      toast.error("Export failed", e instanceof Error ? e.message : "Failed to export.");
    }
  };

  return (
    <AdminPageShell
      title="Advanced Reports Center"
      description="Saved templates + schedule-ready export layouts. (Pilot-friendly v1)"
      actions={
        <>
          <button
            type="button"
            onClick={() => toast.info("Templates", "Template saving is ready for next iteration.")}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save template
          </button>
          <button
            type="button"
            onClick={exportNow}
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </>
      }
    >
      {error ? <AlertBanner severity="warning" message={error} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <div className={`${ADMIN_CARD} p-5`}>
          <div className="font-display text-[16px] text-gray-900">Templates</div>
          <div className="mt-3 space-y-2">
            {templates.map((t) => (
              <label key={t.id} className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="tpl"
                  checked={templateId === t.id}
                  onChange={() => setTemplateId(t.id)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-gray-900">{t.name}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {t.module} · {t.format}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-gray-500">
            Next: persist templates + schedule runner.
          </div>
        </div>

        <div className={`${ADMIN_CARD} p-5`}>
          <div className="font-display text-[16px] text-gray-900">Filters</div>
          <div className="mt-1 text-[12px] text-gray-600">
            Filters are applied where supported by the export endpoint.
          </div>

          {isLoading ? (
            <div className="mt-4 text-[12px] text-gray-600 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Season">
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
                />
              </Field>
              <Field label="County">
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">—</option>
                  {PILOT_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Organization">
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">—</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Commodity">
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value as any)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">—</option>
                  {PILOT_COMMODITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Export intent</div>
            <div className="mt-2 text-[12px] text-gray-700">
              Template: <span className="font-mono">{selected?.id}</span>
              <br />
              Filters:{" "}
              <span className="font-mono">
                {JSON.stringify(
                  { season, county: county || null, organization_id: orgId || null, commodity: commodity || null },
                  null,
                  0,
                )}
              </span>
            </div>
          </div>
        </div>
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

