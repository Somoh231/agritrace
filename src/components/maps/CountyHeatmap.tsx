"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { MINISTRY_COUNTY_METRICS } from "@/lib/data/ministry-canonical-data";
import { LIBERIA_CENTER, LIBERIA_ZOOM, mapboxToken } from "@/lib/mapbox/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { seasonLabel } from "@/lib/utils/rice";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

type FeatureProps = { name?: string; COUNTY?: string; county?: string; [k: string]: unknown };

function countyKey(name: string) {
  return name.trim().toLowerCase();
}

const fillLayer = {
  id: "counties-fill",
  type: "fill",
  paint: {
    "fill-opacity": 0.65,
    "fill-color": [
      "interpolate",
      ["linear"],
      ["coalesce", ["get", "production_mt"], 0],
      0,
      "#eaf7ec",
      20,
      "#c4edcb",
      60,
      "#8dd99a",
      120,
      "#5bbf6e",
      240,
      "#3d9e52",
      360,
      "#2d7a3e",
    ],
  },
} as any;

const lineLayer = {
  id: "counties-line",
  type: "line" as const,
  paint: {
    "line-color": "#0f2e14",
    "line-width": 1,
    "line-opacity": 0.5,
  },
};

export default function CountyHeatmap() {
  const [geojson, setGeojson] = React.useState<any>(null);
  const [hover, setHover] = React.useState<{ county: string; mt: number; x: number; y: number } | null>(null);
  const [season] = React.useState(seasonLabel());

  React.useEffect(() => {
    async function load() {
      const res = await fetch("/data/liberia-counties.geojson");
      const base = await res.json();

      // Pull rice production by county for current season.
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("rice_production_records")
        .select("county, actual_yield_kg")
        .eq("season", season)
        .limit(5000);

      const { data: pilotMetrics } = await supabase
        .from("pilot_county_metrics")
        .select("county,production_index")
        .limit(100);

      const totals = new globalThis.Map<string, number>();
      for (const r of (data as any[]) ?? []) {
        const c = (r.county ?? "Unknown") as string;
        const kg = Number(r.actual_yield_kg ?? 0);
        totals.set(c, (totals.get(c) ?? 0) + kg);
      }

      const pilotByCounty = new globalThis.Map<string, number>();
      for (const r of (pilotMetrics as any[]) ?? []) {
        const c = String(r.county ?? "");
        if (!c) continue;
        pilotByCounty.set(countyKey(c), Number(r.production_index ?? 0));
      }
      if (pilotByCounty.size === 0) {
        for (const m of MINISTRY_COUNTY_METRICS) {
          pilotByCounty.set(countyKey(m.county), m.productionIndex);
        }
      }

      const withProps = {
        ...base,
        features: (base.features ?? []).map((f: any) => {
          const p = (f.properties ?? {}) as FeatureProps;
          const countyName = (p.county ?? p.COUNTY ?? p.name ?? "Unknown") as string;
          const kg = totals.get(countyName) ?? 0;
          let mt = Math.round((kg / 1000) * 10) / 10;
          if (mt === 0) {
            const idx = pilotByCounty.get(countyKey(countyName));
            if (idx != null && idx > 0) mt = Math.round(idx * 8 * 10) / 10;
          }
          return {
            ...f,
            properties: {
              ...p,
              countyName,
              production_mt: mt,
            },
          };
        }),
      };

      setGeojson(withProps);
    }
    load();
  }, [season]);

  const onMove = (e: any) => {
    const f = e.features?.[0];
    if (!f) return setHover(null);
    const props = (f.properties ?? {}) as any;
    const county = (props.countyName ?? props.name ?? props.COUNTY ?? "Unknown") as string;
    const mt = Number(props.production_mt ?? 0);
    setHover({ county, mt, x: e.point.x, y: e.point.y });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="font-display text-[16px] text-gray-900">County heatmap</div>
        <div className="text-[12px] text-gray-500">Rice production choropleth · Season {season}</div>
      </div>
      <div className="relative h-[420px]">
        <MapGL
          mapboxAccessToken={mapboxToken()}
          initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={["counties-fill"]}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {geojson ? (
            <Source id="counties" type="geojson" data={geojson}>
              <Layer {...fillLayer} />
              <Layer {...lineLayer} />
            </Source>
          ) : null}
        </MapGL>

        {hover ? (
          <div
            className="absolute pointer-events-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] shadow-sm"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            <div className="font-medium text-gray-900">{hover.county}</div>
            <div className="font-mono text-gray-600">{hover.mt.toFixed(1)} MT</div>
          </div>
        ) : null}

        {(geojson?.features?.length ?? 0) === 0 ? (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="rounded-lg bg-white/90 border border-gray-200 px-4 py-2 text-[12px] text-gray-600">
              Add real Liberia county GeoJSON to <span className="font-mono">public/data/liberia-counties.geojson</span>.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

