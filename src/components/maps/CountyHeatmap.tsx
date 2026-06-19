"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import "mapbox-gl/dist/mapbox-gl.css";

import { MINISTRY_COUNTY_METRICS } from "@/lib/data/ministry-canonical-data";
import { buildCountyMetricPointsGeoJSON, countyKey, enrichCountyPolygons } from "@/lib/gis/gis-intelligence-data";
import { fetchLiberiaCountiesGeoJSON } from "@/lib/gis/liberia-county-geo";
import { LIBERIA_CENTER, LIBERIA_ZOOM, mapboxToken } from "@/lib/mapbox/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { seasonLabel } from "@/lib/utils/rice";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

type FeatureProps = { name?: string; COUNTY?: string; county?: string; [k: string]: unknown };

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
  const router = useRouter();
  const [geojson, setGeojson] = React.useState<any>(null);
  const [boundaryMissing, setBoundaryMissing] = React.useState(false);
  const [hover, setHover] = React.useState<{
    county: string;
    productionMt: number;
    productionIndex: number;
    riskScore: number;
    warehouseUtil: number;
    daoPct: number;
    x: number;
    y: number;
  } | null>(null);
  const [season] = React.useState(seasonLabel());
  const metricPoints = React.useMemo(() => buildCountyMetricPointsGeoJSON(), []);

  React.useEffect(() => {
    async function load() {
      const raw = await fetchLiberiaCountiesGeoJSON();
      setBoundaryMissing(!raw?.features?.length);

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("rice_production_records").select("county, actual_yield_kg").eq("season", season).limit(5000);

      const { data: pilotMetrics } = await supabase.from("pilot_county_metrics").select("county,production_index").limit(100);

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

      if (!raw?.features?.length) {
        setGeojson(null);
        return;
      }

      const enriched = enrichCountyPolygons(
        { type: "FeatureCollection", features: raw.features as Array<{ properties?: Record<string, unknown> }> },
        metricPoints,
      );

      const withProps = {
        ...enriched,
        features: enriched.features.map((f: any) => {
          const p = (f.properties ?? {}) as FeatureProps;
          const countyName = (p.countyName ?? p.county ?? p.COUNTY ?? p.name ?? "Unknown") as string;
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
              production_index: Number(p.production_index ?? 0),
              food_risk_score: Number(p.food_risk_score ?? 0),
              warehouse_utilization_avg: Number(p.warehouse_utilization_avg ?? 0),
              dao_compliance: Number(p.dao_compliance ?? 0),
            },
          };
        }),
      };

      setGeojson(withProps);
    }
    load();
  }, [season, metricPoints]);

  const onMove = (e: any) => {
    const f = e.features?.[0];
    if (!f) return setHover(null);
    const props = (f.properties ?? {}) as any;
    const county = (props.countyName ?? props.name ?? props.COUNTY ?? "Unknown") as string;
    const mt = Number(props.production_mt ?? 0);
    setHover({
      county,
      productionMt: mt,
      productionIndex: Number(props.production_index ?? 0),
      riskScore: Number(props.food_risk_score ?? 0),
      warehouseUtil: Number(props.warehouse_utilization_avg ?? 0),
      daoPct: Number(props.dao_compliance ?? 0),
      x: e.point.x,
      y: e.point.y,
    });
  };

  const onCountyClick = (e: any) => {
    const f = e.features?.[0];
    if (!f) return;
    const props = (f.properties ?? {}) as any;
    const county = (props.countyName ?? props.county ?? props.name ?? "") as string;
    if (county && county !== "Unknown") {
      router.push(`/map?county=${encodeURIComponent(county)}`);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="font-display text-[16px] text-white">County heatmap</div>
        <div className="text-[12px] text-slate-400">Rice production choropleth · Season {season}</div>
      </div>
      <div className="relative h-[420px]">
        <MapGL
          mapboxAccessToken={mapboxToken()}
          initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={geojson?.features?.length ? ["counties-fill"] : []}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onClick={onCountyClick}
          cursor={geojson?.features?.length ? "pointer" : "grab"}
        >
          {geojson?.features?.length ? (
            <Source id="counties" type="geojson" data={geojson}>
              <Layer {...fillLayer} />
              <Layer {...lineLayer} />
            </Source>
          ) : null}
        </MapGL>

        {hover ? (
          <div
            className="absolute pointer-events-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] shadow-sm z-10"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            <div className="font-medium text-gray-900">{hover.county}</div>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] text-gray-600">
              <dt>Production</dt>
              <dd className="text-right text-emerald-700">
                {hover.productionMt.toFixed(1)} MT · idx {hover.productionIndex}
              </dd>
              <dt>Risk score</dt>
              <dd className="text-right">{hover.riskScore}</dd>
              <dt>Warehouse util.</dt>
              <dd className="text-right">{hover.warehouseUtil}%</dd>
              <dt>DAO reporting</dt>
              <dd className="text-right">{hover.daoPct}%</dd>
            </dl>
          </div>
        ) : null}

        {boundaryMissing ? (
          <div className="absolute inset-0 grid place-items-center pointer-events-none z-[5]">
            <div className="rounded-lg bg-white/95 border border-amber-200 px-4 py-2 text-[12px] text-amber-950 max-w-sm text-center">
              County boundaries unavailable ({`public/data/liberia-counties.geojson`}). Metrics and registry feeds remain operational; restore the
              file to enable the choropleth.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
