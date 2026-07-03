"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "mapbox-gl/dist/mapbox-gl.css";

import { EmptyState } from "@/components/enterprise";
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

export default function MovementMap({
  lotId,
  embedded = false,
  heightClass = "h-[420px]",
}: {
  lotId?: string;
  embedded?: boolean;
  heightClass?: string;
}) {
  const [geo, setGeo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
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
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load movement routes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lotId]);

  const mapBody = (
    <div className={`relative ${heightClass}`}>
      {loading ? (
        <div className="absolute inset-0 z-[6] flex items-center justify-center rounded-xl bg-slate-50/90">
          <p className="font-mono text-[11px] text-slate-500">Loading movement routes…</p>
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute inset-0 z-[6] flex items-center justify-center p-4">
          <EmptyState title="Movement layer unavailable" description={loadError} />
        </div>
      ) : null}
      <MapGL
        mapboxAccessToken={mapboxToken()}
        initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {geo ? (
          <Source id="routes-src" type="geojson" data={geo}>
            <Layer {...routeLayer} />
          </Source>
        ) : null}
      </MapGL>
      {!loading && geo?.features?.length === 0 ? (
        <div className="absolute inset-x-4 bottom-4 z-[5] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-center text-[12px] text-slate-600">
          No movement traces in scope for the current filter.
        </div>
      ) : null}
    </div>
  );

  if (embedded) {
    return <div className="overflow-hidden rounded-xl">{mapBody}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="font-display text-[16px] font-semibold text-ink-900">Movement routes</div>
        <div className="text-[12px] text-slate-600">Lines connect from → to locations.</div>
      </div>
      {mapBody}
    </div>
  );
}
