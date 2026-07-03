"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { EmptyState } from "@/components/enterprise";
import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import { daoMarkersForCounty, pestAlertMarkers, riskHotspotsForCounty, warehouseMarkersForCounty, type CaoMapMarker } from "@/lib/cao/cao-map-markers";
import { MINISTRY_COUNTY_METRICS } from "@/lib/data/ministry-canonical-data";
import { normalizeCountyKey } from "@/lib/data/ministry-data-service";
import { LIBERIA_CENTER, LIBERIA_ZOOM, optionalMapboxToken } from "@/lib/mapbox/config";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Marker), { ssr: false });

function markerColor(kind: CaoMapMarker["kind"]): string {
  switch (kind) {
    case "warehouse":
      return "#38bdf8";
    case "dao":
      return "#34d399";
    case "risk":
      return "#fb7185";
    case "pest":
      return "#fbbf24";
    default:
      return "#94a3b8";
  }
}

export default function CaoCountyOperationsMap({
  county,
  daoRows,
}: {
  county: string | null;
  daoRows: DaoOversightRow[];
}) {
  const token = optionalMapboxToken();
  const nk = normalizeCountyKey(county);
  const countyMetric = MINISTRY_COUNTY_METRICS.find((m) => normalizeCountyKey(m.county) === nk);

  const markers = React.useMemo(() => {
    const wh = warehouseMarkersForCounty(county);
    const dao = daoMarkersForCounty(county, daoRows);
    const risk = riskHotspotsForCounty(county, daoRows);
    const pest = pestAlertMarkers(county);
    return [...wh, ...dao, ...risk, ...pest];
  }, [county, daoRows]);

  const initialView = React.useMemo(() => {
    const lat = countyMetric?.lat ?? LIBERIA_CENTER.latitude;
    const lng = countyMetric?.lng ?? LIBERIA_CENTER.longitude;
    return { longitude: lng, latitude: lat, zoom: nk ? 7.85 : LIBERIA_ZOOM };
  }, [countyMetric, nk]);

  if (!token) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-[15px] font-semibold text-ink-900">County operations map</h2>
        <p className="mt-2 text-[12px] text-slate-600">
          Configure <span className="font-mono text-slate-800">NEXT_PUBLIC_MAPBOX_TOKEN</span> to enable interactive layers (DAO districts, warehouses, risk &
          pest cues). Below is the scoped marker manifest for your county.
        </p>
        {markers.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No markers in scope" description="County map markers appear when DAO and warehouse signals are available." />
          </div>
        ) : (
          <ul className="mt-4 max-h-[280px] space-y-2 overflow-y-auto text-[12px] text-slate-700">
            {markers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="font-medium text-ink-900">{m.label}</span>
                <span className="font-mono text-[10px] text-slate-500">{m.kind}</span>
                {m.meta ? <span className="w-full text-[11px] text-slate-500">{m.meta}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900">County operations map</h2>
          <p className="mt-1 max-w-xl text-[12px] text-slate-600">
            Warehouses (sky), DAO anchors (emerald), sync-risk hotspots (rose), pest escalations (amber).
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> Warehouse
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> DAO
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Risk
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Pest
          </span>
        </div>
      </div>
      <div className="mt-4 h-[340px] overflow-hidden rounded-lg border border-slate-200">
        <MapGL
          mapboxAccessToken={token}
          initialViewState={initialView}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          {markers.map((m) => (
            <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="bottom">
              <div title={m.meta ?? m.label} className="h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: markerColor(m.kind) }} />
            </Marker>
          ))}
        </MapGL>
      </div>
    </section>
  );
}
