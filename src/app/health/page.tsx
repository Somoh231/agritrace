import { promises as fs } from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { isValidHttpUrl } from "@/lib/supabase/env";
import HealthActions from "@/app/health/HealthActions";

type Check = { label: string; ok: boolean; detail?: string };

async function fileHasFeatures(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw) as { features?: unknown[] };
    return Array.isArray(json.features) && json.features.length > 0;
  } catch {
    return false;
  }
}

export default async function HealthPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const supabaseConfigured = Boolean(supabaseAnon) && isValidHttpUrl(supabaseUrl);
  const mapboxConfigured = Boolean(mapbox) && (mapbox ?? "").trim().length > 20;

  const geojsonPath = path.join(process.cwd(), "public", "data", "liberia-counties.geojson");
  const geojsonDetected = await fileHasFeatures(geojsonPath);

  let dbReachable = false;
  let dbDetail: string | undefined;
  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) {
        dbReachable = false;
        dbDetail = error.message;
      } else {
        dbReachable = true;
      }
    } catch (e) {
      dbReachable = false;
      dbDetail = e instanceof Error ? e.message : "Failed to reach database.";
    }
  } else {
    dbDetail = "Supabase env not set.";
  }

  const checks: Check[] = [
    {
      label: "Supabase configured",
      ok: supabaseConfigured,
      detail: supabaseConfigured ? "Env vars present." : "Missing/invalid URL or anon key.",
    },
    {
      label: "Mapbox configured",
      ok: mapboxConfigured,
      detail: mapboxConfigured ? "Token present." : "Missing/short token.",
    },
    {
      label: "GeoJSON detected",
      ok: geojsonDetected,
      detail: geojsonDetected
        ? "County features found."
        : "File missing/empty. Replace public/data/liberia-counties.geojson.",
    },
    {
      label: "Database reachable",
      ok: dbReachable,
      detail: dbReachable ? "Supabase query succeeded." : dbDetail,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-[20px] text-gray-900">System health</div>
              <div className="mt-1 text-[12px] text-gray-600">
                Quick configuration and connectivity checks for Agrivault.
              </div>
            </div>
            <HealthActions />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Checks
            </div>
            <a
              href="/setup"
              className="text-[12px] text-forest-700 hover:underline underline-offset-2"
            >
              First-time setup →
            </a>
          </div>
          <div>
            {checks.map((c) => (
              <div key={c.label} className="px-5 py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-gray-900">{c.label}</div>
                    {c.detail ? (
                      <div className="mt-1 text-[12px] text-gray-600">{c.detail}</div>
                    ) : null}
                  </div>
                  <div
                    className={`shrink-0 font-mono text-[10px] px-2 py-1 rounded-full border ${
                      c.ok
                        ? "bg-green-50 text-green-800 border-green-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {c.ok ? "OK" : "FAIL"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            Notes
          </div>
          <div className="mt-2 text-[12px] text-gray-700 leading-relaxed">
            - Database reachability uses the server-side Supabase client and a simple{" "}
            <span className="font-mono">profiles</span> query.
            <br />
            - If you haven’t run <span className="font-mono">schema.sql</span> yet, the DB check
            will fail until the tables exist.
          </div>
        </div>
      </div>
    </div>
  );
}

