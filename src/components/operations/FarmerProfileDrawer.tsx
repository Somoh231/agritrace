"use client";

import * as React from "react";

import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { operationalBoundaryFromPersistedRow, operationalBoundaryFromPlotGeoJson } from "@/lib/gis/operational-boundary-math";

export default function FarmerProfileDrawer({ farmerId, onClose }: { farmerId: string | null; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [farmer, setFarmer] = React.useState<Record<string, unknown> | null>(null);
  const [plots, setPlots] = React.useState<Record<string, unknown>[]>([]);
  const [visits, setVisits] = React.useState<Record<string, unknown>[]>([]);
  const [subsidies, setSubsidies] = React.useState<Record<string, unknown>[]>([]);
  const [rice, setRice] = React.useState<Record<string, unknown>[]>([]);

  React.useEffect(() => {
    if (!farmerId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const [{ data: f, error: fe }, vRes, sRes, rRes] = await Promise.all([
          supabase
            .from("farmers")
            .select("*, plots(id, polygon_geojson, area_hectares, created_at, commodity)")
            .eq("id", farmerId)
            .maybeSingle(),
          supabase
            .from("farmer_visits")
            .select("id, visited_at, notes, verification_status, boundary_geometry, boundary_points, boundary_area_ha, boundary_captured_at, visited_by")
            .eq("farmer_id", farmerId)
            .order("visited_at", { ascending: false })
            .limit(15),
          supabase.from("farmer_subsidies").select("*").eq("farmer_id", farmerId).order("created_at", { ascending: false }).limit(15),
          supabase.from("rice_production_records").select("*").eq("farmer_id", farmerId).order("recorded_at", { ascending: false }).limit(10),
        ]);
        if (cancelled) return;
        if (fe || !f) {
          setError("Farmer record could not be loaded.");
          setFarmer(null);
          setPlots([]);
          setVisits([]);
          setSubsidies([]);
          setRice([]);
          return;
        }
        const row = f as Record<string, unknown> & { plots?: Record<string, unknown>[] };
        const { plots: plotRows = [], ...farmerRest } = row;
        setFarmer(farmerRest);
        setPlots(plotRows);
        setVisits((vRes.data ?? []) as Record<string, unknown>[]);
        setSubsidies((sRes.data ?? []) as Record<string, unknown>[]);
        setRice((rRes.data ?? []) as Record<string, unknown>[]);
      } catch {
        if (!cancelled) setError("Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmerId]);

  const latestInspectionBoundary = React.useMemo(() => {
    for (const v of visits) {
      const b = operationalBoundaryFromPersistedRow(v);
      if (b) return { visit: v, boundary: b };
    }
    return null;
  }, [visits]);

  if (!farmerId) return null;

  return (
    <div className="space-y-5 text-[13px] text-slate-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">National registry profile</div>
          <div className="mt-1 font-display text-lg font-semibold text-white">{farmer ? String(farmer.full_name ?? "—") : "Loading…"}</div>
          <div className="mt-1 font-mono text-[11px] text-slate-500 break-all">{farmerId}</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-slate-800">
          Close
        </button>
      </div>

      {loading ? <div className="text-slate-400">Loading operational history…</div> : null}
      {error ? <div className="rounded-lg border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-rose-100">{error}</div> : null}

      {farmer ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-500">County / district</div>
              <div className="text-slate-100">
                {String(farmer.county ?? "—")} · {String(farmer.district ?? farmer.village ?? "—")}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-500">Compliance</div>
              <div className="text-slate-100 capitalize">{String(farmer.verification_status ?? "—")}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-500">Geo</div>
              <div className="font-mono text-[12px] text-slate-100">
                {farmer.latitude != null && farmer.longitude != null
                  ? `${farmer.latitude}, ${farmer.longitude}`
                  : "Not captured"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-500">Subsidy eligibility</div>
              <div className="text-slate-100">{farmer.subsidy_eligible ? "Eligible" : "No"}</div>
            </div>
          </div>

          {farmer.notes ? (
            <div className="rounded-lg border border-slate-800 bg-black/30 px-3 py-2 text-[12px] text-slate-300 whitespace-pre-wrap">
              {String(farmer.notes)}
            </div>
          ) : null}

          {plots.some((p) => p.polygon_geojson) ? (
            <section>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Farm Boundary &amp; Location</div>
              <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
                Operational outlines from field capture — approximate, for traceability and reporting. Not cadastral or legal proof of ownership.
              </p>
              <div className="space-y-4">
                {plots.map((p) => {
                  const b = operationalBoundaryFromPlotGeoJson(p.polygon_geojson, typeof p.created_at === "string" ? p.created_at : undefined);
                  if (!b) return null;
                  return (
                    <div key={String(p.id)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-2">
                      <div className="mb-2 text-[11px] text-slate-400">
                        Registered plot · {String(p.commodity ?? "—")} · <span className="font-mono text-slate-500">{String(p.id).slice(0, 8)}…</span>
                      </div>
                      <FarmBoundaryCapture readOnly disabled value={b} onChange={() => {}} />
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {latestInspectionBoundary ? (
            <section>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Latest inspection boundary</div>
              <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded border border-slate-700 px-2 py-0.5 capitalize">
                  Verification: {String(latestInspectionBoundary.visit.verification_status ?? "—")}
                </span>
                <span className="font-mono text-slate-500">
                  Visit {String(latestInspectionBoundary.visit.visited_at ?? "").slice(0, 16)}
                </span>
              </div>
              <FarmBoundaryCapture readOnly disabled value={latestInspectionBoundary.boundary} onChange={() => {}} />
            </section>
          ) : null}

          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Field visits</div>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {visits.length ? (
                visits.map((v) => {
                  const vb = operationalBoundaryFromPersistedRow(v);
                  return (
                  <li key={String(v.id)} className="rounded-lg border border-slate-800 px-3 py-2 text-[12px]">
                    <div className="text-slate-400">{String(v.visited_at ?? "").slice(0, 16)}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="capitalize">Outcome: {String(v.verification_status ?? "—")}</span>
                      {vb ? (
                        <span className="text-emerald-200/90">
                          Boundary on file · {vb.areaHectares.toFixed(2)} ha est.
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-slate-200 whitespace-pre-wrap">{String(v.notes ?? "—")}</div>
                  </li>
                  );
                })
              ) : (
                <li className="text-slate-500">No visits logged.</li>
              )}
            </ul>
          </section>

          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Subsidy history</div>
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {subsidies.length ? (
                subsidies.map((s) => (
                  <li key={String(s.id)} className="rounded-lg border border-slate-800 px-3 py-2 text-[12px] flex justify-between gap-2">
                    <span>{String(s.programme ?? "Programme")}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {s.amount_usd != null ? `USD ${Number(s.amount_usd).toFixed(2)}` : String(s.period_label ?? "")}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No subsidy ledger rows.</li>
              )}
            </ul>
          </section>

          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Rice production</div>
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {rice.length ? (
                rice.map((r) => (
                  <li key={String(r.id)} className="rounded-lg border border-slate-800 px-3 py-2 text-[12px] font-mono text-slate-300">
                    {String(r.season ?? "")} · actual {String(r.actual_yield_kg ?? "—")} kg · loss {String(r.post_harvest_loss_kg ?? "—")}{" "}
                    kg
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No production records.</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
