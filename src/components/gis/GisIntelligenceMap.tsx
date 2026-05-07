"use client";

import * as React from "react";
import type { MapLayerMouseEvent } from "mapbox-gl";
import MapGL, { Layer, Source, type MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

import type { CountyHoverDetail, CountySurfaceMode, GisOverlayToggles } from "@/lib/gis/gis-intelligence-data";
import { LIBERIA_CENTER, LIBERIA_ZOOM } from "@/lib/mapbox/config";

type MapGeoPayload = Record<string, unknown>;

function visibility(on: boolean): "visible" | "none" {
  return on ? "visible" : "none";
}

const CHOROPLETH_MODES: CountySurfaceMode[] = ["rice_production", "food_security", "inventory_pressure", "dao_compliance"];

export default function GisIntelligenceMap({
  token,
  countyPolygons,
  metricPoints,
  warehousePoints,
  daoPoints,
  pestPoints,
  movementLines,
  subsidyLines,
  transferLines,
  surfaceMode,
  overlays,
  onCountyHover,
}: {
  token: string;
  countyPolygons: MapGeoPayload | null;
  metricPoints: MapGeoPayload;
  warehousePoints: MapGeoPayload;
  daoPoints: MapGeoPayload;
  pestPoints: MapGeoPayload;
  movementLines: MapGeoPayload;
  subsidyLines: MapGeoPayload;
  transferLines: MapGeoPayload;
  surfaceMode: CountySurfaceMode;
  overlays: GisOverlayToggles;
  onCountyHover?: (detail: CountyHoverDetail | null) => void;
}) {
  const mapRef = React.useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const animRef = React.useRef<number>(0);
  const phaseRef = React.useRef(0);

  const hasPolygons = Boolean((countyPolygons as { features?: unknown[] })?.features?.length);

  const showCountyChoropleth = hasPolygons && CHOROPLETH_MODES.includes(surfaceMode);

  const countyChoroplethPaint: Record<string, unknown> =
    surfaceMode === "rice_production"
      ? {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "production_index"], 0],
            48,
            "#0c4a6e",
            62,
            "#0369a1",
            76,
            "#15803d",
            88,
            "#ca8a04",
            96,
            "#fef08a",
          ],
          "fill-opacity": 0.74,
        }
      : surfaceMode === "food_security"
        ? {
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
          }
        : surfaceMode === "inventory_pressure"
          ? {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "inventory_pressure_score"], 50],
                38,
                "#14532d",
                62,
                "#a16207",
                92,
                "#9f1239",
              ],
              "fill-opacity": 0.72,
            }
          : surfaceMode === "dao_compliance"
            ? {
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
              }
            : {
                "fill-color": "#000000",
                "fill-opacity": 0,
              };

  const centroidCirclePaint =
    surfaceMode === "rice_production"
      ? ({
          "circle-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "production_index"], 1],
            48,
            "#0ea5e9",
            72,
            "#22c55e",
            92,
            "#eab308",
          ],
          "circle-opacity": 0.82,
          "circle-radius": ["interpolate", ["linear"], ["get", "production_index"], 40, 14, 96, 38],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.35)",
        } as Record<string, unknown>)
      : surfaceMode === "food_security"
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
            "circle-opacity": 0.82,
            "circle-radius": ["interpolate", ["linear"], ["get", "farmer_count"], 1, 10, 40, 44],
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,0.35)",
          } as Record<string, unknown>)
        : surfaceMode === "inventory_pressure"
          ? ({
              "circle-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "inventory_pressure_score"], 50],
                38,
                "#14532d",
                62,
                "#c2410c",
                92,
                "#9f1239",
              ],
              "circle-opacity": 0.82,
              "circle-radius": ["interpolate", ["linear"], ["get", "inventory_pressure_score"], 35, 14, 95, 40],
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
                "circle-opacity": 0.82,
                "circle-radius": ["interpolate", ["linear"], ["get", "dao_compliance"], 40, 14, 96, 38],
                "circle-stroke-width": 2,
                "circle-stroke-color": "rgba(255,255,255,0.35)",
              } as Record<string, unknown>)
            : ({
                "circle-color": "#64748b",
                "circle-opacity": 0.22,
                "circle-radius": 20,
                "circle-stroke-width": 1,
                "circle-stroke-color": "rgba(255,255,255,0.2)",
              } as Record<string, unknown>);

  const corridorAnimate =
    mapLoaded && (overlays.logisticsCorridors || overlays.subsidyDistribution || overlays.daoReportingPulse);

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
  }, [corridorAnimate, overlays.daoReportingPulse, overlays.logisticsCorridors, overlays.subsidyDistribution]);

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

  const onMouseMove = React.useCallback(
    (e: MapLayerMouseEvent) => {
      if (!onCountyHover) return;
      const f = e.features?.[0];
      if (!f?.properties) {
        onCountyHover(null);
        return;
      }
      const lid = f.layer?.id;
      if (lid !== "gis-counties-fill" && lid !== "gis-county-metric-circles") {
        onCountyHover(null);
        return;
      }
      const p = f.properties as Record<string, unknown>;
      onCountyHover({
        county: String(p.countyName ?? p.county ?? "—"),
        productionIndex: Number(p.production_index ?? 0),
        riskScore: Number(p.food_risk_score ?? 0),
        warehouseUtilizationPct: Number(p.warehouse_utilization_avg ?? 0),
        daoReportingPct: Number(p.dao_compliance ?? 0),
        x: e.point.x,
        y: e.point.y,
      });
    },
    [onCountyHover],
  );

  const interactiveIds = React.useMemo(() => {
    const ids: string[] = [];
    if (hasPolygons) ids.push("gis-counties-fill");
    if (!hasPolygons || surfaceMode === "off") ids.push("gis-county-metric-circles");
    if (overlays.warehouses) ids.push("gis-warehouse-circles");
    if (overlays.daoOffices) ids.push("gis-dao-circles");
    return ids;
  }, [hasPolygons, overlays.daoOffices, overlays.warehouses, surfaceMode]);

  const ghostCentroids = hasPolygons && showCountyChoropleth;

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
      onMouseMove={onMouseMove}
      onMouseLeave={() => onCountyHover?.(null)}
      onLoad={() => setMapLoaded(true)}
    >
      {countyPolygons && hasPolygons ? (
        <Source id="gis-counties-poly" type="geojson" data={countyPolygons as never}>
          <Layer id="gis-counties-fill" type="fill" layout={{ visibility: "visible" }} paint={countyChoroplethPaint} />
          <Layer
            id="gis-counties-outline"
            type="line"
            layout={{ visibility: "visible" }}
            paint={{
              "line-color": "rgba(148,163,184,0.4)",
              "line-width": surfaceMode === "off" ? 0.9 : 1.1,
              "line-opacity": surfaceMode === "off" ? 0.45 : 0.65,
            }}
          />
        </Source>
      ) : null}

      <Source id="gis-county-metrics" type="geojson" data={metricPoints as never}>
        <Layer
          id="gis-prod-heatmap"
          type="heatmap"
          layout={{ visibility: visibility(surfaceMode === "rice_production") }}
          paint={{
            "heatmap-weight": ["/", ["+", ["coalesce", ["get", "production_index"], 1], 5], 110],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.45, 8, 1.05],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 36, 9, 78],
            "heatmap-opacity": showCountyChoropleth ? 0.38 : 0.82,
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
          layout={{ visibility: visibility(overlays.farmerDensity && surfaceMode !== "rice_production") }}
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
          layout={{ visibility: visibility(overlays.farmerDensity && surfaceMode === "rice_production") }}
          paint={{
            "heatmap-weight": ["*", ["coalesce", ["get", "farmer_count"], 1], 0.65],
            "heatmap-intensity": 0.55,
            "heatmap-radius": 38,
            "heatmap-opacity": 0.32,
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
            ghostCentroids
              ? ({
                  "circle-color": "#ffffff",
                  "circle-opacity": 0.012,
                  "circle-radius": 28,
                  "circle-stroke-width": 0,
                } as Record<string, unknown>)
              : centroidCirclePaint
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
          layout={{ visibility: visibility(overlays.logisticsCorridors) }}
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
          layout={{ visibility: visibility(overlays.logisticsCorridors) }}
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

      <Source id="gis-dao-offices" type="geojson" data={daoPoints as never}>
        <Layer
          id="gis-dao-circles"
          type="circle"
          layout={{ visibility: visibility(overlays.daoOffices) }}
          paint={{
            "circle-radius": 7,
            "circle-color": "#fbbf24",
            "circle-opacity": 0.88,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#1e293b",
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
