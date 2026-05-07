import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

type GjPoint = { type: "Point"; coordinates: [number, number] };
type GjLineString = { type: "LineString"; coordinates: [number, number][] };
type GjFeature<G> = { type: "Feature"; id?: string; properties: Record<string, unknown>; geometry: G };
type GjFeatureCollection<G> = { type: "FeatureCollection"; features: GjFeature<G>[] };

export type CountySurfaceMode = "off" | "production_heatmap" | "food_security" | "dao_compliance" | "county_risk";

export type GisOverlayToggles = {
  farmerDensity: boolean;
  warehouses: boolean;
  subsidyDistribution: boolean;
  daoReportingPulse: boolean;
  pestOutbreaks: boolean;
  inventoryMovementRoutes: boolean;
  transferRoutes: boolean;
};

export function countyKey(name: string) {
  return name.trim().toLowerCase();
}

function foodRiskScore(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("elevated")) return 85;
  if (l.includes("moderate")) return 52;
  return 28;
}

function warehouseCoords(code: string): [number, number] | null {
  const w = MINISTRY_WAREHOUSES.find((x) => x.ministryCode === code);
  return w ? [w.longitude, w.latitude] : null;
}

/** Point per pilot county — used when polygon GeoJSON is empty or as overlay anchors. */
export function buildCountyMetricPointsGeoJSON(): GjFeatureCollection<GjPoint> {
  const farmerByCounty = new Map<string, number>();
  const subsidyByCounty = new Map<string, number>();
  for (const f of MINISTRY_FARMERS) {
    const k = countyKey(f.county);
    farmerByCounty.set(k, (farmerByCounty.get(k) ?? 0) + 1);
    if (f.subsidyEligible) {
      subsidyByCounty.set(k, (subsidyByCounty.get(k) ?? 0) + f.subsidyAllocationQty);
    }
  }

  const daoByCounty = new Map<string, { avg: number; n: number }>();
  for (const d of MINISTRY_DAO_OFFICERS) {
    const k = countyKey(d.county);
    const cur = daoByCounty.get(k) ?? { avg: 0, n: 0 };
    daoByCounty.set(k, {
      avg: (cur.avg * cur.n + d.complianceScore) / (cur.n + 1),
      n: cur.n + 1,
    });
  }

  const features: GjFeature<GjPoint>[] = MINISTRY_COUNTY_METRICS.map((m) => {
    const k = countyKey(m.county);
    const farmers = farmerByCounty.get(k) ?? 3;
    const subsidy = subsidyByCounty.get(k) ?? 0;
    const dao = daoByCounty.get(k)?.avg ?? m.daoCompliance;
    const foodRisk = foodRiskScore(m.foodRisk);
    const countyRisk = Math.min(
      100,
      Math.round(foodRisk * 0.45 + (100 - dao) * 0.35 + (82 - m.productionIndex) * 0.35),
    );
    return {
      type: "Feature",
      id: k,
      properties: {
        county: m.county,
        production_index: m.productionIndex,
        food_risk_label: m.foodRisk,
        food_risk_score: foodRisk,
        dao_compliance: Math.round(dao),
        county_risk_score: countyRisk,
        farmer_count: farmers,
        subsidy_allocation_mt: Math.round(subsidy * 10) / 10,
      },
      geometry: { type: "Point", coordinates: [m.lng, m.lat] },
    };
  });

  return { type: "FeatureCollection", features };
}

export function buildWarehousePointsGeoJSON(): GjFeatureCollection<GjPoint> {
  return {
    type: "FeatureCollection",
    features: MINISTRY_WAREHOUSES.map((w) => ({
      type: "Feature",
      properties: {
        code: w.ministryCode,
        name: w.name,
        county: w.county,
        utilization: w.utilizationPct,
        donor_resupply: w.donorResupplyFlag,
      },
      geometry: { type: "Point", coordinates: [w.longitude, w.latitude] },
    })),
  };
}

export function buildPestEventsGeoJSON(): GjFeatureCollection<GjPoint> {
  const pests = MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.eventType.toLowerCase().includes("pest"));
  const metricsByCounty = new Map(MINISTRY_COUNTY_METRICS.map((m) => [countyKey(m.county), m]));
  const features: GjFeature<GjPoint>[] = pests.map((e) => {
    const m = metricsByCounty.get(countyKey(e.county));
    const lng = m?.lng ?? -9.5;
    const lat = m?.lat ?? 6.5;
    return {
      type: "Feature",
      properties: {
        code: e.eventCode,
        county: e.county,
        message: e.message,
        status: e.status,
        severity: e.severity,
      },
      geometry: { type: "Point", coordinates: [lng + 0.06, lat + 0.04] },
    };
  });
  return { type: "FeatureCollection", features };
}

export function buildInventoryMovementRoutesGeoJSON(): GjFeatureCollection<GjLineString> {
  const features: GjFeature<GjLineString>[] = [];
  for (const mov of MINISTRY_INVENTORY_MOVEMENTS) {
    const a = warehouseCoords(mov.fromWarehouseCode);
    const b = warehouseCoords(mov.toWarehouseCode);
    if (!a || !b) continue;
    features.push({
      type: "Feature",
      properties: {
        kind: "inventory_movement",
        reference: mov.reference,
        sku: mov.sku,
        qty: mov.quantity,
      },
      geometry: { type: "LineString", coordinates: [a, b] },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Subsidy-weighted stylized flows: warehouse → county centroids with beneficiary allocation. */
export function buildSubsidyFlowLinesGeoJSON(): GjFeatureCollection<GjLineString> {
  const subsidyByCounty = new Map<string, number>();
  const warehouseWeight = new Map<string, number>();
  for (const f of MINISTRY_FARMERS) {
    if (!f.subsidyEligible) continue;
    const ck = countyKey(f.county);
    subsidyByCounty.set(ck, (subsidyByCounty.get(ck) ?? 0) + f.subsidyAllocationQty);
    const wh = f.primaryWarehouseCode;
    warehouseWeight.set(wh, (warehouseWeight.get(wh) ?? 0) + f.subsidyAllocationQty);
  }

  const sortedWh = [...warehouseWeight.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const features: GjFeature<GjLineString>[] = [];
  for (const [whCode] of sortedWh) {
    const origin = warehouseCoords(whCode);
    if (!origin) continue;
    for (const m of MINISTRY_COUNTY_METRICS) {
      const amt = subsidyByCounty.get(countyKey(m.county)) ?? 0;
      if (amt < 8) continue;
      features.push({
        type: "Feature",
        properties: {
          kind: "subsidy_flow",
          subsidy_mt: Math.round(amt * 10) / 10,
          warehouse: whCode,
          county: m.county,
        },
        geometry: {
          type: "LineString",
          coordinates: [origin, [m.lng, m.lat]],
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

export function enrichCountyPolygons(
  base: { type: "FeatureCollection"; features: Array<{ properties?: Record<string, unknown>; geometry?: unknown; type?: string }> },
  metricPoints: GjFeatureCollection<GjPoint>,
): { type: "FeatureCollection"; features: Array<{ properties?: Record<string, unknown>; geometry?: unknown; type?: string }> } {
  const metricMap = new Map<string, Record<string, unknown>>();
  for (const f of metricPoints.features) {
    const p = f.properties;
    const name = String(p.county ?? "");
    if (name) metricMap.set(countyKey(name), p);
  }

  return {
    ...base,
    features: base.features.map((f) => {
      const props = f.properties ?? {};
      const raw =
        (props.county as string) ??
        (props.COUNTY as string) ??
        (props.name as string) ??
        (props.COUNTYNAME as string) ??
        "";
      const m = metricMap.get(countyKey(raw));
      return {
        ...f,
        properties: {
          ...props,
          countyName: raw || String(props.name ?? "Unknown"),
          ...(m ?? {}),
        },
      };
    }),
  };
}

export function countyAlerts(countyName: string) {
  return MINISTRY_OPERATIONAL_EVENTS.filter((e) => countyKey(e.county) === countyKey(countyName));
}

export function countyWarehouses(countyName: string) {
  return MINISTRY_WAREHOUSES.filter((w) => countyKey(w.county) === countyKey(countyName));
}

export function countyProductionMetric(countyName: string) {
  return MINISTRY_COUNTY_METRICS.find((m) => countyKey(m.county) === countyKey(countyName));
}

export function countyDaoMetrics(countyName: string) {
  return MINISTRY_DAO_OFFICERS.filter((d) => countyKey(d.county) === countyKey(countyName));
}

export function warehouseInventory(code: string) {
  return MINISTRY_INVENTORY_LINES.filter((l) => l.warehouseMinistryCode === code);
}

export function warehouseDistricts(code: string) {
  const set = new Set<string>();
  for (const f of MINISTRY_FARMERS) {
    if (f.primaryWarehouseCode === code) set.add(f.district);
  }
  return [...set];
}
