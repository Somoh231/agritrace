import { promises as fs } from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { isValidHttpUrl } from "@/lib/supabase/env";

type Check = { label: string; ok: boolean; detail: string };

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fileHasFeatures(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw) as { features?: unknown[] };
    return Array.isArray(json.features) && json.features.length > 0;
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

export default async function LaunchReadinessPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const supabaseConfigured = Boolean(supabaseAnon) && isValidHttpUrl(supabaseUrl);
  const mapboxConfigured = Boolean(mapbox) && (mapbox ?? "").trim().length > 20;
  const serviceRoleConfigured = Boolean(serviceRole) && serviceRole!.trim().length > 20;
  const appUrlConfigured = Boolean(appUrl) && isValidHttpUrl(appUrl);

  const geojsonPath = path.join(process.cwd(), "public", "data", "liberia-counties.geojson");
  const geojsonOk = await fileHasFeatures(geojsonPath);

  const checks: Check[] = [];
  checks.push({
    label: "Supabase configured",
    ok: supabaseConfigured,
    detail: supabaseConfigured ? "URL + anon key present." : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  });
  checks.push({
    label: "Service role key (server features)",
    ok: serviceRoleConfigured,
    detail: serviceRoleConfigured
      ? "Service role key present (seed, inquiries, analytics)."
      : "Set SUPABASE_SERVICE_ROLE_KEY for server-side inserts and seed scripts.",
  });
  checks.push({
    label: "Mapbox active",
    ok: mapboxConfigured,
    detail: mapboxConfigured ? "Token present." : "Set NEXT_PUBLIC_MAPBOX_TOKEN.",
  });
  checks.push({
    label: "App URL configured",
    ok: appUrlConfigured,
    detail: appUrlConfigured ? String(appUrl) : "Set NEXT_PUBLIC_APP_URL (used by some deployments).",
  });
  checks.push({
    label: "GeoJSON loaded",
    ok: geojsonOk,
    detail: geojsonOk ? "public/data/liberia-counties.geojson has features." : "GeoJSON missing/empty.",
  });

  // DB checks (best effort)
  let dbOk = false;
  let dbDetail = "Skipped (Supabase not configured).";
  const tableChecks: Array<{ table: string; label: string }> = [
    { table: "profiles", label: "Core schema applied (profiles exists)" },
    { table: "audit_log", label: "Audit log enabled" },
    { table: "discrepancy_issues", label: "Integrity schema applied (discrepancy_issues)" },
    { table: "location_inventory_opening", label: "Inventory openings enabled" },
    { table: "demo_inquiries", label: "Demo inquiries enabled" },
    { table: "analytics_events", label: "Analytics enabled" },
    { table: "notifications", label: "Notifications v2 enabled" },
    { table: "notification_reads", label: "Notification reads enabled" },
  ];

  const tableResults: Check[] = [];
  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) {
        dbOk = false;
        dbDetail = error.message;
      } else {
        dbOk = true;
        dbDetail = "Database reachable.";
      }

      for (const t of tableChecks) {
        const { error: tErr } = await supabase.from(t.table as any).select("*").limit(1);
        tableResults.push({
          label: t.label,
          ok: !tErr,
          detail: tErr ? tErr.message : "OK",
        });
      }
    } catch (e) {
      dbOk = false;
      dbDetail = e instanceof Error ? e.message : "DB check failed.";
    }
  }

  checks.push({ label: "Database reachable", ok: dbOk, detail: dbDetail });

  // Files present (helpful for launch ops)
  const requiredSql = [
    "src/lib/supabase/schema.sql",
    "src/lib/supabase/schema.enterprise.sql",
    "src/lib/supabase/schema.integrity.sql",
    "src/lib/supabase/schema.demo_inquiries.sql",
    "src/lib/supabase/schema.analytics.sql",
    "src/lib/supabase/schema.notifications.sql",
  ];
  const sqlChecks: Check[] = [];
  for (const rel of requiredSql) {
    const ok = await fileExists(path.join(process.cwd(), rel));
    sqlChecks.push({
      label: `File present: ${rel}`,
      ok,
      detail: ok ? "OK" : "Missing in repo.",
    });
  }

  const all = [...checks, ...sqlChecks, ...tableResults];
  const passed = all.filter((c) => c.ok).length;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-display text-[18px] text-gray-900">Launch readiness checklist</div>
        <div className="mt-1 text-[12px] text-gray-600">
          Final production readiness signals for deployment and real usage.
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full border ${
              passed === all.length
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {passed}/{all.length} checks passing
          </span>
          <a href="/health" className="text-[12px] text-forest-700 hover:underline underline-offset-2">
            System health →
          </a>
          <a href="/setup" className="text-[12px] text-forest-700 hover:underline underline-offset-2">
            Setup guide →
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Checks
        </div>
        <div className="divide-y divide-gray-100">
          {all.map((c) => (
            <div key={c.label} className="px-4 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-gray-900">{c.label}</div>
                <div className="mt-1 text-[12px] text-gray-600 leading-relaxed">{c.detail}</div>
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
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Launch notes</div>
        <div className="mt-2 text-[12px] text-gray-700 leading-relaxed">
          - Run all SQL files in Supabase before final cutover.
          <br />- Verify demo and analytics endpoints by submitting a demo request and loading `/demo`.
          <br />- Confirm RLS policies match pilot org access.
        </div>
      </div>
    </div>
  );
}

