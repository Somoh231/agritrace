"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { MapRef } from "react-map-gl/mapbox";

import { LIBERIA_CENTER, LIBERIA_ZOOM, optionalMapboxToken } from "@/lib/mapbox/config";
import { buildOperationalBoundaryRecord, polygonFromPoints } from "@/lib/gis/operational-boundary-math";
import type { OperationalBoundaryPoint, OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

import "mapbox-gl/dist/mapbox-gl.css";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

const ACC_WEAK_M = 50;

function pointsToPointFc(points: OperationalBoundaryPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p, i) => ({
      type: "Feature",
      id: i,
      properties: { i },
      geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
    })),
  };
}

function openLineFeature(points: OperationalBoundaryPoint[]): Feature<LineString> | null {
  if (points.length < 2) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.map((p) => [p.longitude, p.latitude]),
    },
  };
}

function polygonFeature(poly: Polygon): Feature<Polygon> {
  return { type: "Feature", properties: {}, geometry: poly };
}

export type FarmBoundaryCaptureProps = {
  disabled?: boolean;
  readOnly?: boolean;
  /** Committed boundary from report — when set with readOnly, map is display-only. */
  value: OperationalFarmBoundary | null;
  /** Called when officer saves or clears the operational boundary. */
  onChange: (next: OperationalFarmBoundary | null) => void;
};

export default function FarmBoundaryCapture({ disabled, readOnly, value, onChange }: FarmBoundaryCaptureProps) {
  const token = optionalMapboxToken();
  const mapRef = React.useRef<MapRef | null>(null);
  const [draftPoints, setDraftPoints] = React.useState<OperationalBoundaryPoint[]>([]);
  const [closed, setClosed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);
  const [lastAccuracy, setLastAccuracy] = React.useState<number | null>(null);
  const online = typeof navigator !== "undefined" && navigator.onLine;

  const displayBoundary = value;
  const draftFill = !displayBoundary && draftPoints.length >= 3 ? polygonFromPoints(draftPoints) : null;
  const openPoly = !readOnly && !closed && draftPoints.length >= 2 ? openLineFeature(draftPoints) : null;
  const closedPoly =
    readOnly && displayBoundary
      ? displayBoundary.geometry
      : !readOnly && closed && draftFill
        ? draftFill
        : null;

  React.useEffect(() => {
    const fit = closedPoly ?? draftFill ?? displayBoundary?.geometry ?? null;
    if (!fit || !mapRef.current) return;
    try {
      const ring = fit.coordinates[0] ?? [];
      const lngs = ring.map((c) => c[0]!);
      const lats = ring.map((c) => c[1]!);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 48, duration: 500, maxZoom: 16 },
      );
    } catch {
      /* ignore */
    }
  }, [closedPoly, draftFill, displayBoundary]);

  const capturePoint = () => {
    if (disabled || readOnly) return;
    setBusy(true);
    setHint(null);
    if (!navigator.geolocation) {
      setHint("This device does not support GPS.");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = pos.coords.accuracy != null && Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
        setLastAccuracy(acc);
        const pt: OperationalBoundaryPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracyM: acc,
        };
        setDraftPoints((prev) => {
          const next = [...prev, pt];
          return next;
        });
        setClosed(false);
        setBusy(false);
      },
      () => {
        setHint("Could not read GPS. Check location permissions and try again.");
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25_000 },
    );
  };

  const closePolygon = () => {
    if (draftPoints.length < 3) {
      setHint("Walk at least three corners before closing the boundary.");
      return;
    }
    setClosed(true);
    setHint(null);
  };

  const undo = () => {
    setDraftPoints((p) => p.slice(0, -1));
    setClosed(false);
  };

  const clearDraft = () => {
    setDraftPoints([]);
    setClosed(false);
    setHint(null);
    setLastAccuracy(null);
  };

  const commitToReport = async () => {
    if (draftPoints.length < 3) {
      setHint("Capture at least three corner points.");
      return;
    }
    const {
      data: { user },
    } = await getSupabaseBrowserClient().auth.getUser();
    const record = buildOperationalBoundaryRecord({
      points: draftPoints,
      officerProfileId: user?.id ?? null,
    });
    if (!record) {
      setHint("Boundary is not valid yet.");
      return;
    }
    onChange(record);
    setDraftPoints([]);
    setClosed(false);
    setLastAccuracy(null);
    setHint("Boundary saved to this report.");
  };

  const removeSaved = () => {
    onChange(null);
    setHint(null);
  };

  const weakGps = lastAccuracy != null && lastAccuracy > ACC_WEAK_M;
  const pointFc = displayBoundary ? pointsToPointFc(displayBoundary.capturedPoints) : pointsToPointFc(draftPoints);
  const lineFeat = openPoly;
  const fillPolyForMap = closedPoly ?? displayBoundary?.geometry ?? draftFill;
  const fillFeat = fillPolyForMap ? polygonFeature(fillPolyForMap) : null;

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">Farm Boundary &amp; Location</div>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
            Walk the farm corners and capture each point. This produces an{" "}
            <span className="text-slate-200">approximate operational outline</span> for traceability — not a legal survey
            and not cadastral precision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncStatusIndicator />
          {!online ? (
            <span className="rounded-md border border-amber-800/60 bg-amber-950/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-amber-100">
              Offline — pending sync
            </span>
          ) : (
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-400">Online</span>
          )}
        </div>
      </div>

      {weakGps ? (
        <div className="mt-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-[12px] text-amber-100">
          GPS signal weak — accuracy may be reduced.
        </div>
      ) : null}

      {hint ? (
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-[12px] text-slate-200">{hint}</div>
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_200px]">
        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:min-h-[280px]">
          {!token ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 p-4 text-center sm:h-[280px]">
              <p className="text-[13px] text-slate-300">Map background needs a Mapbox token.</p>
              <p className="text-[12px] text-slate-500">You can still capture points; coordinates appear below.</p>
            </div>
          ) : (
            <MapGL
              ref={mapRef}
              mapboxAccessToken={token}
              initialViewState={{
                longitude: displayBoundary
                  ? (displayBoundary.capturedPoints[0]?.longitude ?? LIBERIA_CENTER.longitude)
                  : draftPoints[0]?.longitude ?? LIBERIA_CENTER.longitude,
                latitude: displayBoundary
                  ? (displayBoundary.capturedPoints[0]?.latitude ?? LIBERIA_CENTER.latitude)
                  : draftPoints[0]?.latitude ?? LIBERIA_CENTER.latitude,
                zoom: draftPoints.length || displayBoundary ? 14 : LIBERIA_ZOOM,
              }}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              style={{ width: "100%", height: 280 }}
              attributionControl={false}
            >
              {pointFc.features.length ? (
                <Source id="boundary-pts" type="geojson" data={pointFc}>
                  <Layer
                    id="boundary-pts-layer"
                    type="circle"
                    paint={{
                      "circle-radius": 7,
                      "circle-color": "#34d399",
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#022c22",
                    }}
                  />
                </Source>
              ) : null}
              {lineFeat ? (
                <Source id="boundary-line" type="geojson" data={lineFeat}>
                  <Layer
                    id="boundary-line-layer"
                    type="line"
                    paint={{ "line-color": "#6ee7b7", "line-width": 3, "line-dasharray": [2, 1] }}
                  />
                </Source>
              ) : null}
              {fillFeat ? (
                <Source id="boundary-fill" type="geojson" data={fillFeat}>
                  <Layer id="boundary-fill-layer" type="fill" paint={{ "fill-color": "#10b981", "fill-opacity": 0.25 }} />
                  <Layer id="boundary-outline-layer" type="line" paint={{ "line-color": "#059669", "line-width": 2 }} />
                </Source>
              ) : null}
            </MapGL>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!readOnly ? (
            <>
              <button
                type="button"
                disabled={disabled || busy || Boolean(value)}
                onClick={() => capturePoint()}
                className="min-h-[48px] rounded-xl bg-emerald-600 px-3 text-[14px] font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                {busy ? "Reading GPS…" : "Capture Point"}
              </button>
              <button
                type="button"
                disabled={disabled || draftPoints.length < 3 || Boolean(value)}
                onClick={closePolygon}
                className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-900 px-3 text-[14px] font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-40"
              >
                Close Boundary
              </button>
              <button
                type="button"
                disabled={disabled || !draftPoints.length || Boolean(value)}
                onClick={undo}
                className="min-h-[44px] rounded-xl border border-slate-700 px-3 text-[13px] text-slate-200 hover:bg-slate-900 disabled:opacity-40"
              >
                Undo Last Point
              </button>
              <button
                type="button"
                disabled={disabled || (!draftPoints.length && !closed) || Boolean(value)}
                onClick={clearDraft}
                className="min-h-[44px] rounded-xl border border-rose-900/40 px-3 text-[13px] text-rose-100 hover:bg-rose-950/30 disabled:opacity-40"
              >
                Clear Polygon
              </button>
              <button
                type="button"
                disabled={disabled || draftPoints.length < 3 || Boolean(value)}
                onClick={() => void commitToReport()}
                className="min-h-[48px] rounded-xl bg-slate-100 px-3 text-[14px] font-semibold text-slate-900 hover:bg-white disabled:opacity-40"
              >
                Save Boundary
              </button>
            </>
          ) : null}
        </div>
      </div>

      {displayBoundary ? (
        <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[12px] text-slate-300">
          <div className="font-semibold text-white">Saved operational boundary</div>
          <div>Points captured: {displayBoundary.capturedPoints.length}</div>
          {displayBoundary.officerProfileId ? (
            <div className="font-mono text-[11px] text-slate-400">
              Officer account: <span className="text-slate-300">{displayBoundary.officerProfileId}</span>
            </div>
          ) : null}
          <div>
            Estimated farm size:{" "}
            <span className="text-emerald-300">
              {displayBoundary.areaHectares.toFixed(3)} ha · {displayBoundary.areaAcres.toFixed(3)} acres
            </span>
          </div>
          <div className="text-slate-500">Estimated operational farm size — not for legal or ownership use.</div>
          <div className="font-mono text-[11px] text-slate-500">Captured: {displayBoundary.capturedAt.slice(0, 19)} UTC</div>
          {!readOnly ? (
            <button type="button" onClick={removeSaved} className="mt-2 h-10 rounded-lg border border-slate-600 px-3 text-[12px] text-slate-200 hover:bg-slate-800">
              Remove boundary from report
            </button>
          ) : null}
        </div>
      ) : null}

      {!readOnly && draftPoints.length > 0 && !value ? (
        <div className="mt-3 font-mono text-[11px] text-slate-500">
          Corners captured: {draftPoints.length}
          {lastAccuracy != null ? ` · GPS accuracy ~${Math.round(lastAccuracy)} m` : ""}
        </div>
      ) : null}
    </section>
  );
}
