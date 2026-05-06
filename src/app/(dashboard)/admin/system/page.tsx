import fs from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeOrigin(url: string | undefined) {
  if (!url?.trim()) return { label: "not set", httpsOk: false };
  try {
    const u = new URL(url.trim());
    const httpsOk = u.protocol === "https:";
    return { label: `${u.protocol}//${u.host}`, httpsOk };
  } catch {
    return { label: "invalid URL", httpsOk: false };
  }
}

function maskKey(label: string, value: string | undefined) {
  if (!value?.trim()) return `${label}: not set`;
  const v = value.trim();
  if (v.length < 12) return `${label}: set (${v.length} chars)`;
  return `${label}: ${v.slice(0, 6)}…${v.slice(-4)} (${v.length} chars)`;
}

export default async function SystemDiagnosticsPage() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  let migrationFiles: string[] = [];
  try {
    migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  } catch {
    migrationFiles = [];
  }

  const pubUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const origin = safeOrigin(pubUrl);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let adminReachable = false;
  let adminDetail: string | undefined;
  const tableCounts: Record<string, number | string> = {};

  try {
    const admin = getSupabaseAdminClient();
    await admin.from("profiles").select("id", { head: true }).limit(1);
    adminReachable = true;

    const tables = [
      "profiles",
      "counties",
      "districts",
      "farmers",
      "warehouses",
      "warehouse_stock",
      "inventory_items",
      "inventory_movements",
      "rice_production_records",
      "field_reports",
      "food_security_indicators",
      "donor_shipments",
      "audit_log",
      "reports",
    ];
    for (const t of tables) {
      const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
      tableCounts[t] = error ? `error: ${error.message}` : count ?? 0;
    }
  } catch (e) {
    adminDetail = e instanceof Error ? e.message : "Admin client unavailable.";
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Administration</div>
        <h1 className="mt-2 font-display text-[22px] text-gray-900">System diagnostics</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Safe environment visibility and database reachability. Service-role secrets are never printed in full.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[13px] text-gray-900">Environment</div>
        <ul className="text-[12px] text-gray-700 space-y-1 font-mono">
          <li>NEXT_PUBLIC_SUPABASE_URL: {origin.label}</li>
          <li>HTTPS URL ok: {origin.httpsOk ? "yes" : "no"}</li>
          <li>{maskKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon)}</li>
          <li>
            SUPABASE_SERVICE_ROLE_KEY:{" "}
            {process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
              ? `set (${process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length} chars)`
              : "not set (admin counts disabled)"}
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[13px] text-gray-900">Auth (current session)</div>
        <div className="text-[12px] text-gray-700">
          {user ? (
            <>
              Signed in as <span className="font-mono">{user.email ?? user.id}</span>
            </>
          ) : (
            "No session (unexpected on this page)."
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[13px] text-gray-900">Supabase admin API</div>
        <div className="text-[12px] text-gray-700">
          {adminReachable ? (
            <span className="text-green-700">Reachable (service role counts succeeded).</span>
          ) : (
            <span className="text-amber-800">Unavailable — {adminDetail ?? "check SUPABASE_SERVICE_ROLE_KEY on this deployment."}</span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[13px] text-gray-900">Migrations (repository)</div>
        <ul className="text-[11px] font-mono text-gray-700 space-y-1 list-decimal list-inside">
          {migrationFiles.length ? (
            migrationFiles.map((f) => <li key={f}>{f}</li>)
          ) : (
            <li>No migration files found — expected under supabase/migrations.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[13px] text-gray-900">Table row counts (service role)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">table</th>
                <th className="py-2">count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableCounts).map(([name, c]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-1.5 pr-4">{name}</td>
                  <td className="py-1.5">{c}</td>
                </tr>
              ))}
              {Object.keys(tableCounts).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-gray-500">
                    Run migrations and seeds, or configure SUPABASE_SERVICE_ROLE_KEY on the server.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-[12px] text-gray-700">
        <div className="font-semibold text-[13px] text-gray-900">Offline sync queue</div>
        <p>
          Client sync state is tracked in the browser (IndexedDB / service worker). Inspect via Field Agents or browser devtools;
          no server-wide queue is exposed here yet.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-[12px] text-gray-700">
        <div className="font-semibold text-[13px] text-gray-900">Storage usage</div>
        <p>Blob and attachment usage are managed in Supabase Dashboard → Storage and Bucket policies.</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-[12px] text-gray-700">
        <div className="font-semibold text-[13px] text-gray-900">Recent errors</div>
        <p>Use Vercel deployment logs and Supabase logs for stack traces; this page does not ingest external log drains.</p>
      </section>
    </div>
  );
}
