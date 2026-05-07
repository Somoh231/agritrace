"use client";

import * as React from "react";
import type { MapLayerMouseEvent } from "mapbox-gl";
import MapGL, { Layer, Source, type MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

import type { CountySurfaceMode, GisOverlayToggles } from "@/lib/gis/gis-intelligence-data";
import { LIBERIA_CENTER, LIBERIA_ZOOM } from "@/lib/mapbox/config";

type MapGeoPayload = Record<string, unknown>;

function visibility(on: boolean): "visible" | "none" {
  return on ? "visible" : "none";
}

export default function GisIntelligenceMap({
  token,
  countyPolygons,
  metricPoints,
  warehousePoints,
  pestPoints,
  movementLines,
  subsidyLines,
  transferLines,
  surfaceMode,
  overlays,
}: {
  token: string;
  countyPolygons: MapGeoPayload | null;
  metricPoints: MapGeoPayload;
  warehousePoints: MapGeoPayload;
  pestPoints: MapGeoPayload;
  movementLines: MapGeoPayload;
  subsidyLines: MapGeoPayload;
  transferLines: MapGeoPayload;
  surfaceMode: CountySurfaceMode;
  overlays: GisOverlayToggles;
}) {
  const mapRef = React.useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const animRef = React.useRef<number>(0);
  const phaseRef = React.useRef(0);

  const hasPolygons = Boolean((countyPolygons as { features?: unknown[] })?.features?.length);

  const showRiskFill =
    hasPolygons && (surfaceMode === "food_security" || surfaceMode === "dao_compliance" || surfaceMode === "county_risk");

  const riskFillPaint =
    surfaceMode === "food_security"
      ? ({
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "food_risk_score"], 40],
            25,
            "#14532d",
            55,
            "#a16207",
            88,
            "#9f1239",
          ],
          "fill-opacity": 0.72,
        } as Record<string, unknown>)
      : surfaceMode === "dao_compliance"
        ? ({
            "fill-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "dao_compliance"], 70],
              45,
              "#7f1d1d",
              72,
              "#a16207",
              93,
              "#14532d",
            ],
            "fill-opacity": 0.72,
          } as Record<string, unknown>)
        : surfaceMode === "county_risk"
          ? ({
              "fill-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "county_risk_score"], 50],
                25,
                "#064e3b",
                55,
                "#92400e",
                85,
                "#831843",
              ],
              "fill-opacity": 0.78,
            } as Record<string, unknown>)
          : ({
              "fill-color": "#334155",
              "fill-opacity": 0,
            } as Record<string, unknown>);

  const metricCirclePaint =
    surfaceMode === "food_security"
      ? ({
          "circle-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "food_risk_score"], 40],
            25,
            "#14532d",
            55,
            "#a16207",
            88,
            "#9f1239",
          ],
          "circle-opacity": hasPolygons ? 0 : 0.82,
          "circle-radius": ["interpolate", ["linear"], ["get", "farmer_count"], 1, 10, 40, 44],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.35)",
        } as Record<string, unknown>)
      : surfaceMode === "dao_compliance"
        ? ({
            "circle-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "dao_compliance"], 70],
              45,
              "#7f1d1d",
              72,
              "#ca8a04",
              93,
              "#15803d",
            ],
            "circle-opacity": hasPolygons ? 0 : 0.82,
            "circle-radius": ["interpolate", ["linear"], ["get", "dao_compliance"], 40, 14, 96, 38],
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,0.35)",
          } as Record<string, unknown>)
        : surfaceMode === "county_risk"
          ? ({
              "circle-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "county_risk_score"], 50],
                25,
                "#064e3b",
                55,
                "#c2410c",
                85,
                "#831843",
              ],
              "circle-opacity": hasPolygons ? 0 : 0.82,
              "circle-radius": ["interpolate", ["linear"], ["get", "county_risk_score"], 20, 16, 95, 42],
              "circle-stroke-width": 2,
              "circle-stroke-color": "rgba(255,255,255,0.35)",
            } as Record<string, unknown>)
          : ({
              "circle-color": "#64748b",
              "circle-opacity": 0.25,
              "circle-radius": 18,
              "circle-stroke-width": 1,
              "circle-stroke-color": "rgba(255,255,255,0.2)",
            } as Record<string, unknown>);

  const corridorAnimate =
    mapLoaded &&
    (overlays.inventoryMovementRoutes ||
      overlays.transferRoutes ||
      overlays.subsidyDistribution ||
      overlays.daoReportingPulse);

  React.useEffect(() => {
    if (!corridorAnimate) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const tick = () => {
      phaseRef.current += 0.04;
      const p = phaseRef.current;
      const pulse = 0.35 + Math.sin(p * 1.8) * 0.35;

      try {
        const mb = map as unknown as { setPaintProperty: (a: string, b: string, c: unknown) => void };
        if (map.getLayer("gis-movement-lines")) {
          mb.setPaintProperty("gis-movement-lines", "line-dasharray", [2, 2]);
          mb.setPaintProperty("gis-movement-lines", "line-dashoffset", -p * 6);
          mb.setPaintProperty("gis-movement-lines", "line-opacity", 0.55 + Math.sin(p * 2.1) * 0.28);
        }
        if (map.getLayer("gis-transfer-lines")) {
          mb.setPaintProperty("gis-transfer-lines", "line-dasharray", [1.5, 2]);
          mb.setPaintProperty("gis-transfer-lines", "line-dashoffset", p * 8);
          mb.setPaintProperty("gis-transfer-lines", "line-opacity", 0.62 + Math.sin(p * 1.7) * 0.22);
        }
        if (map.getLayer("gis-subsidy-lines")) {
          mb.setPaintProperty("gis-subsidy-lines", "line-opacity", 0.35 + pulse * 0.45);
        }
        if (map.getLayer("gis-dao-pulse")) {
          mb.setPaintProperty("gis-dao-pulse", "circle-opacity", overlays.daoReportingPulse ? 0.15 + pulse * 0.55 : 0);
          mb.setPaintProperty("gis-dao-pulse", "circle-radius", 12 + pulse * 14);
        }
      } catch {
        /* layer missing during style swap */
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [corridorAnimate, overlays.daoReportingPulse, overlays.inventoryMovementRoutes, overlays.transferRoutes, overlays.subsidyDistribution]);

  const onClick = React.useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f?.properties) return;
    const lid = f.layer?.id;
    const props = f.properties as Record<string, unknown>;
    if (lid === "gis-warehouse-circles") {
      window.dispatchEvent(new CustomEvent("gis-warehouse-select", { detail: String(props.code ?? "") }));
      return;
    }
    if (lid === "gis-counties-fill" || lid === "gis-county-metric-circles") {
      const county = String(props.countyName ?? props.county ?? "");
      if (county) window.dispatchEvent(new CustomEvent("gis-county-select", { detail: county }));
    }
  }, []);

  const interactiveIds = React.useMemo(() => {
    const ids: string[] = [];
    if (hasPolygons && showRiskFill) ids.push("gis-counties-fill");
    ids.push("gis-county-metric-circles");
    if (overlays.warehouses) ids.push("gis-warehouse-circles");
    return ids;
  }, [hasPolygons, overlays.warehouses, showRiskFill]);

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={token}
      initialViewState={{ ...LIBERIA_CENTER, zoom: LIBERIA_ZOOM }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      interactiveLayerIds={interactiveIds}
      onClick={onClick}
      onLoad={() => setMapLoaded(true)}
    >
      {countyPolygons && hasPolygons ? (
        <Source id="gis-counties-poly" type="geojson" data={countyPolygons as never}>
          <Layer
            id="gis-counties-fill"
            type="fill"
            layout={{ visibility: visibility(showRiskFill) }}
            paint={riskFillPaint}
          />
          <Layer
            id="gis-counties-outline"
            type="line"
            layout={{ visibility: visibility(showRiskFill || surfaceMode !== "off") }}
            paint={{
              "line-color": "rgba(148,163,184,0.35)",
              "line-width": 1,
            }}
          />
        </Source>
      ) : null}

      <Source id="gis-county-metrics" type="geojson" data={metricPoints as never}>
        <Layer
          id="gis-prod-heatmap"
          type="heatmap"
          layout={{ visibility: visibility(surfaceMode === "production_heatmap") }}
          paint={{
            "heatmap-weight": ["/", ["+", ["coalesce", ["get", "production_index"], 1], 5], 110],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 8, 1.2],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 40, 9, 85],
            "heatmap-opacity": 0.82,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(15,23,42,0)",
              0.15,
              "#064e3b",
              0.45,
              "#22c55e",
              0.75,
              "#eab308",
              1,
              "#fef08a",
            ],
          }}
        />
        <Layer
          id="gis-farmer-density-heat"
          type="heatmap"
          layout={{ visibility: visibility(overlays.farmerDensity && surfaceMode !== "production_heatmap") }}
          paint={{
            "heatmap-weight": ["coalesce", ["get", "farmer_count"], 1],
            "heatmap-intensity": 1,
            "heatmap-radius": 54,
            "heatmap-opacity": 0.55,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(56,189,248,0)",
              1,
              "rgba(56,189,248,0.85)",
            ],
          }}
        />
        <Layer
          id="gis-farmer-density-heat-under-production"
          type="heatmap"
          layout={{ visibility: visibility(overlays.farmerDensity && surfaceMode === "production_heatmap") }}
          paint={{
            "heatmap-weight": ["*", ["coalesce", ["get", "farmer_count"], 1], 0.65],
            "heatmap-intensity": 0.55,
            "heatmap-radius": 38,
            "heatmap-opacity": 0.35,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(14,165,233,0)",
              1,
              "rgba(14,165,233,0.75)",
            ],
          }}
        />
        <Layer
          id="gis-county-metric-circles"
          type="circle"
          layout={{ visibility: "visible" }}
          paint={
            surfaceMode === "production_heatmap" || surfaceMode === "off"
              ? ({
                  "circle-color": "#ffffff",
                  "circle-opacity": surfaceMode === "off" ? 0.012 : 0.018,
                  "circle-radius": surfaceMode === "off" ? 26 : 34,
                  "circle-stroke-width": 0,
                } as Record<string, unknown>)
              : hasPolygons && showRiskFill
                ? ({
                    "circle-color": "#ffffff",
                    "circle-opacity": 0.008,
                    "circle-radius": 30,
                    "circle-stroke-width": 0,
                  } as Record<string, unknown>)
                : metricCirclePaint
          }
        />
        <Layer
          id="gis-dao-pulse"
          type="circle"
          layout={{ visibility: visibility(overlays.daoReportingPulse) }}
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["get", "dao_compliance"], 40, 22, 96, 10],
            "circle-color": "#fbbf24",
            "circle-opacity": 0.35,
            "circle-blur": 0.35,
          }}
        />
      </Source>

      <Source id="gis-subsidy" type="geojson" data={subsidyLines as never}>
        <Layer
          id="gis-subsidy-lines"
          type="line"
          layout={{ visibility: visibility(overlays.subsidyDistribution) }}
          paint={{
            "line-color": "#c084fc",
            "line-width": 2,
            "line-opacity": 0.65,
            "line-blur": 0.4,
          }}
        />
      </Source>

      <Source id="gis-movement" type="geojson" data={movementLines as never}>
        <Layer
          id="gis-movement-lines"
          type="line"
          layout={{ visibility: visibility(overlays.inventoryMovementRoutes) }}
          paint={{
            "line-color": "#34d399",
            "line-width": 3,
            "line-opacity": 0.88,
          }}
        />
      </Source>

      <Source id="gis-transfer" type="geojson" data={transferLines as never}>
        <Layer
          id="gis-transfer-lines"
          type="line"
          layout={{ visibility: visibility(overlays.transferRoutes) }}
          paint={{
            "line-color": "#38bdf8",
            "line-width": 2.5,
            "line-opacity": 0.9,
          }}
        />
      </Source>

      <Source id="gis-warehouses" type="geojson" data={warehousePoints as never}>
        <Layer
          id="gis-warehouse-circles"
          type="circle"
          layout={{ visibility: visibility(overlays.warehouses) }}
          paint={{
            "circle-radius": 9,
            "circle-color": ["case", ["==", ["get", "donor_resupply"], true], "#f472b6", "#38bdf8"],
            "circle-opacity": 0.92,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0f172a",
          }}
        />
      </Source>

      <Source id="gis-pests" type="geojson" data={pestPoints as never}>
        <Layer
          id="gis-pest-symbols"
          type="circle"
          layout={{ visibility: visibility(overlays.pestOutbreaks) }}
          paint={{
            "circle-radius": 11,
            "circle-color": "#f87171",
            "circle-opacity": 0.95,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#450a0a",
          }}
        />
      </Source>
    </MapGL>
  );
}
