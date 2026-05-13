import area from "@turf/area";
import centroid from "@turf/centroid";
import type { Polygon, Position } from "geojson";

import type { OperationalBoundaryPoint, OperationalFarmBoundary } from "./operational-boundary-types";

const SQ_M_PER_HA = 10_000;
const SQ_M_PER_ACRE = 4046.8564224;

/** Build closed ring from corner points (no duplicate closing pt in input). */
export function ringFromPoints(points: OperationalBoundaryPoint[]): Position[] {
  if (points.length < 3) return [];
  const ring: Position[] = points.map((p) => [p.longitude, p.latitude]);
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

export function polygonFromPoints(points: OperationalBoundaryPoint[]): Polygon | null {
  const ring = ringFromPoints(points);
  if (ring.length < 4) return null;
  return { type: "Polygon", coordinates: [ring] };
}

export function estimateAreasSqm(poly: Polygon): { hectares: number; acres: number; squareMeters: number } {
  const squareMeters = area(poly);
  return {
    squareMeters,
    hectares: squareMeters / SQ_M_PER_HA,
    acres: squareMeters / SQ_M_PER_ACRE,
  };
}

export function polygonCentroidLngLat(poly: Polygon): { lng: number; lat: number } | null {
  try {
    const c = centroid(poly);
    const [lng, lat] = c.geometry.coordinates;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
  } catch {
    return null;
  }
}

export function operationalBoundaryFromPersistedRow(row: {
  boundary_geometry?: unknown;
  boundary_points?: unknown;
  boundary_area_ha?: unknown;
  boundary_captured_at?: unknown;
  visited_by?: unknown;
}): OperationalFarmBoundary | null {
  const g = row.boundary_geometry;
  if (!g || typeof g !== "object" || (g as Polygon).type !== "Polygon") return null;
  const geometry = g as Polygon;
  const capturedPoints = Array.isArray(row.boundary_points)
    ? (row.boundary_points as OperationalBoundaryPoint[])
    : [];
  const { hectares, acres } = estimateAreasSqm(geometry);
  const storedHa = row.boundary_area_ha != null && Number.isFinite(Number(row.boundary_area_ha)) ? Number(row.boundary_area_ha) : null;
  const officer =
    row.visited_by != null && typeof row.visited_by === "string" && row.visited_by.trim() ? row.visited_by.trim() : null;
  return {
    type: "OperationalFarmBoundary",
    version: 1,
    geometry,
    capturedPoints,
    areaHectares: storedHa ?? hectares,
    areaAcres: acres,
    capturedAt: typeof row.boundary_captured_at === "string" ? row.boundary_captured_at : new Date().toISOString(),
    officerProfileId: officer,
  };
}

function normalizeCapturedPoints(raw: unknown): OperationalBoundaryPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: OperationalBoundaryPoint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const ts = typeof p.timestamp === "string" ? p.timestamp : new Date().toISOString();
    const acc = p.accuracyM != null ? Number(p.accuracyM) : p.accuracy_m != null ? Number(p.accuracy_m) : null;
    out.push({
      latitude: lat,
      longitude: lng,
      timestamp: ts,
      accuracyM: acc != null && Number.isFinite(acc) ? acc : null,
    });
  }
  return out;
}

/** Reconstruct operational boundary from `plots.polygon_geojson` (Polygon or Feature). */
export function operationalBoundaryFromPlotGeoJson(polygon_geojson: unknown, createdAt?: string): OperationalFarmBoundary | null {
  if (!polygon_geojson || typeof polygon_geojson !== "object") return null;
  const o = polygon_geojson as { type?: string; geometry?: Polygon; properties?: Record<string, unknown> };
  let geometry: Polygon | null = null;
  if (o.type === "Polygon") geometry = o as unknown as Polygon;
  else if (o.type === "Feature" && o.geometry?.type === "Polygon") geometry = o.geometry;
  if (!geometry) return null;
  const { hectares, acres } = estimateAreasSqm(geometry);
  let capturedAt = createdAt ?? new Date().toISOString();
  let capturedPoints: OperationalBoundaryPoint[] = [];
  if (o.type === "Feature" && o.properties && typeof o.properties === "object") {
    const props = o.properties;
    if (typeof props.captured_at === "string") capturedAt = props.captured_at;
    capturedPoints = normalizeCapturedPoints(props.captured_points);
  }
  return {
    type: "OperationalFarmBoundary",
    version: 1,
    geometry,
    capturedPoints,
    areaHectares: hectares,
    areaAcres: acres,
    capturedAt,
  };
}

export function buildOperationalBoundaryRecord(params: {
  points: OperationalBoundaryPoint[];
  officerProfileId?: string | null;
}): OperationalFarmBoundary | null {
  const geometry = polygonFromPoints(params.points);
  if (!geometry) return null;
  const { hectares, acres } = estimateAreasSqm(geometry);
  return {
    type: "OperationalFarmBoundary",
    version: 1,
    geometry,
    capturedPoints: params.points.map((p) => ({ ...p })),
    areaHectares: hectares,
    areaAcres: acres,
    capturedAt: new Date().toISOString(),
    officerProfileId: params.officerProfileId ?? null,
  };
}
