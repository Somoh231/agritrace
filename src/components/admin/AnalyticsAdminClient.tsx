"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils/formatters";

type Row = {
  id: string;
  created_at: string;
  user_id: string | null;
  event: string;
  path: string | null;
  module: string | null;
  payload: Record<string, unknown> | null;
};

export default function AnalyticsAdminClient() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tableMissing, setTableMissing] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: qErr } = await supabase
        .from("analytics_events")
        .select("id,created_at,user_id,event,path,module,payload")
        .order("created_at", { ascending: false })
        .limit(500);
      if (qErr) {
        if (qErr.message.includes("does not exist") || qErr.code === "42P01") {
          setTableMissing(true);
          setRows([]);
          return;
        }
        throw qErr;
      }
      setTableMissing(false);
      setRows((data as any) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (tableMissing) {
    return (
      <div className="max-w-2xl">
        <AlertBanner
          severity="warning"
          message="Run agritrace/src/lib/supabase/schema.analytics.sql in Supabase to enable analytics, then re-deploy with SUPABASE_SERVICE_ROLE_KEY."
        />
      </div>
    );
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.events += 1;
      acc.byEvent[r.event] = (acc.byEvent[r.event] ?? 0) + 1;
      acc.byModule[r.module ?? "unknown"] = (acc.byModule[r.module ?? "unknown"] ?? 0) + 1;
      if (r.path) acc.byPath[r.path] = (acc.byPath[r.path] ?? 0) + 1;
      const variant = typeof r.payload?.variant === "string" ? r.payload.variant : null;
      if (variant) acc.byVariant[variant] = (acc.byVariant[variant] ?? 0) + 1;
      return acc;
    },
    {
      events: 0,
      byEvent: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      byPath: {} as Record<string, number>,
      byVariant: {} as Record<string, number>,
    },
  );
  const topPages = Object.entries(totals.byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-[18px] text-gray-900">Usage analytics</div>
          <div className="text-[12px] text-gray-500 mt-0.5">Lightweight events for pilot monitoring.</div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? <AlertBanner severity="danger" message={error} /> : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-[12px] text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Kpi label="Events (last 500)" value={String(totals.events)} />
            <Kpi label="Top module" value={topKey(totals.byModule) ?? "—"} />
            <Kpi label="Top event" value={topKey(totals.byEvent) ?? "—"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Kpi label="Page views" value={String(totals.byEvent.page_view ?? 0)} />
            <Kpi label="CTA clicks" value={String(totals.byEvent.cta_click ?? 0)} />
            <Kpi label="Demo submissions" value={String(totals.byEvent.demo_request_submitted ?? 0)} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Most visited pages
            </div>
            <div className="p-3">
              {topPages.length === 0 ? (
                <div className="text-[12px] text-gray-500">No page views tracked yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {topPages.map(([path, count]) => (
                    <div key={path} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-[12px]">
                      <span className="truncate text-gray-700">{path}</span>
                      <span className="font-mono text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Experiment variants (hero)
            </div>
            <div className="p-3">
              {Object.keys(totals.byVariant).length === 0 ? (
                <div className="text-[12px] text-gray-500">No variant events yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(totals.byVariant).map(([variant, count]) => (
                    <div key={variant} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-[12px]">
                      <span className="text-gray-700">{variant}</span>
                      <span className="font-mono text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Recent events
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-[12px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Time</th>
                    <th className="text-left font-medium px-3 py-3">Event</th>
                    <th className="text-left font-medium px-3 py-3">Module</th>
                    <th className="text-left font-medium px-3 py-3">Path</th>
                    <th className="text-left font-medium px-4 py-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">{formatDateTime(r.created_at)}</td>
                      <td className="px-3 py-3 font-mono text-forest-800">{r.event}</td>
                      <td className="px-3 py-3">{r.module ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-700">{r.path ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{r.user_id ?? "anon"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-2 font-display text-[22px] text-gray-900">{value}</div>
    </div>
  );
}

function topKey(map: Record<string, number>) {
  const entries = Object.entries(map);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

