"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Agg = {
  profile_id: string;
  name: string;
  county: string | null;
  farmers: number;
  lots: number;
  movements: number;
  discrepancy_rate: number;
};

export default function FieldPerformanceClient() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Agg[]>([]);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const [{ data: farmers }, { data: lots }, { data: movs }, { data: profs }, discRes] = await Promise.all([
        supabase.from("farmers").select("registered_by,county").limit(3000),
        supabase.from("lots").select("created_by").limit(3000),
        supabase.from("movements").select("dispatched_by").limit(3000),
        supabase.from("profiles").select("id,full_name,county").limit(500),
        supabase.from("discrepancy_issues").select("id,assigned_to,status").limit(500),
      ]);
      const disc = discRes.error ? [] : ((discRes.data as any[]) ?? []);

      const nameById = new Map((profs as any[])?.map((p) => [p.id, p.full_name as string]) ?? []);
      const countyById = new Map((profs as any[])?.map((p) => [p.id, (p.county as string | null) ?? null]) ?? []);

      const map = new Map<string, Agg>();

      function bump(id: string | null, key: "farmers" | "lots" | "movements", county: string | null) {
        if (!id) return;
        const prev =
          map.get(id) ??
          ({
            profile_id: id,
            name: nameById.get(id) ?? "Unknown",
            county: countyById.get(id) ?? county,
            farmers: 0,
            lots: 0,
            movements: 0,
            discrepancy_rate: 0,
          } as Agg);
        prev[key] += 1;
        if (county) prev.county = prev.county ?? county;
        map.set(id, prev);
      }

      for (const f of (farmers as any[]) ?? []) bump(f.registered_by, "farmers", f.county ?? null);
      for (const l of (lots as any[]) ?? []) bump(l.created_by, "lots", null);
      for (const m of (movs as any[]) ?? []) bump(m.dispatched_by, "movements", null);

      const list = Array.from(map.values()).sort(
        (a, b) => b.farmers + b.lots + b.movements - (a.farmers + a.lots + a.movements),
      );

      const assignedOpenByAgent = new Map<string, number>();
      for (const d of disc) {
        if (d.status === "resolved") continue;
        if (!d.assigned_to) continue;
        assignedOpenByAgent.set(d.assigned_to, (assignedOpenByAgent.get(d.assigned_to) ?? 0) + 1);
      }

      for (const r of list) {
        const open = assignedOpenByAgent.get(r.profile_id) ?? 0;
        const denom = Math.max(1, r.movements);
        r.discrepancy_rate = Math.round((open / denom) * 1000) / 10;
      }

      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load field performance.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const onPrimary = () => load();
    window.addEventListener("agritrace-primary-action", onPrimary);
    return () => window.removeEventListener("agritrace-primary-action", onPrimary);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-[16px] text-gray-900">Field agent performance</div>
          <div className="text-[12px] text-gray-500">
            Activity inferred from registered_by / created_by / dispatched_by on pilot records.
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <AlertBanner severity="warning" message={error} actions={[{ label: "Retry", onClick: load }]} />
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex items-center gap-2 text-[12px] text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-[12px] text-gray-600">No attributed activity yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Agent</th>
                  <th className="text-left font-medium px-3 py-3">County</th>
                  <th className="text-right font-medium px-3 py-3">Farmers</th>
                  <th className="text-right font-medium px-3 py-3">Lots</th>
                  <th className="text-right font-medium px-3 py-3">Movements</th>
                  <th className="text-right font-medium px-4 py-3">Disc. rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.profile_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{r.profile_id}</div>
                    </td>
                    <td className="px-3 py-3">{r.county ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.farmers}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.lots}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.movements}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-800">{r.discrepancy_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
