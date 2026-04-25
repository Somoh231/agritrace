import { promises as fs } from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { isValidHttpUrl } from "@/lib/supabase/env";

type Check = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

async function fileHasFeatures(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw) as { features?: unknown[] };
    return Array.isArray(json.features) && json.features.length > 0;
  } catch {
    return false;
  }
}

export default async function CocoaPilotReadinessPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const supabaseConfigured = Boolean(supabaseAnon) && isValidHttpUrl(supabaseUrl);
  const mapboxConfigured = Boolean(mapbox) && (mapbox ?? "").trim().length > 20;

  const geojsonPath = path.join(process.cwd(), "public", "data", "liberia-counties.geojson");
  const geojsonLoaded = await fileHasFeatures(geojsonPath);

  const checks: Check[] = [];

  checks.push({
    id: "supabase",
    label: "Supabase configured",
    ok: supabaseConfigured,
    detail: supabaseConfigured
      ? "Public URL and anon key are set."
      : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  });

  checks.push({
    id: "mapbox",
    label: "Mapbox active",
    ok: mapboxConfigured,
    detail: mapboxConfigured ? "NEXT_PUBLIC_MAPBOX_TOKEN looks present." : "Add a valid Mapbox token for maps.",
  });

  checks.push({
    id: "geojson",
    label: "GeoJSON loaded",
    ok: geojsonLoaded,
    detail: geojsonLoaded
      ? "public/data/liberia-counties.geojson has features."
      : "Add county GeoJSON under public/data/liberia-counties.geojson.",
  });

  let dbOk = false;
  let dbDetail = "Not checked.";
  let demoProfiles = 0;
  let farmerRows = 0;
  let lotRows = 0;
  let adminRows = 0;
  let reportRows = 0;
  let importEvents = 0;

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();

      const { error: pingErr } = await supabase.from("profiles").select("id").limit(1);
      if (pingErr) {
        dbDetail = pingErr.message;
      } else {
        dbOk = true;
        dbDetail = "Database responded to a profiles probe.";

        const d = await supabase.from("profiles").select("id", { count: "exact", head: true }).ilike("full_name", "%(Demo)%");
        if (!d.error) demoProfiles = d.count ?? 0;

        const f = await supabase.from("farmers").select("id", { count: "exact", head: true });
        if (!f.error) farmerRows = f.count ?? 0;

        const l = await supabase.from("lots").select("id", { count: "exact", head: true });
        if (!l.error) lotRows = l.count ?? 0;

        const a = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
        if (!a.error) adminRows = a.count ?? 0;

        const r = await supabase.from("reports").select("id", { count: "exact", head: true });
        if (!r.error) reportRows = r.count ?? 0;

        const i = await supabase.from("audit_log").select("id", { count: "exact", head: true }).ilike("action", "%IMPORT%");
        if (!i.error) importEvents = i.count ?? 0;
      }
    } catch (e) {
      dbDetail = e instanceof Error ? e.message : "Server client error.";
    }
  } else {
    dbDetail = "Skipped until Supabase env is valid.";
  }

  checks.push({
    id: "db",
    label: "Database reachable",
    ok: dbOk,
    detail: dbDetail,
  });

  checks.push({
    id: "demo_users",
    label: "Demo users created",
    ok: demoProfiles >= 3,
    detail:
      demoProfiles >= 3
        ? `Found ${demoProfiles} profile(s) with “(Demo)” in full name (seed script pattern).`
        : "Run npm run seed:demo (or your seed) so demo profiles appear, or adjust this check.",
  });

  checks.push({
    id: "seed",
    label: "Data seeded",
    ok: farmerRows > 0 && lotRows > 0,
    detail: `Farmers: ${farmerRows}, lots: ${lotRows}.`,
  });

  checks.push({
    id: "admin",
    label: "Admin user exists",
    ok: adminRows > 0,
    detail:
      adminRows > 0
        ? `${adminRows} super_admin profile(s).`
        : "Create at least one profiles row with role super_admin.",
  });

  checks.push({
    id: "reports",
    label: "Reports working",
    ok: reportRows > 0,
    detail:
      reportRows > 0
        ? `${reportRows} row(s) in reports.`
        : "Generate or seed at least one report so the reports center has data.",
  });

  checks.push({
    id: "imports",
    label: "Imports tested",
    ok: importEvents > 0,
    detail:
      importEvents > 0
        ? `${importEvents} audit event(s) mentioning IMPORT.`
        : "Run a CSV import from Data import (super admin) to record an audit trail.",
  });

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-display text-[18px] text-gray-900">Pilot readiness checklist</div>
        <p className="mt-1 text-[12px] text-gray-600 leading-relaxed">
          Automated signals for Liberia cocoa pilot go-live. Some items stay manual until your team
          completes them (for example, a full import dry run in staging).
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full border ${
              passed === total
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {passed}/{total} checks passing
          </div>
          <a
            href="/health"
            className="text-[12px] text-forest-700 hover:underline underline-offset-2"
          >
            System health →
          </a>
          <a
            href="/setup"
            className="text-[12px] text-forest-700 hover:underline underline-offset-2"
          >
            Setup guide →
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Checklist
        </div>
        <ul className="divide-y divide-gray-100">
          {checks.map((c) => (
            <li key={c.id} className="px-4 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-gray-900">{c.label}</div>
                <p className="mt-1 text-[12px] text-gray-600 leading-relaxed">{c.detail}</p>
              </div>
              <span
                className={`shrink-0 font-mono text-[10px] px-2 py-1 rounded-md border h-fit ${
                  c.ok
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {c.ok ? "Ready" : "Open"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-forest-100 bg-forest-50/60 p-4 text-[12px] text-forest-900 leading-relaxed">
        <strong className="font-medium">Integrity phase</strong> — Inventory ledger, discrepancy workflow,
        approvals, field performance, and data quality live under Cocoa. Apply{" "}
        <span className="font-mono text-[11px]">schema.integrity.sql</span> in Supabase if you have not
        already, so ledger openings and discrepancy tables are available.
      </div>
    </div>
  );
}
