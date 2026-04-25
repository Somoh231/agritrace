"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { LIBERIA_CENTER, LIBERIA_ZOOM, mapboxToken } from "@/lib/mapbox/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Popup), { ssr: false });

const plotLayer = {
  id: "plots-fill",
  type: "fill",
  paint: {
    "fill-opacity": 0.55,
    "fill-color": [
      "match",
      ["get", "deforestation_check_status"],
      "clear",
      "#5bbf6e",
      "flagged",
      "#ef4444",
      "pending",
      "#9ca3af",
      "#9ca3af",
    ],
  },
} as any;

const outlineLayer = {
  id: "plots-line",
  type: "line" as const,
  paint: { "line-color": "#0f2e14", "line-width": 1, "line-opacity": 0.4 },
};

export default function FarmPlotMap() {
  const [plotsGeo, setPlotsGeo] = React.useState<any>(null);
  const [locations, setLocations] = React.useState<Array<{ id: string; name: string; latitude: number; longitude: number }>>([]);
  const [popup, setPopup] = React.useState<{ lng: number; lat: number; title: string; body: string } | null>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      const [{ data: plots }, { data: farmers }, { data: locs }] = await Promise.all([
        supabase
          .from("plots")
          .select("id, farmer_id, area_hectares, polygon_geojson, center_latitude, center_longitude, deforestation_check_status")
          .eq("commodity", "cocoa")
          .limit(3000),
        supabase.from("farmers").select("id, full_name").limit(3000),
        supabase
          .from("locations")
          .select("id,name,latitude,longitude")
          .eq("type", "collection_point")
          .eq("is_active", true)
          .limit(500),
      ]);

      const farmerName = new Map((farmers as any[])?.map((f) => [f.id, f.full_name] as const) ?? []);

      const features = ((plots as any[]) ?? [])
        .filter((p) => p.polygon_geojson)
        .map((p) => ({
          type: "Feature",
          geometry: (p.polygon_geojson as any).geometry ?? (p.polygon_geojson as any),
          properties: {
            id: p.id,
            farmer_id: p.farmer_id,
            farmer_name: farmerName.get(p.farmer_id) ?? "—",
            area_hectares: p.area_hectares ?? null,
            deforestation_check_status: p.deforestation_check_status ?? "pending",
            center_latitude: p.center_latitude ?? null,
            center_longitude: p.center_longitude ?? null,
          },
        }));

      setPlotsGeo({ type: "FeatureCollection", features });
      setLocations(
        (((locs as any[]) ?? []) as any[])
          .filter((l) => l.latitude != null && l.longitude != null)
          .map((l) => ({
            id: l.id,
            name: l.name,
            latitude: Number(l.latitude),
            longitude: Number(l.longitude),
          })),
      );
    }
    load();
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="font-display text-[16px] text-gray-900">Farm plot map</div>
        <div className="text-[12px] text-gray-500">Cocoa plots colored by deforestation status.</div>
      </div>
      <div className="relative h-[460px]">
        <MapGL
          mapboxAccessToken={mapboxToken()}
          initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onClick={(e) => {
            const f = e.features?.[0];
            if (!f) return;
            const props = f.properties as any;
            if (props?.farmer_name) {
              setPopup({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                title: props.farmer_name,
                body: `Plot: ${props.area_hectares ?? "—"} ha · ${props.deforestation_check_status ?? "pending"}`,
              });
            }
          }}
          interactiveLayerIds={["plots-fill"]}
        >
          {plotsGeo ? (
            <Source id="plots" type="geojson" data={plotsGeo}>
              <Layer {...plotLayer} />
              <Layer {...outlineLayer} />
            </Source>
          ) : null}

          {locations.map((l) => (
            <Marker key={l.id} longitude={l.longitude} latitude={l.latitude} anchor="bottom">
              <div className="h-2.5 w-2.5 rounded-full bg-forest-700 ring-2 ring-white shadow" title={l.name} />
            </Marker>
          ))}

          {popup ? (
            <Popup longitude={popup.lng} latitude={popup.lat} closeButton={true} closeOnClick={false} onClose={() => setPopup(null)}>
              <div className="text-[12px]">
                <div className="font-medium text-gray-900">{popup.title}</div>
                <div className="text-gray-600">{popup.body}</div>
              </div>
            </Popup>
          ) : null}
        </MapGL>
      </div>
    </div>
  );
}

