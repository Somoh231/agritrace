"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { CountyHoverDetail, CountySurfaceMode, GisOverlayToggles } from "@/lib/gis/gis-intelligence-data";
import {
  buildCountyMetricPointsGeoJSON,
  buildDaoOfficePointsGeoJSON,
  buildInventoryMovementRoutesGeoJSON,
  buildPestEventsGeoJSON,
  buildSubsidyFlowLinesGeoJSON,
  buildWarehousePointsGeoJSON,
  countyAlerts,
  countyDaoMetrics,
  countyProductionMetric,
  countyWarehouses,
  enrichCountyPolygons,
  warehouseDistricts,
  warehouseInventory,
} from "@/lib/gis/gis-intelligence-data";
import { fetchLiberiaCountiesGeoJSON } from "@/lib/gis/liberia-county-geo";
import { useTransferOrders } from "@/features/transfers/hooks/use-transfer-orders";
import type { TransferOrderView } from "@/lib/logistics/types";
import { MINISTRY_FARMERS, MINISTRY_OPERATIONAL_EVENTS, MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { optionalMapboxToken } from "@/lib/mapbox/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const GisIntelligenceMap = dynamic(() => import("@/components/gis/GisIntelligenceMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-900/80" aria-hidden />,
});

function coordsForMinistryCode(code: string): [number, number] | null {
  const w = MINISTRY_WAREHOUSES.find((x) => x.ministryCode === code);
  return w ? [w.longitude, w.latitude] : null;
}

function buildTransferLines(transfers: TransferOrderView[]) {
  const features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }> = [];
  for (const t of transfers) {
    if (!["approved", "dispatched", "in_transit", "delivered", "requested"].includes(t.status)) continue;
    const a = coordsForMinistryCode(t.fromMinistryCode);
    const b = coordsForMinistryCode(t.toMinistryCode);
    if (!a || !b) continue;
    features.push({
      type: "Feature",
      properties: { code: t.transferCode, status: t.status, sku: t.sku },
      geometry: { type: "LineString", coordinates: [a, b] },
    });
  }
  return { type: "FeatureCollection" as const, features };
}

function Toggle({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 hover:bg-white/[0.04]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-emerald-500" />
      <span>
        <span className="block text-[12px] text-slate-200">{label}</span>
        {hint ? <span className="mt-0.5 block text-[10px] leading-snug text-slate-600">{hint}</span> : null}
      </span>
    </label>
  );
}

export default function GisIntelligenceWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = optionalMapboxToken();
  const [surfaceMode, setSurfaceMode] = React.useState<CountySurfaceMode>("rice_production");
  const [overlays, setOverlays] = React.useState<GisOverlayToggles>({
    logisticsCorridors: true,
    farmerDensity: true,
    warehouses: true,
    daoOffices: true,
    subsidyDistribution: true,
    daoReportingPulse: true,
    pestOutbreaks: true,
  });

  const [countyGeo, setCountyGeo] = React.useState<Record<string, unknown> | null>(null);
  const { data: transfers = [] } = useTransferOrders();
  const [countySel, setCountySel] = React.useState<string | null>(null);
  const [whSel, setWhSel] = React.useState<string | null>(null);
  const [transferSel, setTransferSel] = React.useState<string | null>(null);
  const [countyHover, setCountyHover] = React.useState<CountyHoverDetail | null>(null);

  const metricPoints = React.useMemo(() => buildCountyMetricPointsGeoJSON(), []);
  const canonicalWarehouseGeo = React.useMemo(() => buildWarehousePointsGeoJSON(), []);
  const [warehouseGeo, setWarehouseGeo] = React.useState(canonicalWarehouseGeo);
  const daoPoints = React.useMemo(() => buildDaoOfficePointsGeoJSON(), []);
  const pestPoints = React.useMemo(() => buildPestEventsGeoJSON(), []);
  const movementLines = React.useMemo(() => buildInventoryMovementRoutesGeoJSON(), []);
  const subsidyLines = React.useMemo(() => buildSubsidyFlowLinesGeoJSON(), []);
  const transferLines = React.useMemo(() => buildTransferLines(transfers), [transfers]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await fetchLiberiaCountiesGeoJSON();
      if (cancelled) return;
      if (!raw?.features?.length) {
        setCountyGeo(null);
        return;
      }
      const enriched = enrichCountyPolygons({ type: "FeatureCollection", features: raw.features }, metricPoints);
      setCountyGeo(enriched as unknown as Record<string, unknown>);
    })();
    return () => {
      cancelled = true;
    };
  }, [metricPoints]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("warehouses")
          .select("ministry_code,name,county,latitude,longitude,utilization_pct,donor_resupply_flag")
          .not("latitude", "is", null)
          .not("longitude", "is", null);
        if (cancelled || !data?.length) return;
        const canonByCode = new Map(MINISTRY_WAREHOUSES.map((w) => [w.ministryCode, w]));
        const features = (data as Array<Record<string, unknown>>)
          .filter((r) => r.latitude != null && r.longitude != null)
          .map((r) => {
            const code = String(r.ministry_code ?? "");
            const fallback = canonByCode.get(code);
            return {
              type: "Feature" as const,
              properties: {
                code: code || String(r.name ?? ""),
                name: r.name,
                county: r.county,
                utilization: Number(r.utilization_pct ?? fallback?.utilizationPct ?? 0),
                donor_resupply: Boolean(r.donor_resupply_flag ?? fallback?.donorResupplyFlag ?? false),
                operational_status: String(fallback?.operationalStatus ?? r.operational_status ?? "—"),
                verification_backlog: MINISTRY_FARMERS.filter(
                  (f) => f.verification === "Pending" && f.primaryWarehouseCode === code,
                ).length,
                stock_pressure:
                  Number(r.utilization_pct ?? fallback?.utilizationPct ?? 0) >= 85 ? "elevated" : "nominal",
              },
              geometry: {
                type: "Point" as const,
                coordinates: [Number(r.longitude), Number(r.latitude)] as [number, number],
              },
            };
          });
        if (features.length) setWarehouseGeo({ type: "FeatureCollection", features });
      } catch {
        /* keep canonical fixtures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const c = searchParams.get("county");
    setCountySel(c ? decodeURIComponent(c) : null);
  }, [searchParams]);

  const openCountyIntel = React.useCallback(
    (name: string) => {
      setCountySel(name);
      setWhSel(null);
      setTransferSel(null);
      router.replace(`/gis-intelligence?county=${encodeURIComponent(name)}`, { scroll: false });
    },
    [router],
  );

  const closeCountyIntel = React.useCallback(() => {
    setCountySel(null);
    setTransferSel(null);
    router.replace("/gis-intelligence", { scroll: false });
  }, [router]);

  React.useEffect(() => {
    const onCounty = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d) openCountyIntel(d);
    };
    const onWh = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d) {
        setWhSel(d);
        setCountySel(null);
        setTransferSel(null);
        router.replace("/gis-intelligence", { scroll: false });
      }
    };
    const onTrf = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d) {
        setTransferSel(d);
        setCountySel(null);
        setWhSel(null);
        router.replace("/gis-intelligence", { scroll: false });
      }
    };
    window.addEventListener("gis-county-select", onCounty as EventListener);
    window.addEventListener("gis-warehouse-select", onWh as EventListener);
    window.addEventListener("gis-transfer-select", onTrf as EventListener);
    return () => {
      window.removeEventListener("gis-county-select", onCounty as EventListener);
      window.removeEventListener("gis-warehouse-select", onWh as EventListener);
      window.removeEventListener("gis-transfer-select", onTrf as EventListener);
    };
  }, [openCountyIntel, router]);

  const countyMetric = countySel ? countyProductionMetric(countySel) : null;
  const warehousesInCounty = countySel ? countyWarehouses(countySel) : [];
  const daoRows = countySel ? countyDaoMetrics(countySel) : [];
  const alerts = countySel ? countyAlerts(countySel) : [];
  const countyVerificationBacklog = countySel
    ? MINISTRY_FARMERS.filter((f) => f.verification === "Pending" && f.county === countySel).length
    : 0;
  const countyRecentEvents = countySel
    ? MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.county === countySel).slice(0, 6)
    : [];

  const whTransfers = whSel ? transfers.filter((t) => t.fromMinistryCode === whSel || t.toMinistryCode === whSel).slice(0, 12) : [];
  const whStock = whSel ? warehouseInventory(whSel).filter((l) => l.stockStatus.toLowerCase().includes("low")) : [];
  const whInv = whSel ? warehouseInventory(whSel) : [];
  const whDistricts = whSel ? warehouseDistricts(whSel) : [];
  const whCanon = whSel ? MINISTRY_WAREHOUSES.find((w) => w.ministryCode === whSel) : null;
  const whVerificationBacklog = whSel
    ? MINISTRY_FARMERS.filter((f) => f.verification === "Pending" && f.primaryWarehouseCode === whSel).length
    : 0;
  const trfRow = transferSel ? transfers.find((t) => t.transferCode === transferSel) : undefined;

  const railSummary = React.useMemo(() => {
    const c = metricPoints.features.length;
    const wh = warehouseGeo.features.length;
    const routes = movementLines.features.length + transferLines.features.length;
    return { counties: c, warehouses: wh, routes };
  }, [metricPoints.features.length, warehouseGeo.features.length, movementLines.features.length, transferLines.features.length]);

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-3 md:min-h-[calc(100dvh-8rem)]">
      <header className="shrink-0 rounded-xl border border-emerald-900/35 bg-gradient-to-r from-emerald-950/40 via-slate-950/70 to-slate-950 px-4 py-3 md:flex md:items-center md:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.26em] text-emerald-300/80">GIS intelligence · Mapbox</div>
          <h1 className="font-display text-[clamp(1.15rem,2vw,1.45rem)] font-semibold text-white">National operations map room</h1>
          <p className="mt-1 max-w-2xl text-[12px] text-slate-500">
            Geography-first intelligence — layered heat surfaces, corridors, subsidies, DAO cadence, and pest custody. Click counties or
            warehouses for operational drawers.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
          <Link
            href="/national-heat-map"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-900"
          >
            Legacy heat panels
          </Link>
          <Link href="/transfers" className="rounded-lg bg-emerald-700/90 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600">
            Transfer ledger
          </Link>
        </div>
      </header>

      <div className="flex min-h-[560px] flex-1 flex-col gap-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#050810] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex-row lg:min-h-[620px]">
        <aside className="flex max-h-[40vh] w-full shrink-0 flex-col overflow-y-auto border-b border-white/[0.06] bg-black/35 p-3 lg:max-h-none lg:w-[260px] lg:border-b-0 lg:border-r">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500/85">Surface intelligence</div>
          <div className="mt-2 space-y-1.5">
            {(
              [
                ["rice_production", "Rice production"],
                ["food_security", "Food security risk"],
                ["inventory_pressure", "Inventory / warehouse pressure"],
                ["dao_compliance", "DAO reporting compliance"],
                ["off", "Surface off (routes only)"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSurfaceMode(key)}
                className={`block w-full rounded-lg px-2.5 py-2 text-left text-[12px] transition ${
                  surfaceMode === key ? "bg-emerald-500/15 text-white ring-1 ring-emerald-500/35" : "text-slate-400 hover:bg-white/[0.04]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500/85">Layer overlays</div>
          <div className="mt-2 space-y-1">
            <Toggle
              checked={overlays.logisticsCorridors}
              onChange={(v) => setOverlays((o) => ({ ...o, logisticsCorridors: v }))}
              label="Logistics"
              hint="Inventory movements + transfer corridors"
            />
            <Toggle
              checked={overlays.warehouses}
              onChange={(v) => setOverlays((o) => ({ ...o, warehouses: v }))}
              label="Warehouses"
              hint="Live coordinates from Supabase when configured"
            />
            <Toggle
              checked={overlays.daoOffices}
              onChange={(v) => setOverlays((o) => ({ ...o, daoOffices: v }))}
              label="DAO offices"
              hint="District coordination markers (centroid-jittered until field GPS)"
            />
            <Toggle
              checked={overlays.subsidyDistribution}
              onChange={(v) => setOverlays((o) => ({ ...o, subsidyDistribution: v }))}
              label="Subsidy distribution"
              hint="Animated flows from priority hubs"
            />
            <Toggle
              checked={overlays.farmerDensity}
              onChange={(v) => setOverlays((o) => ({ ...o, farmerDensity: v }))}
              label="Registry density heat"
              hint="Pairs with rice production surface"
            />
            <Toggle
              checked={overlays.daoReportingPulse}
              onChange={(v) => setOverlays((o) => ({ ...o, daoReportingPulse: v }))}
              label="Reporting activity pulse"
            />
            <Toggle
              checked={overlays.pestOutbreaks}
              onChange={(v) => setOverlays((o) => ({ ...o, pestOutbreaks: v }))}
              label="Pest outbreaks"
            />
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-slate-600">
            Production / food security / inventory / DAO choropleths use Surface intelligence above; overlays stack logistics, hubs, and
            subsidy vectors.
          </p>
        </aside>

        <div className="relative min-h-[360px] flex-1 bg-slate-950 lg:min-h-0">
          {!token ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="font-display text-[15px] text-white">Mapbox token required</div>
              <p className="max-w-md text-[12px] text-slate-500">
                Set <span className="font-mono text-slate-400">NEXT_PUBLIC_MAPBOX_TOKEN</span> to activate the GIS workspace. Layers and
                drawers remain documented for readiness reviews.
              </p>
            </div>
          ) : (
            <GisIntelligenceMap
              token={token}
              countyPolygons={countyGeo?.features ? countyGeo : null}
              metricPoints={metricPoints as unknown as Record<string, unknown>}
              warehousePoints={warehouseGeo as unknown as Record<string, unknown>}
              daoPoints={daoPoints as unknown as Record<string, unknown>}
              pestPoints={pestPoints as unknown as Record<string, unknown>}
              movementLines={movementLines as unknown as Record<string, unknown>}
              subsidyLines={subsidyLines as unknown as Record<string, unknown>}
              transferLines={transferLines as unknown as Record<string, unknown>}
              surfaceMode={surfaceMode}
              overlays={overlays}
              onCountyHover={setCountyHover}
            />
          )}

          {countyHover && token ? (
            <div
              className="pointer-events-none absolute z-20 max-w-[240px] rounded-lg border border-white/15 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-200 shadow-xl backdrop-blur-sm"
              style={{ left: countyHover.x + 14, top: countyHover.y + 14 }}
            >
              <div className="font-display text-[13px] font-semibold text-white">{countyHover.county}</div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-400">
                <dt>Production</dt>
                <dd className="text-right text-emerald-300">{countyHover.productionIndex}</dd>
                <dt>Risk score</dt>
                <dd className="text-right text-amber-200/90">{countyHover.riskScore}</dd>
                <dt>Warehouse util.</dt>
                <dd className="text-right text-sky-300">{countyHover.warehouseUtilizationPct}%</dd>
                <dt>DAO reporting</dt>
                <dd className="text-right text-slate-100">{countyHover.daoReportingPct}%</dd>
              </dl>
            </div>
          ) : null}

          {countySel ? (
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md md:left-auto md:right-4 md:top-16 md:max-h-[calc(100%-5rem)] md:w-[min(100%,380px)] md:max-w-[92vw]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/80">County drawer</div>
                  <h3 className="font-display text-[16px] font-semibold text-white">{countySel}</h3>
                </div>
                <button type="button" onClick={closeCountyIntel} className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10">
                  Close
                </button>
              </div>
              <p className="mt-1 font-mono text-[10px] text-slate-600">
                Shareable URL:{" "}
                <Link className="text-emerald-400 hover:text-emerald-300" href={`/gis-intelligence?county=${encodeURIComponent(countySel)}`}>
                  /gis-intelligence?county={encodeURIComponent(countySel)}
                </Link>
              </p>
              {countyMetric ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
                  <dt>Production index</dt>
                  <dd className="text-right text-emerald-300">{countyMetric.productionIndex}</dd>
                  <dt>Food risk</dt>
                  <dd className="text-right text-slate-100">{countyMetric.foodRisk}</dd>
                  <dt>DAO compliance</dt>
                  <dd className="text-right text-slate-100">{countyMetric.daoCompliance}%</dd>
                </dl>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">No pilot metric row for this county label.</p>
              )}
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Warehouses</div>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-300">
                  {warehousesInCounty.length ?
                    warehousesInCounty.map((w) => (
                      <li key={w.ministryCode}>
                        <button
                          type="button"
                          className="text-left font-mono text-emerald-300 hover:underline"
                          onClick={() => {
                            setCountySel(null);
                            setTransferSel(null);
                            setWhSel(w.ministryCode);
                          }}
                        >
                          {w.ministryCode}
                        </button>
                        <span className="text-slate-500"> · {w.utilizationPct}% util</span>
                      </li>
                    ))
                  : <li className="text-slate-600">No coded hubs in county slice.</li>}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">DAO officers</div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                  {daoRows.map((d) => (
                    <li key={d.daoCode}>
                      {d.daoCode} · score {d.complianceScore}% · {d.status}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Verification intelligence</div>
                <div className="mt-2 rounded-lg border border-slate-800 bg-black/35 px-3 py-2 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-500">Registry backlog · </span>
                  <span className={countyVerificationBacklog ? "text-amber-200/90" : "text-slate-500"}>{countyVerificationBacklog}</span> pending
                  farmer artefacts in county scope.
                  <div className="mt-2">
                    <Link href={`/verification-queue?county=${encodeURIComponent(countySel)}`} className="text-emerald-400 hover:text-emerald-300">
                      Open verification queue →
                    </Link>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Operational events</div>
                <ul className="mt-2 space-y-2">
                  {countyRecentEvents.length ?
                    countyRecentEvents.map((ev) => (
                      <li key={ev.eventCode} className="rounded-lg border border-slate-800 bg-black/25 px-2 py-1.5 text-[11px] text-slate-400">
                        <span className="text-slate-500">{ev.occurredAt.slice(0, 10)}</span> · {ev.eventType}: {ev.message}
                      </li>
                    ))
                  : <li className="text-[11px] text-slate-600">No pilot ledger events tagged to this county label.</li>}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Alerts</div>
                <ul className="mt-2 space-y-2">
                  {alerts.length ?
                    alerts.map((a) => (
                      <li key={a.eventCode} className="rounded-lg border border-slate-800 bg-black/30 px-2 py-1.5 text-[11px] text-slate-400">
                        <span className="text-rose-300">{a.severity}</span> · {a.eventType}: {a.message}
                      </li>
                    ))
                  : <li className="text-[11px] text-slate-600">No incidents in pilot ledger.</li>}
                </ul>
              </div>
            </div>
          ) : null}

          {whSel ? (
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md md:left-auto md:right-4 md:top-16 md:max-h-[calc(100%-5rem)] md:w-[min(100%,380px)] md:max-w-[92vw]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-sky-400/80">Warehouse drawer</div>
                  <h3 className="font-display text-[16px] font-semibold text-white">{whSel}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWhSel(null)}
                  className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
              <Link href={`/inventory/warehouse/${encodeURIComponent(whSel)}`} className="mt-2 inline-block text-[11px] text-emerald-400 hover:text-emerald-300">
                Open warehouse detail →
              </Link>
              <div className="mt-3 rounded-lg border border-slate-800 bg-black/35 px-3 py-2 text-[11px] text-slate-400">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Operational posture</div>
                <div className="mt-1">
                  Status:{" "}
                  <span className="text-slate-200">{whCanon?.operationalStatus ?? "—"}</span> · Utilization:{" "}
                  <span className="text-sky-300">{whCanon?.utilizationPct ?? "—"}%</span> · Stock pressure:{" "}
                  <span className={(whCanon?.utilizationPct ?? 0) >= 85 ? "text-amber-200/90" : "text-slate-400"}>
                    {(whCanon?.utilizationPct ?? 0) >= 85 ? "elevated" : "nominal"}
                  </span>
                </div>
                <div className="mt-1">
                  Verification backlog (registry → hub):{" "}
                  <span className={whVerificationBacklog ? "text-amber-200/90" : "text-slate-500"}>{whVerificationBacklog}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`/verification-queue`} className="text-emerald-400 hover:text-emerald-300">
                    National queue →
                  </Link>
                  <Link href={`/transfers`} className="text-emerald-400 hover:text-emerald-300">
                    Transfer trace →
                  </Link>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Inventory snapshot</div>
                <ul className="mt-2 max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-400">
                  {whInv.slice(0, 8).map((l) => (
                    <li key={l.inventoryCode}>
                      {l.sku} · {l.quantity} {l.unit}{" "}
                      <span className={l.stockStatus.toLowerCase().includes("low") ? "text-rose-300" : ""}>({l.stockStatus})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Stockout watch</div>
                <ul className="mt-2 space-y-1 text-[11px] text-rose-200/90">
                  {whStock.length ?
                    whStock.map((l) => (
                      <li key={l.inventoryCode}>
                        {l.sku}: {l.stockStatus}
                      </li>
                    ))
                  : <li className="text-slate-600">No low-stock SKUs flagged.</li>}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Transfers (workflow)</div>
                <ul className="mt-2 space-y-1 font-mono text-[10px] text-slate-400">
                  {whTransfers.length ?
                    whTransfers.map((t) => (
                      <li key={t.transferCode}>
                        {t.transferCode} · {t.status} · {t.sku}
                      </li>
                    ))
                  : <li className="font-sans text-[11px] text-slate-600">No active corridor rows.</li>}
                </ul>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Assigned districts</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {whDistricts.length ?
                    whDistricts.map((d) => (
                      <span key={d} className="rounded-md border border-slate-700 bg-black/40 px-2 py-0.5 text-[10px] text-slate-300">
                        {d}
                      </span>
                    ))
                  : <span className="text-[11px] text-slate-600">No farmer custody mapping.</span>}
                </div>
              </div>
            </div>
          ) : null}

          {transferSel ? (
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md md:left-auto md:right-4 md:top-16 md:max-h-[calc(100%-5rem)] md:w-[min(100%,380px)] md:max-w-[92vw]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-fuchsia-400/85">Transfer corridor</div>
                  <h3 className="font-display text-[16px] font-semibold text-white">{transferSel}</h3>
                </div>
                <button type="button" onClick={() => setTransferSel(null)} className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10">
                  Close
                </button>
              </div>
              {trfRow ?
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
                    <dt>SKU</dt>
                    <dd className="text-right text-slate-200">{trfRow.sku}</dd>
                    <dt>Quantity</dt>
                    <dd className="text-right text-slate-200">{trfRow.quantity}</dd>
                    <dt>Workflow status</dt>
                    <dd className="text-right text-slate-200">{trfRow.status.replace(/_/g, " ")}</dd>
                    <dt>Origin</dt>
                    <dd className="text-right text-emerald-300">{trfRow.fromMinistryCode}</dd>
                    <dt>Destination</dt>
                    <dd className="text-right text-emerald-300">{trfRow.toMinistryCode}</dd>
                  </dl>
                  <div className="mt-4 rounded-lg border border-slate-800 bg-black/35 px-3 py-2 text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Risk posture · </span>
                    {(trfRow.status === "disputed" || trfRow.status === "requested") ?
                      <span className="text-amber-200/90">Elevated oversight — verify custody checkpoints.</span>
                    : <span className="text-slate-500">Nominal corridor monitoring.</span>}
                  </div>
                  <div className="mt-3 space-y-2 text-[11px]">
                    <Link href={`/transfers?code=${encodeURIComponent(transferSel)}`} className="block text-emerald-400 hover:text-emerald-300">
                      Open national transfer trace →
                    </Link>
                    <Link href="/verification-queue" className="block text-emerald-400 hover:text-emerald-300">
                      Linked verification queues →
                    </Link>
                  </div>
                </>
              : <p className="mt-2 text-[11px] text-slate-500">
                  Corridor geometry captured — detailed workflow row not loaded yet. Open the transfer ledger for full custody files.
                </p>
              }
            </div>
          ) : null}
        </div>

        <aside className="flex max-h-[36vh] w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] bg-black/40 p-3 lg:max-h-none lg:w-[280px] lg:border-l lg:border-t-0">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500/85">Operational rail</div>
            <p className="mt-1 text-[11px] text-slate-500">Live geometry counts from pilot fixtures + workflow merges.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center">
              <div className="text-slate-500">Counties</div>
              <div className="text-lg text-white">{railSummary.counties}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center">
              <div className="text-slate-500">Hubs</div>
              <div className="text-lg text-emerald-300">{railSummary.warehouses}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center">
              <div className="text-slate-500">Legs</div>
              <div className="text-lg text-sky-300">{railSummary.routes}</div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-[11px] text-slate-500">
            <div className="font-medium text-slate-400">Legend</div>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" /> Production heat
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 align-middle" /> Warehouse anchor
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" /> DAO office
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400 align-middle" /> Subsidy vector
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" /> Inventory movement
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 align-middle" /> TRF corridor
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-red-400 align-middle" /> Pest signal
              </li>
            </ul>
          </div>
          <div className="text-[10px] leading-snug text-slate-600">
            County polygons: <span className="font-mono text-slate-500">public/data/liberia-counties.geojson</span> (ADM1, CRS84). Missing file
            falls back to centroid intelligence until districts or farm parcels are added as sibling layers.
          </div>
        </aside>
      </div>
    </div>
  );
}
