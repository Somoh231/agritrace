import type { Polygon } from "geojson";

/** One walked corner — operational capture, not survey-grade. */
export type OperationalBoundaryPoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
  /** GPS accuracy in metres when available */
  accuracyM: number | null;
};

/** Saved to reports / plots / visits — standard GeoJSON polygon + traceability metadata. */
export type OperationalFarmBoundary = {
  type: "OperationalFarmBoundary";
  version: 1;
  /** GeoJSON Polygon (WGS84), ring closed [lng, lat] */
  geometry: Polygon;
  capturedPoints: OperationalBoundaryPoint[];
  /** Estimated from polygon area — not legal or cadastral */
  areaHectares: number;
  areaAcres: number;
  capturedAt: string;
  officerProfileId?: string | null;
};

export function isOperationalFarmBoundary(v: unknown): v is OperationalFarmBoundary {
  if (!v || typeof v !== "object") return false;
  const o = v as OperationalFarmBoundary;
  return (
    o.type === "OperationalFarmBoundary" &&
    o.version === 1 &&
    o.geometry?.type === "Polygon" &&
    Array.isArray(o.geometry.coordinates) &&
    Array.isArray(o.capturedPoints) &&
    typeof o.areaHectares === "number" &&
    typeof o.areaAcres === "number" &&
    typeof o.capturedAt === "string"
  );
}
