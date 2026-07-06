"use client";

import * as React from "react";

import {
  AlertCard,
  DashboardPanel,
  EnterpriseDetailTile,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
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

  const visitTimeline = visits.slice(0, 8).map((v) => ({
    id: String(v.id),
    title: String(v.notes ?? "Field visit").slice(0, 80),
    meta: `Outcome: ${String(v.verification_status ?? "—")}`,
    time: String(v.visited_at ?? "").slice(0, 16).replace("T", " "),
    tone: v.verification_status === "verified" ? ("success" as const) : ("default" as const),
  }));

  if (!farmerId) return null;

  return (
    <div className="space-y-5 text-[13px] text-ink-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">National registry profile</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">{farmer ? String(farmer.full_name ?? "—") : "Loading…"}</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{farmerId}</p>
        </div>
        <button type="button" onClick={onClose} className="btn-gov-outline h-9 rounded-lg px-3 text-[12px]">
          Close
        </button>
      </div>

      {loading ? <p className="text-slate-600">Loading operational history…</p> : null}
      {error ? (
        <AlertCard tone="danger" title="Profile unavailable">
          {error}
        </AlertCard>
      ) : null}

      {farmer ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <EnterpriseDetailTile
              label="County / district / village"
              value={`${String(farmer.county ?? "—")} · ${String(farmer.district ?? "—")} · ${String(farmer.village ?? "—")}`}
            />
            <EnterpriseDetailTile
              label="Verification"
              value={
                <StatusBadge tone={farmer.verification_status === "verified" ? "success" : "warning"}>
                  {String(farmer.verification_status ?? "—")}
                </StatusBadge>
              }
            />
            <EnterpriseDetailTile
              label="GPS coordinates"
              value={
                farmer.latitude != null && farmer.longitude != null
                  ? `${farmer.latitude}, ${farmer.longitude}`
                  : "Not captured"
              }
            />
            <EnterpriseDetailTile label="National ID" value={String(farmer.national_id ?? "—")} />
            <EnterpriseDetailTile label="Phone" value={String(farmer.phone ?? "—")} />
            <EnterpriseDetailTile label="Subsidy eligibility" value={farmer.subsidy_eligible ? "Eligible" : "No"} />
          </div>

          {farmer.notes ? (
            <DashboardPanel>
              <SectionHeader title="Registration notes" subtitle="Cooperative, identifiers, officer remarks" />
              <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{String(farmer.notes)}</p>
            </DashboardPanel>
          ) : null}

          {plots.some((p) => p.polygon_geojson) ? (
            <DashboardPanel>
              <SectionHeader
                title="Farm boundary & location"
                subtitle="Operational outlines from field capture — approximate, for traceability. Not cadastral proof."
              />
              <div className="mt-4 space-y-4">
                {plots.map((p) => {
                  const b = operationalBoundaryFromPlotGeoJson(p.polygon_geojson, typeof p.created_at === "string" ? p.created_at : undefined);
                  if (!b) return null;
                  return (
                    <div key={String(p.id)} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <p className="mb-2 text-[12px] text-slate-600">
                        Plot · {String(p.commodity ?? "—")} · <span className="font-mono text-slate-500">{String(p.id).slice(0, 8)}…</span>
                      </p>
                      <FarmBoundaryCapture readOnly disabled value={b} onChange={() => {}} />
                    </div>
                  );
                })}
              </div>
            </DashboardPanel>
          ) : null}

          {latestInspectionBoundary ? (
            <DashboardPanel>
              <SectionHeader title="Latest inspection boundary" />
              <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-slate-600">
                <StatusBadge tone="neutral">Verification: {String(latestInspectionBoundary.visit.verification_status ?? "—")}</StatusBadge>
                <span className="font-mono text-slate-500">
                  Visit {String(latestInspectionBoundary.visit.visited_at ?? "").slice(0, 16)}
                </span>
              </div>
              <div className="mt-3">
                <FarmBoundaryCapture readOnly disabled value={latestInspectionBoundary.boundary} onChange={() => {}} />
              </div>
            </DashboardPanel>
          ) : null}

          <DashboardPanel>
            <SectionHeader title="Inspection history" subtitle={`${visits.length} visits on file`} />
            <div className="mt-4">
              {visitTimeline.length ? <Timeline items={visitTimeline} /> : <p className="text-slate-600">No visits logged.</p>}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader title="Subsidy history" />
            <ul className="mt-3 max-h-32 space-y-2 overflow-y-auto">
              {subsidies.length ? (
                subsidies.map((s) => (
                  <li key={String(s.id)} className="flex justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-[12px]">
                    <span className="text-slate-800">{String(s.programme ?? "Programme")}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {s.amount_usd != null ? `USD ${Number(s.amount_usd).toFixed(2)}` : String(s.period_label ?? "")}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-slate-600">No subsidy ledger rows.</li>
              )}
            </ul>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader title="Rice production" />
            <ul className="mt-3 max-h-32 space-y-2 overflow-y-auto">
              {rice.length ? (
                rice.map((r) => (
                  <li key={String(r.id)} className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 font-mono text-[12px] text-slate-700">
                    {String(r.season ?? "")} · actual {String(r.actual_yield_kg ?? "—")} kg · loss {String(r.post_harvest_loss_kg ?? "—")} kg
                  </li>
                ))
              ) : (
                <li className="text-slate-600">No production records.</li>
              )}
            </ul>
          </DashboardPanel>
        </>
      ) : null}
    </div>
  );
}
