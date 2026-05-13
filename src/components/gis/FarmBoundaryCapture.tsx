"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { MapRef } from "react-map-gl/mapbox";

import { LIBERIA_CENTER, optionalMapboxToken } from "@/lib/mapbox/config";
import { buildOperationalBoundaryRecord, polygonFromPoints } from "@/lib/gis/operational-boundary-math";
import type { OperationalBoundaryPoint, OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

import "mapbox-gl/dist/mapbox-gl.css";

const MapGL = dynamic(() => import("react-map-gl/mapbox").then((m) => m.default), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then((m) => m.Layer), { ssr: false });

/** Warn before capture; do not block unless extremely poor. */
const ACC_WARN_M = 35;
const ACC_STRONG_WARN_M = 55;
const ACC_EXTREME_M = 120;

const DEFAULT_REGION_ZOOM = 12;
const FIELD_ZOOM_SINGLE = 17;
const FIELD_ZOOM_CLUSTER = 16;

function pointsToPointFc(points: OperationalBoundaryPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p, i) => ({
      type: "Feature",
      id: i,
      properties: { n: String(i + 1) },
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

function closedRingLineFeature(points: OperationalBoundaryPoint[]): Feature<LineString> | null {
  if (points.length < 3) return null;
  const coords = points.map((p) => [p.longitude, p.latitude] as [number, number]);
  coords.push([points[0]!.longitude, points[0]!.latitude]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  };
}

function polygonFeature(poly: Polygon): Feature<Polygon> {
  return { type: "Feature", properties: {}, geometry: poly };
}

function liveGpsFc(lat: number, lng: number, accuracyM: number | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { acc: accuracyM ?? 0 },
        geometry: { type: "Point", coordinates: [lng, lat] },
      },
    ],
  };
}

function accuracyLabel(m: number | null): { tier: string; detail: string } {
  if (m == null || !Number.isFinite(m)) return { tier: "Unknown", detail: "accuracy not reported" };
  if (m <= 5) return { tier: "Excellent", detail: `~${Math.round(m)} m` };
  if (m <= 12) return { tier: "Good", detail: `~${Math.round(m)} m` };
  if (m <= 25) return { tier: "Weak", detail: `~${Math.round(m)} m` };
  return { tier: "Poor signal", detail: `~${Math.round(m)} m` };
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
  const userAdjustedViewRef = React.useRef(false);
  const programmaticMoveRef = React.useRef(false);
  const liveWatchIdRef = React.useRef<number | null>(null);

  const [draftPoints, setDraftPoints] = React.useState<OperationalBoundaryPoint[]>([]);
  const [closed, setClosed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);
  const [lastAccuracy, setLastAccuracy] = React.useState<number | null>(null);
  const [liveGps, setLiveGps] = React.useState<{ latitude: number; longitude: number; accuracyM: number | null } | null>(
    null,
  );
  const [gpsWatchFailed, setGpsWatchFailed] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [gpsRetryKey, setGpsRetryKey] = React.useState(0);
  const [online, setOnline] = React.useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const liveGpsInitialFitRef = React.useRef(false);
  const prevDraftLenRef = React.useRef(0);

  const displayBoundary = value;
  const draftFill = !displayBoundary && draftPoints.length >= 3 ? polygonFromPoints(draftPoints) : null;
  const lineFeat =
    !readOnly && !closed && draftPoints.length >= 2
      ? openLineFeature(draftPoints)
      : !readOnly && closed && draftPoints.length >= 3
        ? closedRingLineFeature(draftPoints)
        : null;
  const closedPoly =
    readOnly && displayBoundary
      ? displayBoundary.geometry
      : !readOnly && closed && draftFill
        ? draftFill
        : null;

  const runProgrammatic = (fn: (map: import("mapbox-gl").Map) => void) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    programmaticMoveRef.current = true;
    try {
      fn(map);
    } finally {
      window.setTimeout(() => {
        programmaticMoveRef.current = false;
      }, 750);
    }
  };

  const fitToOperationalArea = React.useCallback(() => {
    if (userAdjustedViewRef.current || readOnly) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const fit = closedPoly ?? draftFill ?? displayBoundary?.geometry ?? null;
    if (fit) {
      try {
        const ring = fit.coordinates[0] ?? [];
        const lngs = ring.map((c) => c[0]!);
        const lats = ring.map((c) => c[1]!);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        runProgrammatic((m) =>
          m.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: { top: 72, bottom: 56, left: 48, right: 48 }, duration: 550, maxZoom: FIELD_ZOOM_CLUSTER },
          ),
        );
      } catch {
        /* ignore */
      }
      return;
    }

    const pts = displayBoundary?.capturedPoints ?? draftPoints;
    if (pts.length >= 2) {
      const lngs = pts.map((p) => p.longitude);
      const lats = pts.map((p) => p.latitude);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const pad = Math.max(maxLng - minLng, maxLat - minLat) < 0.0005 ? 0.002 : 0.0008;
      runProgrammatic((m) =>
        m.fitBounds(
          [
            [minLng - pad, minLat - pad],
            [maxLng + pad, maxLat + pad],
          ],
          { padding: 64, duration: 550, maxZoom: FIELD_ZOOM_CLUSTER },
        ),
      );
      return;
    }

    if (pts.length === 1) {
      const p = pts[0]!;
      runProgrammatic((m) => m.flyTo({ center: [p.longitude, p.latitude], zoom: FIELD_ZOOM_SINGLE, duration: 550 }));
      return;
    }

  }, [closedPoly, draftFill, displayBoundary, draftPoints, readOnly]);

  React.useEffect(() => {
    fitToOperationalArea();
  }, [closedPoly, draftFill, displayBoundary?.geometry, draftPoints.length, closed, fitToOperationalArea]);

  React.useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  React.useEffect(() => {
    liveGpsInitialFitRef.current = false;
  }, [gpsRetryKey]);

  React.useEffect(() => {
    const len = draftPoints.length;
    if (prevDraftLenRef.current > 0 && len === 0 && !value) {
      liveGpsInitialFitRef.current = false;
    }
    prevDraftLenRef.current = len;
  }, [draftPoints.length, value]);

  React.useEffect(() => {
    if (readOnly || value || disabled || userAdjustedViewRef.current) return;
    const ptCount = displayBoundary?.capturedPoints?.length ?? draftPoints.length;
    if (ptCount > 0) return;
    if (!liveGps || gpsWatchFailed) return;
    if (liveGpsInitialFitRef.current) return;
    liveGpsInitialFitRef.current = true;
    runProgrammatic((m) =>
      m.flyTo({ center: [liveGps.longitude, liveGps.latitude], zoom: FIELD_ZOOM_SINGLE, duration: 550 }),
    );
  }, [readOnly, value, disabled, displayBoundary?.capturedPoints?.length, draftPoints.length, liveGps, gpsWatchFailed]);

  React.useEffect(() => {
    if (readOnly || value || disabled || !navigator.geolocation) {
      if (liveWatchIdRef.current != null) {
        navigator.geolocation.clearWatch(liveWatchIdRef.current);
        liveWatchIdRef.current = null;
      }
      setLiveGps(null);
      return;
    }
    setGpsWatchFailed(false);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy != null && Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
        setLiveGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: acc,
        });
        setGpsWatchFailed(false);
      },
      () => {
        setGpsWatchFailed(true);
        setLiveGps(null);
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 30_000 },
    );
    liveWatchIdRef.current = id;
    return () => {
      navigator.geolocation.clearWatch(id);
      liveWatchIdRef.current = null;
    };
  }, [readOnly, value, disabled, gpsRetryKey]);

  const flashMsg = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2600);
  };

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
        if (acc != null && acc > ACC_EXTREME_M) {
          setHint(
            `GPS accuracy is very poor (~${Math.round(acc)} m). Move to open sky and tap Capture Point again, or capture only if operationally necessary.`,
          );
          setBusy(false);
          return;
        }
        const pt: OperationalBoundaryPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracyM: acc,
        };
        setDraftPoints((prev) => {
          const next = [...prev, pt];
          const n = next.length;
          flashMsg(`Corner ${n} captured`);
          if (!userAdjustedViewRef.current) {
            window.requestAnimationFrame(() => {
              const map = mapRef.current?.getMap();
              if (!map) return;
              programmaticMoveRef.current = true;
              if (next.length === 1) {
                map.flyTo({ center: [pt.longitude, pt.latitude], zoom: FIELD_ZOOM_SINGLE, duration: 500 });
              } else {
                const lngs = next.map((p) => p.longitude);
                const lats = next.map((p) => p.latitude);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const pad = Math.max(maxLng - minLng, maxLat - minLat) < 0.0005 ? 0.002 : 0.0012;
                map.fitBounds(
                  [
                    [minLng - pad, minLat - pad],
                    [maxLng + pad, maxLat + pad],
                  ],
                  { padding: 64, duration: 500, maxZoom: FIELD_ZOOM_CLUSTER },
                );
              }
              window.setTimeout(() => {
                programmaticMoveRef.current = false;
              }, 700);
            });
          }
          return next;
        });
        setClosed(false);
        setBusy(false);
      },
      () => {
        setHint("Could not read GPS. Check location permissions and tap Capture Point again.");
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
    flashMsg("Boundary ready to save.");
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
    userAdjustedViewRef.current = false;
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
    userAdjustedViewRef.current = false;
    flashMsg(
      online
        ? "Boundary saved to this report — pending sync when queued."
        : "Boundary saved locally on this report.",
    );
    setHint(online ? "Boundary attached to this report — submit when ready." : "Data safely stored on device until you are back online.");
  };

  const removeSaved = () => {
    onChange(null);
    setHint(null);
  };

  const weakGps = lastAccuracy != null && lastAccuracy > ACC_WARN_M;
  const strongWeakGps = lastAccuracy != null && lastAccuracy > ACC_STRONG_WARN_M;
  const pointFc = displayBoundary ? pointsToPointFc(displayBoundary.capturedPoints) : pointsToPointFc(draftPoints);
  const fillPolyForMap = closedPoly ?? displayBoundary?.geometry ?? draftFill;
  const fillFeat = fillPolyForMap ? polygonFeature(fillPolyForMap) : null;
  const liveFc = liveGps && !readOnly && !value ? liveGpsFc(liveGps.latitude, liveGps.longitude, liveGps.accuracyM) : null;
  const accLive = liveGps?.accuracyM ?? null;
  const accLabel = accuracyLabel(accLive);

  const instruction =
    draftPoints.length === 0
      ? "Walk to each farm corner and tap Capture Point."
      : draftPoints.length < 3
        ? `Corner ${draftPoints.length + 1}: walk to the next corner, then capture.`
        : closed
          ? "Boundary closed — review the outline, then Save Boundary."
          : "Boundary preview active — adjust corners with Undo if needed, then Close Boundary.";

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">Farm Boundary &amp; Location</div>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
            Approximate operational outline for traceability — not a legal survey. Map auto-follows corners until you pan or zoom manually.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
          <SyncStatusIndicator />
          <div className="flex flex-wrap justify-end gap-1.5 text-[10px] font-mono">
            {!online ? (
              <span className="rounded-md border border-amber-800/60 bg-amber-950/40 px-2 py-1 uppercase tracking-wide text-amber-100">
                Offline · saved locally
              </span>
            ) : (
              <span className="rounded-md border border-emerald-800/40 bg-emerald-950/30 px-2 py-1 text-emerald-100/95">Online · pending sync when queued</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2 text-[13px] leading-snug text-slate-200">{instruction}</p>

      {!readOnly && !value ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono uppercase tracking-wide text-slate-500">Sync</span>
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-slate-300">Saved locally</span>
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-slate-300">Pending sync</span>
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-slate-300">Synced</span>
          <span className="rounded border border-rose-900/40 px-1.5 py-0.5 text-rose-200/90">Sync failed</span>
        </div>
      ) : null}

      {!online && !readOnly ? (
        <p className="mt-2 text-[12px] leading-relaxed text-amber-100/90">
          Data safely stored on device. Capture continues offline; queue syncs when connectivity returns.
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${
              liveGps && !gpsWatchFailed ? "bg-emerald-400" : "bg-amber-400"
            }`}
            aria-hidden
          >
            {liveGps && !gpsWatchFailed ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50" aria-hidden />
            ) : null}
          </span>
          <span className="text-[12px] font-medium text-slate-100">
            {liveGps && !gpsWatchFailed ? "GPS active" : gpsWatchFailed ? "Waiting for GPS signal" : "Locating…"}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">|</span>
        <span className="text-[12px] text-slate-300">
          Accuracy: <span className="font-medium text-emerald-200/90">{accLabel.tier}</span>{" "}
          <span className="text-slate-500">({accLabel.detail})</span>
        </span>
        <button
          type="button"
          disabled={readOnly || busy}
          className="ml-auto text-[11px] font-medium text-emerald-400 underline decoration-emerald-500/50 hover:text-emerald-300 disabled:opacity-40"
          onClick={() => setGpsRetryKey((k) => k + 1)}
        >
          Retry GPS
        </button>
      </div>

      {strongWeakGps ? (
        <div className="mt-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-[12px] text-amber-100">
          GPS is weak — capture only if corners are still identifiable. Move to clearer sky and retry for better accuracy.
        </div>
      ) : weakGps ? (
        <div className="mt-2 rounded-lg border border-amber-900/35 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-50/95">
          GPS accuracy marginal — you can still capture; walk slower near corners.
        </div>
      ) : null}

      {hint ? (
        <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-[12px] text-slate-200">{hint}</div>
      ) : null}

      {flash ? (
        <div
          className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/25 px-3 py-2 text-[12px] font-medium text-emerald-100"
          role="status"
        >
          {flash}
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_minmax(160px,220px)] lg:items-stretch">
        <div className="relative min-h-[min(52vh,420px)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:min-h-[340px]">
          {!token ? (
            <div className="flex min-h-[min(48vh,380px)] flex-col items-center justify-center gap-2 p-4 text-center sm:min-h-[320px]">
              <p className="text-[13px] text-slate-300">Map background needs a Mapbox token.</p>
              <p className="text-[12px] text-slate-500">You can still capture points; coordinates list below after each capture.</p>
            </div>
          ) : (
            <MapGL
              ref={mapRef}
              mapboxAccessToken={token}
              initialViewState={{
                longitude: displayBoundary?.capturedPoints[0]?.longitude ?? draftPoints[0]?.longitude ?? LIBERIA_CENTER.longitude,
                latitude: displayBoundary?.capturedPoints[0]?.latitude ?? draftPoints[0]?.latitude ?? LIBERIA_CENTER.latitude,
                zoom:
                  displayBoundary || draftPoints.length
                    ? FIELD_ZOOM_SINGLE
                    : DEFAULT_REGION_ZOOM,
              }}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              style={{ width: "100%", height: "min(52vh, 420px)", minHeight: 260 }}
              attributionControl={false}
              onDragEnd={() => {
                if (!programmaticMoveRef.current) userAdjustedViewRef.current = true;
              }}
              onWheel={() => {
                if (!programmaticMoveRef.current) userAdjustedViewRef.current = true;
              }}
            >
              {liveFc ? (
                <Source id="live-gps" type="geojson" data={liveFc}>
                  <Layer
                    id="live-gps-ring"
                    type="circle"
                    paint={{
                      "circle-radius": ["interpolate", ["linear"], ["get", "acc"], 5, 12, 80, 44],
                      "circle-color": "#34d399",
                      "circle-opacity": 0.22,
                      "circle-stroke-width": 1,
                      "circle-stroke-color": "#6ee7b7",
                      "circle-stroke-opacity": 0.5,
                    }}
                  />
                  <Layer
                    id="live-gps-core"
                    type="circle"
                    paint={{
                      "circle-radius": 6,
                      "circle-color": "#ecfdf5",
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#059669",
                    }}
                  />
                </Source>
              ) : null}
              {pointFc.features.length ? (
                <Source id="boundary-pts" type="geojson" data={pointFc}>
                  <Layer
                    id="boundary-pts-circle"
                    type="circle"
                    paint={{
                      "circle-radius": 11,
                      "circle-color": "#34d399",
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#022c22",
                    }}
                  />
                  <Layer
                    id="boundary-pts-label"
                    type="symbol"
                    layout={{
                      "text-field": ["get", "n"],
                      "text-size": 12,
                      "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
                      "text-allow-overlap": true,
                      "text-ignore-placement": true,
                    }}
                    paint={{
                      "text-color": "#022c22",
                      "text-halo-color": "#ecfdf5",
                      "text-halo-width": 1.2,
                    }}
                  />
                </Source>
              ) : null}
              {lineFeat ? (
                <Source id="boundary-line" type="geojson" data={lineFeat}>
                  <Layer
                    id="boundary-line-layer"
                    type="line"
                    paint={{
                      "line-color": closed ? "#059669" : "#6ee7b7",
                      "line-width": closed ? 3 : 2,
                      ...(closed ? {} : { "line-dasharray": [2, 1] as [number, number] }),
                    }}
                  />
                </Source>
              ) : null}
              {fillFeat ? (
                <Source id="boundary-fill" type="geojson" data={fillFeat}>
                  <Layer id="boundary-fill-layer" type="fill" paint={{ "fill-color": "#10b981", "fill-opacity": 0.28 }} />
                  <Layer id="boundary-outline-layer" type="line" paint={{ "line-color": "#047857", "line-width": 2.5 }} />
                </Source>
              ) : null}
            </MapGL>
          )}
          <button
            type="button"
            className="absolute bottom-2 right-2 z-10 rounded-lg border border-slate-600/90 bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 shadow backdrop-blur-sm hover:bg-slate-900"
            onClick={() => {
              userAdjustedViewRef.current = false;
              fitToOperationalArea();
            }}
          >
            Recenter map
          </button>
        </div>

        <div className="flex flex-col gap-2 lg:max-w-[220px]">
          {!readOnly ? (
            <>
              <button
                type="button"
                disabled={disabled || busy || Boolean(value)}
                onClick={() => capturePoint()}
                className="min-h-[52px] rounded-xl bg-emerald-600 px-4 text-[15px] font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50"
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
                className="min-h-[46px] rounded-xl border border-slate-700 px-3 text-[13px] text-slate-200 hover:bg-slate-900 disabled:opacity-40"
              >
                Undo Last Point
              </button>
              <button
                type="button"
                disabled={disabled || (!draftPoints.length && !closed) || Boolean(value)}
                onClick={clearDraft}
                className="min-h-[46px] rounded-xl border border-rose-900/40 px-3 text-[13px] text-rose-100 hover:bg-rose-950/30 disabled:opacity-40"
              >
                Clear Polygon
              </button>
              <button
                type="button"
                disabled={disabled || draftPoints.length < 3 || Boolean(value)}
                onClick={() => void commitToReport()}
                className="min-h-[52px] rounded-xl bg-slate-100 px-3 text-[15px] font-semibold text-slate-900 hover:bg-white disabled:opacity-40"
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
          {lastAccuracy != null ? ` · last capture accuracy ~${Math.round(lastAccuracy)} m` : ""}
        </div>
      ) : null}
    </section>
  );
}
