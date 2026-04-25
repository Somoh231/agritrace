"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import StatusPill from "@/components/shared/StatusPill";
import ComplianceRing from "@/components/cocoa/ComplianceRing";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Farmer, Lot, Movement, Plot } from "@/lib/supabase/types";
import { calculateVariancePct } from "@/lib/utils/reconciliation";

type ChecklistItem = {
  key: string;
  title: string;
  sub: string;
  state: "ok" | "warn" | "err";
  pill: { status: "ok" | "warning" | "error" | "neutral"; label: string };
};

function IconSquare({ state }: { state: "ok" | "warn" | "err" }) {
  const cls =
    state === "ok"
      ? "bg-green-50 text-green-700"
      : state === "warn"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <div className={`h-[18px] w-[18px] rounded-md grid place-items-center ${cls}`}>
      {state === "ok" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === "warn" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export default function EUDRChecklist({ lotId }: { lotId?: string }) {
  const [lots, setLots] = React.useState<Lot[]>([]);
  const [activeLotId, setActiveLotId] = React.useState<string>(lotId ?? "");

  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [farmers, setFarmers] = React.useState<Farmer[]>([]);
  const [plots, setPlots] = React.useState<Plot[]>([]);
  const [org, setOrg] = React.useState<{ name: string; license_number: string | null } | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [downloadBusy, setDownloadBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadLots() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("lots")
        .select("id, lot_code, commodity, origin_location_id, organization_id, weight_kg_in, weight_kg_current, moisture_content, quality_grade, status, season, farmer_group_ids, compliance_status, notes, created_by, created_at")
        .eq("commodity", "cocoa")
        .order("created_at", { ascending: false })
        .limit(200);
      setLots((data as any) ?? []);
      if (!activeLotId && (data as any)?.[0]?.id) setActiveLotId((data as any)[0].id);
    }
    loadLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLot = lots.find((l) => l.id === activeLotId);

  React.useEffect(() => {
    async function loadForLot() {
      if (!activeLotId) return;
      setIsLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();

        const [{ data: mv }, { data: lotRow }] = await Promise.all([
          supabase
            .from("movements")
            .select("id, lot_id, from_location_id, to_location_id, weight_kg_dispatched, weight_kg_received, weight_variance_kg, dispatched_at, received_at, transport_mode, vehicle_id, driver_name, dispatched_by, received_by, status, notes, created_at")
            .eq("lot_id", activeLotId)
            .order("created_at", { ascending: true }),
          supabase
            .from("lots")
            .select("id, organization_id, farmer_group_ids")
            .eq("id", activeLotId)
            .single(),
        ]);

        const farmerIds = ((lotRow as any)?.farmer_group_ids ?? []) as string[];
        const { data: fr } = farmerIds.length
          ? await supabase
              .from("farmers")
              .select("id, full_name, national_id, phone, gender, organization_id, county, district, village, latitude, longitude, registration_date, registered_by, notes, created_at")
              .in("id", farmerIds)
          : { data: [] as any[] };

        const { data: pl } = farmerIds.length
          ? await supabase
              .from("plots")
              .select("id, farmer_id, commodity, area_hectares, polygon_geojson, center_latitude, center_longitude, land_tenure, planting_year, deforestation_check_status, deforestation_check_date, deforestation_check_notes, county, district, village, created_at, registered_by")
              .in("farmer_id", farmerIds)
          : { data: [] as any[] };

        // org license row
        if ((lotRow as any)?.organization_id) {
          const { data: o } = await supabase
            .from("organizations")
            .select("name, license_number")
            .eq("id", (lotRow as any).organization_id)
            .single();
          setOrg((o as any) ?? null);
        } else {
          setOrg(null);
        }

        setMovements(((mv as any) ?? []) as any);
        setFarmers(((fr as any) ?? []) as any);
        setPlots(((pl as any) ?? []) as any);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load lot compliance data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadForLot();
  }, [activeLotId]);

  const items: ChecklistItem[] = React.useMemo(() => {
    if (!activeLot) {
      return [];
    }
    const totalFarmers = farmers.length;
    const farmersWithId = farmers.filter((f) => Boolean(f.national_id)).length;

    const totalPlots = plots.length;
    const polygonCount = plots.filter((p) => Boolean(p.polygon_geojson)).length;
    const pointCount = plots.filter((p) => p.center_latitude != null && p.center_longitude != null).length;

    const anyFlagged = plots.some((p) => p.deforestation_check_status === "flagged");
    const anyPending = plots.some((p) => p.deforestation_check_status === "pending");

    const disputed = movements.some((m) => m.status === "disputed");

    const variance = movements
      .filter((m) => m.weight_kg_received != null)
      .map((m) => calculateVariancePct(m.weight_kg_dispatched, Number(m.weight_kg_received ?? 0)));
    const anyOver5 = variance.some((v) => Math.abs(v) > 5);
    const anyWarn = variance.some((v) => Math.abs(v) > 2 && Math.abs(v) <= 5);

    const hasLicense = Boolean(org?.license_number);

    const allFarmersOk = totalFarmers > 0 && farmersWithId === totalFarmers;
    const plotGpsOk = totalPlots > 0 && pointCount === totalPlots;
    const plotGpsWarn = totalPlots > 0 && pointCount === totalPlots && polygonCount !== totalPlots;

    return [
      {
        key: "farmers",
        title: "All contributing farmers registered",
        sub: `${farmersWithId} of ${totalFarmers} farmers · names, IDs, phones on file`,
        state: allFarmersOk ? "ok" : "err",
        pill: allFarmersOk ? { status: "ok", label: "OK" } : { status: "error", label: "Missing IDs" },
      },
      {
        key: "gps",
        title: "Plot GPS coordinates captured",
        sub: `${pointCount} of ${totalPlots} plots · ${polygonCount} polygon, ${Math.max(0, pointCount - polygonCount)} centroid-only`,
        state: plotGpsOk ? (plotGpsWarn ? "warn" : "ok") : "err",
        pill: plotGpsOk
          ? plotGpsWarn
            ? { status: "warning", label: "Centroids" }
            : { status: "ok", label: "Mapped" }
          : { status: "error", label: "Missing GPS" },
      },
      {
        key: "deforestation",
        title: "Deforestation check passed",
        sub: "All plots checked against GFW data post Dec 31, 2020",
        state: anyFlagged ? "err" : anyPending ? "warn" : "ok",
        pill: anyFlagged
          ? { status: "error", label: "Flagged" }
          : anyPending
            ? { status: "warning", label: "Pending" }
            : { status: "ok", label: "Clear" },
      },
      {
        key: "custody",
        title: "Full chain of custody recorded",
        sub: `${movements.length} movements logged`,
        state: disputed ? "err" : movements.length ? "ok" : "warn",
        pill: disputed ? { status: "error", label: "Disputed" } : movements.length ? { status: "ok", label: "OK" } : { status: "warning", label: "Incomplete" },
      },
      {
        key: "variance",
        title: "Weight variance within threshold",
        sub: anyOver5 ? "One or more movements exceed 5% variance" : anyWarn ? "Some movements in 2–5% warning range" : "All movements within tolerance",
        state: anyOver5 ? "err" : anyWarn ? "warn" : "ok",
        pill: anyOver5 ? { status: "error", label: ">5%" } : anyWarn ? { status: "warning", label: "2–5%" } : { status: "ok", label: "≤2%" },
      },
      {
        key: "license",
        title: "Exporter license on file",
        sub: org ? `${org.name} · ${org.license_number ?? "no license"}` : "Organization unknown",
        state: hasLicense ? "ok" : "err",
        pill: hasLicense ? { status: "ok", label: "OK" } : { status: "error", label: "Missing" },
      },
    ];
  }, [activeLot, farmers, plots, movements, org]);

  const okOrWarn = items.length && items.every((i) => i.state === "ok" || i.state === "warn");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="font-display text-[16px] text-gray-900">EUDR checklist</div>
              <div className="text-[12px] text-gray-500">Per-lot due diligence status.</div>
            </div>
            <div className="w-full sm:w-[320px]">
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Lot</div>
              <select
                value={activeLotId}
                onChange={(e) => setActiveLotId(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_code} · {l.compliance_status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? <AlertBanner severity="danger" message={error} /> : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse flex items-center gap-3">
                    <div className="h-[18px] w-[18px] rounded-md bg-gray-100" />
                    <div className="flex-1">
                      <div className="h-3 w-52 bg-gray-100 rounded" />
                      <div className="mt-1 h-3 w-72 bg-gray-100 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                ))
              : items.map((it) => (
                  <div key={it.key} className="flex items-start gap-3">
                    <IconSquare state={it.state} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-900">{it.title}</div>
                      <div className="text-[10px] text-gray-500">{it.sub}</div>
                    </div>
                    <StatusPill status={it.pill.status} label={it.pill.label} />
                  </div>
                ))}
          </div>

          {okOrWarn ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={downloadBusy || !activeLot}
                onClick={async () => {
                  if (!activeLot) return;
                  setDownloadBusy(true);
                  try {
                    const res = await fetch("/api/reports/dds", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ lotId: activeLot.id }),
                    });
                    if (!res.ok) throw new Error("DDS generation failed.");
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${activeLot.lot_code}-DDS.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Download failed.");
                  } finally {
                    setDownloadBusy(false);
                  }
                }}
                className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
              >
                {downloadBusy ? "Generating…" : "Generate DDS report PDF"}
              </button>
              <button
                type="button"
                className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              >
                Send to buyer
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <ComplianceRing
          compliant={items.filter((i) => i.state === "ok").length}
          pending={items.filter((i) => i.state === "warn").length}
          flagged={items.filter((i) => i.state === "err").length}
          unchecked={Math.max(0, 6 - items.length)}
          checklistItems={[
            { label: "Farmers", pct: farmers.length ? (farmers.filter((f) => Boolean(f.national_id)).length / farmers.length) * 100 : 0 },
            { label: "GPS", pct: plots.length ? (plots.filter((p) => p.center_latitude != null && p.center_longitude != null).length / plots.length) * 100 : 0 },
            { label: "Deforestation", pct: plots.length ? (plots.filter((p) => p.deforestation_check_status === "clear").length / plots.length) * 100 : 0 },
            { label: "Custody", pct: movements.length ? (movements.filter((m) => m.status === "received").length / movements.length) * 100 : 0 },
          ]}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-display text-[15px] text-gray-900">Buyer due diligence history</div>
          <div className="mt-2 text-[12px] text-gray-600">MVP placeholder.</div>
          <div className="mt-3 space-y-2 text-[12px]">
            {[
              { buyer: "EU Buyer A", status: "Reviewed", date: "Apr 2026" },
              { buyer: "EU Buyer B", status: "Pending", date: "Apr 2026" },
              { buyer: "EU Buyer C", status: "Cleared", date: "Mar 2026" },
            ].map((b) => (
              <div key={b.buyer} className="flex items-center justify-between">
                <div className="text-gray-800">{b.buyer}</div>
                <div className="font-mono text-[11px] text-gray-500">{b.status} · {b.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

