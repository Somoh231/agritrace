import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_FARMERS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { normalizeCountyKey } from "@/lib/data/ministry-data-service";
import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";

export type CaoMapMarker = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  kind: "warehouse" | "dao" | "risk" | "pest";
  meta?: string;
};

function hashDao(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function warehouseMarkersForCounty(county: string | null): CaoMapMarker[] {
  const nk = normalizeCountyKey(county);
  return MINISTRY_WAREHOUSES.filter((w) => !nk || normalizeCountyKey(w.county) === nk).map((w) => ({
    id: `wh-${w.ministryCode}`,
    lng: w.longitude,
    lat: w.latitude,
    label: w.name,
    kind: "warehouse",
    meta: `${w.utilizationPct}% util`,
  }));
}

export function daoMarkersForCounty(county: string | null, daoRows: DaoOversightRow[]): CaoMapMarker[] {
  const nk = normalizeCountyKey(county);
  const cm = MINISTRY_COUNTY_METRICS.find((m) => normalizeCountyKey(m.county) === nk);
  const baseLng = cm?.lng ?? -9.2;
  const baseLat = cm?.lat ?? 6.6;

  return daoRows.map((r) => {
    const farmerHit = MINISTRY_FARMERS.find((f) => f.daoCode === r.daoId && (!nk || normalizeCountyKey(f.county) === nk));
    const h = hashDao(r.daoId);
    const jitterLng = baseLng + ((h % 70) - 35) / 220;
    const jitterLat = baseLat + (((h >> 5) % 70) - 35) / 220;
    return {
      id: `dao-${r.daoId}`,
      lng: farmerHit?.gpsLng ?? jitterLng,
      lat: farmerHit?.gpsLat ?? jitterLat,
      label: `${r.daoId} · ${r.daoName}`,
      kind: "dao",
      meta: `${r.district} · sync ${r.syncStatus}`,
    };
  });
}

export function riskHotspotsForCounty(county: string | null, daoRows: DaoOversightRow[]): CaoMapMarker[] {
  return daoRows
    .filter((r) => r.riskStatus === "high" || r.syncStatus === "at_risk")
    .map((r) => {
      const m = daoMarkersForCounty(county, [r])[0];
      return {
        ...m,
        id: `risk-${r.daoId}`,
        kind: "risk",
        label: `Risk · ${r.daoName}`,
      };
    });
}

export function pestAlertMarkers(county: string | null): CaoMapMarker[] {
  const nk = normalizeCountyKey(county);
  const hits = MINISTRY_OPERATIONAL_EVENTS.filter(
    (e) => (!nk || normalizeCountyKey(e.county) === nk) && e.eventType.toLowerCase().includes("pest"),
  );
  return hits.map((e) => {
    const cm = MINISTRY_COUNTY_METRICS.find((m) => normalizeCountyKey(m.county) === normalizeCountyKey(e.county));
    const baseLng = cm?.lng ?? -9.2;
    const baseLat = cm?.lat ?? 6.6;
    const h = hashDao(e.eventCode);
    return {
      id: `pest-${e.eventCode}`,
      lng: baseLng + ((h % 55) - 27) / 160,
      lat: baseLat + (((h >> 4) % 55) - 27) / 160,
      label: `Pest · ${e.district}`,
      kind: "pest",
      meta: e.message,
    };
  });
}
