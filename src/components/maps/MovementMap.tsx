"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { LIBERIA_CENTER, LIBERIA_ZOOM, mapboxToken } from "@/lib/mapbox/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

const routeLayer = {
  id: "routes",
  type: "line",
  paint: {
    "line-color": "#1a4422",
    "line-width": 3,
    "line-opacity": 0.7,
  },
} as any;

export default function MovementMap({ lotId }: { lotId?: string }) {
  const [geo, setGeo] = React.useState<any>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      const { data: movements } = await supabase
        .from("movements")
        .select("id, lot_id, from_location_id, to_location_id, dispatched_at, lots(lot_code)")
        .order("created_at", { ascending: true })
        .limit(1000);

      const filtered = lotId
        ? ((movements as any[]) ?? []).filter((m) => m.lot_id === lotId)
        : ((movements as any[]) ?? []);

      const locIds = new Set<string>();
      for (const m of filtered) {
        if (m.from_location_id) locIds.add(m.from_location_id);
        if (m.to_location_id) locIds.add(m.to_location_id);
      }

      const { data: locs } = locIds.size
        ? await supabase
            .from("locations")
            .select("id, latitude, longitude")
            .in("id", Array.from(locIds))
        : { data: [] as any[] };

      const locMap = new globalThis.Map(
        ((locs as any[]) ?? [])
          .filter((l) => l.latitude != null && l.longitude != null)
          .map((l) => [l.id, { lng: Number(l.longitude), lat: Number(l.latitude) }] as const),
      );

      const features = filtered
        .map((m) => {
          const from = m.from_location_id ? locMap.get(m.from_location_id) : null;
          const to = m.to_location_id ? locMap.get(m.to_location_id) : null;
          if (!from || !to) return null;
          return {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [from.lng, from.lat],
                [to.lng, to.lat],
              ],
            },
            properties: {
              lot_code: m.lots?.lot_code ?? "—",
              dispatched_at: m.dispatched_at ?? null,
            },
          };
        })
        .filter(Boolean);

      setGeo({ type: "FeatureCollection", features });
    }
    load();
  }, [lotId]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="font-display text-[16px] text-gray-900">Movement routes</div>
        <div className="text-[12px] text-gray-500">Lines connect from → to locations.</div>
      </div>
      <div className="h-[420px]">
        <MapGL
          mapboxAccessToken={mapboxToken()}
          initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          {geo ? (
            <Source id="routes-src" type="geojson" data={geo}>
              <Layer {...routeLayer} />
            </Source>
          ) : null}
        </MapGL>
      </div>
    </div>
  );
}

