"use client";

import * as React from "react";
import { FileUp, Loader2, RefreshCcw } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { parseCsv } from "@/lib/utils/csv";

type ImportType = "farmers" | "rice" | "lots_movements";

const TEMPLATES: Record<ImportType, { title: string; required: string[]; optional: string[] }> = {
  farmers: {
    title: "Farmers (CSV)",
    required: ["full_name", "county"],
    optional: ["national_id", "phone", "gender", "district", "village", "latitude", "longitude", "notes"],
  },
  rice: {
    title: "Rice production (CSV)",
    required: ["farmer_id", "season"],
    optional: [
      "planting_date",
      "expected_yield_kg",
      "actual_yield_kg",
      "post_harvest_loss_kg",
      "post_harvest_loss_cause",
      "market_destination",
      "farm_gate_price_usd",
      "county",
      "district",
      "notes",
    ],
  },
  lots_movements: {
    title: "Lots (CSV) — pilot import",
    required: ["lot_code", "commodity", "weight_kg_in", "weight_kg_current"],
    optional: [
      "origin_location_id",
      "organization_id",
      "moisture_content",
      "quality_grade",
      "status",
      "season",
      "compliance_status",
      "notes",
    ],
  },
};

export default function ImportCenterClient() {
  const toast = useToast();

  const [type, setType] = React.useState<ImportType>("farmers");
  const [csvText, setCsvText] = React.useState<string>("");
  const [filename, setFilename] = React.useState<string | null>(null);

  const parsed = React.useMemo(() => parseCsv(csvText, { maxRows: 200 }), [csvText]);
  const required = TEMPLATES[type].required;
  const missingRequired = required.filter((h) => !parsed.headers.some((x) => x.toLowerCase() === h.toLowerCase()));

  const [isValidating, setIsValidating] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [result, setResult] = React.useState<null | { ok: boolean; inserted?: number; errors?: any[] }>(null);
  const [serverErrors, setServerErrors] = React.useState<string | null>(null);

  const run = async (mode: "validate" | "import") => {
    setServerErrors(null);
    setResult(null);
    try {
      if (mode === "validate") setIsValidating(true);
      else setIsImporting(true);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, mode, rows: parsed.rows }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status}).`);
      setResult(j);
      toast.success(mode === "validate" ? "Validation complete" : "Import complete");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed.";
      setServerErrors(msg);
      toast.error("Import failed", msg);
    } finally {
      setIsValidating(false);
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div>
            <div className="font-display text-lg text-gray-900">Data Import Center</div>
            <div className="mt-1 text-[12px] text-gray-600">
              CSV preview → validate → import with a clear summary. (Super admin only)
            </div>
          </div>
          <a href="/setup" className="text-[12px] text-forest-800 hover:underline">
            Setup help →
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-display text-[16px] text-gray-900">Upload CSV</div>
              <div className="mt-1 text-[12px] text-gray-600">
                Choose a dataset type, then paste or upload a CSV file.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCsvText("");
                setFilename(null);
                setResult(null);
                setServerErrors(null);
              }}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Dataset</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="farmers">{TEMPLATES.farmers.title}</option>
                <option value="rice">{TEMPLATES.rice.title}</option>
                <option value="lots_movements">{TEMPLATES.lots_movements.title}</option>
              </select>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">CSV file</div>
              <label className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 cursor-pointer">
                <FileUp className="h-4 w-4" />
                <span className="truncate">{filename ?? "Choose file…"}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFilename(f.name);
                    setCsvText(await f.text());
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
              CSV content (paste supported)
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="min-h-[220px] w-full rounded-xl border border-gray-200 bg-white p-3 text-[11px] font-mono text-gray-800"
              placeholder="full_name,county,national_id\nJane Doe,Nimba,LBR-NI-100001\n..."
            />
          </div>

          {parsed.errors.length ? (
            <div className="mt-3">
              <AlertBanner severity="warning" message={parsed.errors.join(" · ")} />
            </div>
          ) : null}

          {missingRequired.length ? (
            <div className="mt-3">
              <AlertBanner
                severity="danger"
                message={`Missing required column(s): ${missingRequired.join(", ")}`}
              />
            </div>
          ) : null}

          {serverErrors ? (
            <div className="mt-3">
              <AlertBanner severity="danger" message={serverErrors} />
            </div>
          ) : null}

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => run("validate")}
              disabled={!parsed.rows.length || missingRequired.length > 0 || isValidating || isImporting}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Validate preview
            </button>
            <button
              type="button"
              onClick={() => run("import")}
              disabled={!parsed.rows.length || missingRequired.length > 0 || isValidating || isImporting}
              className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Import rows
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <div className="font-display text-[16px] text-gray-900">Template</div>
            <div className="mt-2 text-[12px] text-gray-700">
              Required headers:
              <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-[11px]">
                {TEMPLATES[type].required.join(", ")}
              </div>
              Optional headers:
              <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-[11px]">
                {TEMPLATES[type].optional.join(", ")}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="font-display text-[16px] text-gray-900">Preview</div>
              <div className="mt-1 text-[12px] text-gray-600">
                Showing {Math.min(parsed.rows.length, 10)} of {parsed.rows.length} rows
              </div>
            </div>
            {parsed.rows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-[12px] font-medium text-gray-900">No CSV loaded</div>
                <div className="mt-1 text-[11px] text-gray-500">
                  Upload a CSV file or paste content to see a preview.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full text-[11px]">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {parsed.headers.slice(0, 6).map((h) => (
                        <th key={h} className="text-left font-medium px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.rows.slice(0, 10).map((r, idx) => (
                      <tr key={idx}>
                        {parsed.headers.slice(0, 6).map((h) => (
                          <td key={h} className="px-3 py-2 text-gray-700">
                            {String(r[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <div className="font-display text-[16px] text-gray-900">Result</div>
            <div className="mt-2 text-[12px] text-gray-700">
              {result ? (
                <div className="space-y-2">
                  <div>
                    Status:{" "}
                    <span className={result.ok ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                      {result.ok ? "OK" : "ERRORS"}
                    </span>
                  </div>
                  {typeof result.inserted === "number" ? (
                    <div>
                      Inserted: <span className="font-mono">{result.inserted}</span>
                    </div>
                  ) : null}
                  {Array.isArray(result.errors) && result.errors.length ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                        Errors (first 10)
                      </div>
                      <ul className="mt-2 space-y-1 text-[11px] text-gray-700">
                        {result.errors.slice(0, 10).map((e: any, i: number) => (
                          <li key={i}>
                            <span className="font-mono">row {e.row}</span>: {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">No row-level errors.</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-gray-500">
                  Run validation or import to see a summary here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

