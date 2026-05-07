"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import type { CountySurfaceMode, GisOverlayToggles } from "@/lib/gis/gis-intelligence-data";
import {
  buildCountyMetricPointsGeoJSON,
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
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { optionalMapboxToken } from "@/lib/mapbox/config";

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
  const token = optionalMapboxToken();
  const [surfaceMode, setSurfaceMode] = React.useState<CountySurfaceMode>("production_heatmap");
  const [overlays, setOverlays] = React.useState<GisOverlayToggles>({
    farmerDensity: true,
    warehouses: true,
    subsidyDistribution: true,
    daoReportingPulse: true,
    pestOutbreaks: true,
    inventoryMovementRoutes: true,
    transferRoutes: true,
  });

  const [countyGeo, setCountyGeo] = React.useState<Record<string, unknown> | null>(null);
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);
  const [countySel, setCountySel] = React.useState<string | null>(null);
  const [whSel, setWhSel] = React.useState<string | null>(null);

  const metricPoints = React.useMemo(() => buildCountyMetricPointsGeoJSON(), []);
  const warehousePoints = React.useMemo(() => buildWarehousePointsGeoJSON(), []);
  const pestPoints = React.useMemo(() => buildPestEventsGeoJSON(), []);
  const movementLines = React.useMemo(() => buildInventoryMovementRoutesGeoJSON(), []);
  const subsidyLines = React.useMemo(() => buildSubsidyFlowLinesGeoJSON(), []);
  const transferLines = React.useMemo(() => buildTransferLines(transfers), [transfers]);

  React.useEffect(() => {
    void listTransferOrders().then(setTransfers);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/liberia-counties.geojson");
        const raw = (await res.json()) as { type?: string; features?: unknown[] };
        if (cancelled || !raw?.features?.length) {
          if (!cancelled) setCountyGeo(null);
          return;
        }
        const enriched = enrichCountyPolygons(
          { type: "FeatureCollection", features: raw.features as Array<{ properties?: Record<string, unknown> }> },
          metricPoints,
        );
        setCountyGeo(enriched as unknown as Record<string, unknown>);
      } catch {
        if (!cancelled) setCountyGeo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [metricPoints]);

  React.useEffect(() => {
    const onCounty = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d) {
        setCountySel(d);
        setWhSel(null);
      }
    };
    const onWh = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d) {
        setWhSel(d);
        setCountySel(null);
      }
    };
    window.addEventListener("gis-county-select", onCounty as EventListener);
    window.addEventListener("gis-warehouse-select", onWh as EventListener);
    return () => {
      window.removeEventListener("gis-county-select", onCounty as EventListener);
      window.removeEventListener("gis-warehouse-select", onWh as EventListener);
    };
  }, []);

  const countyMetric = countySel ? countyProductionMetric(countySel) : null;
  const warehousesInCounty = countySel ? countyWarehouses(countySel) : [];
  const daoRows = countySel ? countyDaoMetrics(countySel) : [];
  const alerts = countySel ? countyAlerts(countySel) : [];

  const whTransfers = whSel ? transfers.filter((t) => t.fromMinistryCode === whSel || t.toMinistryCode === whSel).slice(0, 12) : [];
  const whStock = whSel ? warehouseInventory(whSel).filter((l) => l.stockStatus.toLowerCase().includes("low")) : [];
  const whInv = whSel ? warehouseInventory(whSel) : [];
  const whDistricts = whSel ? warehouseDistricts(whSel) : [];

  const railSummary = React.useMemo(() => {
    const c = metricPoints.features.length;
    const wh = warehousePoints.features.length;
    const routes = movementLines.features.length + transferLines.features.length;
    return { counties: c, warehouses: wh, routes };
  }, [metricPoints.features.length, warehousePoints.features.length, movementLines.features.length, transferLines.features.length]);

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
          <Link href="/inventory/transfers" className="rounded-lg bg-emerald-700/90 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600">
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
                ["production_heatmap", "Production heatmap"],
                ["food_security", "Food security risk"],
                ["dao_compliance", "DAO reporting compliance"],
                ["county_risk", "County risk scoring"],
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
              checked={overlays.farmerDensity}
              onChange={(v) => setOverlays((o) => ({ ...o, farmerDensity: v }))}
              label="Farmer density"
              hint="Weighted heat from registry clustering"
            />
            <Toggle
              checked={overlays.warehouses}
              onChange={(v) => setOverlays((o) => ({ ...o, warehouses: v }))}
              label="Warehouse locations"
            />
            <Toggle
              checked={overlays.subsidyDistribution}
              onChange={(v) => setOverlays((o) => ({ ...o, subsidyDistribution: v }))}
              label="Subsidy distribution"
              hint="Animated flows from priority hubs"
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
            <Toggle
              checked={overlays.inventoryMovementRoutes}
              onChange={(v) => setOverlays((o) => ({ ...o, inventoryMovementRoutes: v }))}
              label="Inventory movement routes"
              hint="Animated dashed corridors"
            />
            <Toggle
              checked={overlays.transferRoutes}
              onChange={(v) => setOverlays((o) => ({ ...o, transferRoutes: v }))}
              label="Transfer workflow routes"
            />
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-slate-600">
            Animations run on corridor layers when subsidies, movements, transfers, or DAO pulse are enabled.
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
              warehousePoints={warehousePoints as unknown as Record<string, unknown>}
              pestPoints={pestPoints as unknown as Record<string, unknown>}
              movementLines={movementLines as unknown as Record<string, unknown>}
              subsidyLines={subsidyLines as unknown as Record<string, unknown>}
              transferLines={transferLines as unknown as Record<string, unknown>}
              surfaceMode={surfaceMode}
              overlays={overlays}
            />
          )}

          {countySel ? (
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md md:left-auto md:right-4 md:top-16 md:max-h-[calc(100%-5rem)] md:w-[min(100%,380px)] md:max-w-[92vw]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/80">County drawer</div>
                  <h3 className="font-display text-[16px] font-semibold text-white">{countySel}</h3>
                </div>
                <button type="button" onClick={() => setCountySel(null)} className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10">
                  Close
                </button>
              </div>
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
                <button type="button" onClick={() => setWhSel(null)} className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10">
                  Close
                </button>
              </div>
              <Link href={`/inventory/warehouse/${encodeURIComponent(whSel)}`} className="mt-2 inline-block text-[11px] text-emerald-400 hover:text-emerald-300">
                Open warehouse detail →
              </Link>
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
          <div className="text-[10px] text-slate-600">
            Polygon boundaries load from <span className="font-mono">public/data/liberia-counties.geojson</span> when populated; centroid
            intelligence remains active regardless.
          </div>
        </aside>
      </div>
    </div>
  );
}
