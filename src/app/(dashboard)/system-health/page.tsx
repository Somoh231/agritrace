import { redirect } from "next/navigation";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeHttpUrl } from "@/lib/supabase/env";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile, UserRole } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const DIAG_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "ministry_officer",
  "government_officer",
];

type RowDiag = { table: string; label: string };

const SEEDED_TABLES: RowDiag[] = [
  { table: "profiles", label: "User profiles" },
  { table: "counties", label: "Reference · Counties (15)" },
  { table: "districts", label: "Reference · Districts" },
  { table: "cooperatives", label: "Cooperatives" },
  { table: "farmers", label: "Farmer registry" },
  { table: "plots", label: "Plots" },
  { table: "rice_production_records", label: "Rice production" },
  { table: "inventory_items", label: "Inventory catalogue" },
  { table: "warehouses", label: "Warehouses" },
  { table: "warehouse_stock", label: "Warehouse stock positions" },
  { table: "inventory_movements", label: "Stock movements" },
  { table: "input_allocations", label: "County input allocations" },
  { table: "distribution_logs", label: "Distribution events" },
  { table: "donor_shipments", label: "Donor receipts" },
  { table: "expiry_tracking", label: "Expiry / loss flags" },
  { table: "supplier_records", label: "Supplier records" },
  { table: "farmer_visits", label: "Field visits" },
  { table: "geo_locations", label: "GPS captures" },
  { table: "farmer_subsidies", label: "Subsidy rows" },
  { table: "farmer_production", label: "Farmer production summaries" },
  { table: "field_reports", label: "Field intelligence reports" },
  { table: "food_security_indicators", label: "Food security indicators" },
  { table: "reports", label: "Ministry reports registry" },
  { table: "audit_log", label: "Audit log" },
];

export default async function SystemHealthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  const role = resolveUserRoleWithDemoFallback(profileRow, user);
  if (!role || !DIAG_ROLES.includes(role)) {
    redirect("/national-operations");
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const normalizedUrl = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const anonLen = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().length ?? 0;
  const servicePresent = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  let urlHost = "(unset)";
  try {
    if (normalizedUrl) urlHost = new URL(normalizedUrl).hostname;
  } catch {
    urlHost = "(invalid)";
  }

  const httpsOnly =
    Boolean(normalizedUrl) &&
    normalizedUrl!.startsWith("https:") &&
    !rawUrl.toLowerCase().includes("http://");

  let anonReachable = false;
  let anonDetail = "Skipped.";
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) anonDetail = error.message;
    else {
      anonReachable = true;
      anonDetail = "Session client can query profiles (RLS applies).";
    }
  } catch (e) {
    anonDetail = e instanceof Error ? e.message : "Unknown error.";
  }

  type CountRow = { label: string; count: number | null; error: string | null };
  const adminCounts: CountRow[] = [];
  let adminError: string | null = null;
  let recentAudit: Array<{ action: string; table_name: string | null; created_at: string }> = [];

  if (servicePresent) {
    try {
      const admin = getSupabaseAdminClient();
      for (const { table, label } of SEEDED_TABLES) {
        const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
        adminCounts.push({
          label,
          count: error ? null : count ?? 0,
          error: error?.message ?? null,
        });
      }
      const { data: auditRows } = await admin
        .from("audit_log")
        .select("action,table_name,created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      recentAudit = (auditRows ?? []) as typeof recentAudit;
    } catch (e) {
      adminError = e instanceof Error ? e.message : "Admin client failed.";
    }
  } else {
    adminError = "SUPABASE_SERVICE_ROLE_KEY not set — row counts and audit tail require service role on the server.";
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-[#0f172a]">System diagnostics</h1>
        <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
          Operational visibility for ministry administrators. Values are aggregate counts only; no secrets are exposed in the
          browser.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Environment (safe)</h2>
        <dl className="grid gap-2 text-[12px] sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">Supabase host</dt>
            <dd className="font-mono text-slate-900 mt-0.5">{urlHost}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">HTTPS-only project URL</dt>
            <dd className={`mt-0.5 font-medium ${httpsOnly ? "text-emerald-700" : "text-amber-700"}`}>
              {httpsOnly ? "Yes" : "Fix NEXT_PUBLIC_SUPABASE_URL (use https://*.supabase.co)."}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">Anon key configured</dt>
            <dd className="mt-0.5">{anonPresent ? `Present (${anonLen} chars)` : "Missing"}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <dt className="text-slate-500">Service role on server</dt>
            <dd className="mt-0.5">{servicePresent ? "Present (never shipped to browser)" : "Not set"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Auth & connectivity</h2>
        <ul className="text-[12px] text-slate-700 space-y-1">
          <li>
            <span className="font-medium text-slate-900">Signed in:</span>{" "}
            {user.email ?? user.id}
          </li>
          <li>
            <span className="font-medium text-slate-900">Effective role:</span> {role.replaceAll("_", " ")}
          </li>
          <li>
            <span className="font-medium text-slate-900">Database (anon session):</span>{" "}
            {anonReachable ? "Reachable." : `Unavailable — ${anonDetail}`}
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Migrations</h2>
        <p className="text-[12px] text-slate-600 leading-relaxed">
          Apply SQL files in numeric order via Supabase CLI (<span className="font-mono">supabase db push</span>) or the SQL
          Editor. See <span className="font-mono">supabase/migrations/README.md</span> for the ordered list (core → pilot tables
          → RLS).
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Seeded tables (service role / bypass RLS)
        </h2>
        {adminError ? (
          <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{adminError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Dataset</th>
                <th className="py-2 pr-4 font-medium">Rows</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {adminCounts.map((r) => (
                <tr key={r.label} className="border-b border-slate-50">
                  <td className="py-2 pr-4 text-slate-800">{r.label}</td>
                  <td className="py-2 pr-4 font-mono">{r.error ? "—" : r.count}</td>
                  <td className="py-2 text-slate-500">{r.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Offline sync queue</h2>
        <p className="text-[12px] text-slate-600 leading-relaxed">
          Pending uploads are held client-side (IndexedDB / service worker). Inspect devices from Field Agents workflows; there
          is no centralized sync queue table in this pilot schema.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Storage usage</h2>
        <p className="text-[12px] text-slate-600 leading-relaxed">
          Bucket-level usage is available in the Supabase Dashboard → Storage. This page does not call Storage admin APIs.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Recent audit log entries</h2>
        {recentAudit.length === 0 ? (
          <p className="text-[12px] text-slate-500">No rows yet (seed writes audit samples after first pilot seed).</p>
        ) : (
          <ul className="space-y-1 text-[11px] font-mono text-slate-700">
            {recentAudit.map((a, i) => (
              <li key={`${a.created_at}-${i}`}>
                {a.created_at} · {a.action}
                {a.table_name ? ` · ${a.table_name}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
