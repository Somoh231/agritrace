"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { LIBERIA_CENTER, LIBERIA_ZOOM, optionalMapboxToken } from "@/lib/mapbox/config";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Marker), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

function coordsForMinistryCode(code: string): [number, number] | null {
  const w = MINISTRY_WAREHOUSES.find((x) => x.ministryCode === code);
  return w ? [w.longitude, w.latitude] : null;
}

export default function LogisticsNetworkMap() {
  const token = optionalMapboxToken();
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);

  React.useEffect(() => {
    void listTransferOrders().then(setTransfers);
  }, []);

  const routeGeoJson = React.useMemo(() => {
    const features: Array<{
      type: "Feature";
      properties: { code: string; status: string };
      geometry: { type: "LineString"; coordinates: [number, number][] };
    }> = [];
    for (const t of transfers) {
      if (!["approved", "dispatched", "in_transit", "delivered"].includes(t.status)) continue;
      const a = coordsForMinistryCode(t.fromMinistryCode);
      const b = coordsForMinistryCode(t.toMinistryCode);
      if (!a || !b) continue;
      features.push({
        type: "Feature",
        properties: { code: t.transferCode, status: t.status },
        geometry: { type: "LineString", coordinates: [a, b] },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [transfers]);

  const bottleneckCodes = React.useMemo(() => {
    const set = new Set<string>();
    for (const w of MINISTRY_WAREHOUSES) {
      if (w.utilizationPct >= 88) set.add(w.ministryCode);
    }
    return set;
  }, []);

  if (!token) {
    return (
      <section id="logistics-map" className="scroll-mt-24 rounded-xl border border-slate-700/80 bg-slate-950/45 p-4">
        <div className="font-display text-[14px] font-semibold text-white">Logistics network map</div>
        <p className="mt-2 text-[12px] text-slate-400">
          Add <span className="font-mono text-slate-300">NEXT_PUBLIC_MAPBOX_TOKEN</span> to visualize warehouse anchors, active transfer routes, and bottleneck hubs.
          Active corridors from workflow:{" "}
          <span className="font-mono text-emerald-300/90">{transfers.filter((t) => t.status === "in_transit").length}</span> in transit.
        </p>
      </section>
    );
  }

  return (
    <section id="logistics-map" className="scroll-mt-24 rounded-xl border border-slate-700/80 bg-slate-950/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-display text-[14px] font-semibold text-white">Logistics network map</div>
          <p className="mt-1 max-w-xl text-[11px] text-slate-400">
            Warehouses · approved / dispatched / in-transit / delivered corridors · high utilization hubs ringed as bottlenecks.
          </p>
        </div>
      </div>
      <div className="mt-3 h-[300px] overflow-hidden rounded-lg border border-slate-800">
        <MapGL
          mapboxAccessToken={token}
          initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <Source id="routes-src" type="geojson" data={routeGeoJson}>
            <Layer
              id="routes"
              type="line"
              paint={{
                "line-color": ["match", ["get", "status"], "in_transit", "#38bdf8", "dispatched", "#fbbf24", "#94a3b8"],
                "line-width": 3,
                "line-opacity": 0.85,
              }}
            />
          </Source>
          {MINISTRY_WAREHOUSES.map((w) => (
            <Marker key={w.ministryCode} longitude={w.longitude} latitude={w.latitude} anchor="center">
              <div
                title={`${w.ministryCode} · ${w.utilizationPct}%`}
                className={`h-3 w-3 rounded-full ring-2 ring-slate-950 ${bottleneckCodes.has(w.ministryCode) ? "bg-rose-400" : "bg-sky-400"}`}
              />
            </Marker>
          ))}
        </MapGL>
      </div>
    </section>
  );
}
