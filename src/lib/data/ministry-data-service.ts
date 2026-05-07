/**
 * Browser-safe Supabase reads for ministry pilot tables with canonical CSV fixtures as fallback.
 */

import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import type { CountyProductionRow, PilotStatus, WarehouseRow } from "@/lib/demo/agriculture-pilot-data";
import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
  type MinistryCountyMetricRecord,
  type MinistryDaoOfficerRecord,
  type MinistryOperationalEventRecord,
  type MinistryWarehouseRecord,
} from "@/lib/data/ministry-canonical-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type MinistryFeedTone = "emerald" | "amber" | "rose" | "slate";

export type MinistryFeedItem = {
  id: string;
  at: string;
  tone: MinistryFeedTone;
  title: string;
  detail: string;
};

export function normalizeCountyKey(c: string | null | undefined): string {
  return (c ?? "").trim().toLowerCase();
}

function riskFromDao(d: MinistryDaoOfficerRecord): number {
  const comp = d.complianceScore ?? 70;
  return Math.min(100, Math.round(d.overdueReports * 14 + Math.max(0, 100 - comp)));
}

export function ministryDaoRecordToRow(d: MinistryDaoOfficerRecord): DaoOversightRow {
  return {
    id: d.daoCode,
    daoName: d.fullName,
    district: d.district,
    reportsSubmitted: d.reportsSubmitted,
    overdueReports: d.overdueReports,
    farmVisits: d.farmVisits,
    verificationRate: d.complianceScore,
    lastActivity: d.lastActivity,
    riskScore: riskFromDao(d),
  };
}

export function daoOversightFallback(countyFilter: string | null): DaoOversightRow[] {
  const rows = MINISTRY_DAO_OFFICERS.map(ministryDaoRecordToRow);
  if (!countyFilter) return rows;
  const k = normalizeCountyKey(countyFilter);
  return rows.filter((_, i) => normalizeCountyKey(MINISTRY_DAO_OFFICERS[i]!.county) === k);
}

function mapPilotDaoDbRow(r: Record<string, unknown>): DaoOversightRow {
  const overdue = Number(r.overdue_reports ?? 0);
  const comp = Number(r.compliance_score ?? 70);
  const last = r.last_activity != null ? String(r.last_activity).slice(0, 10) : "—";
  return {
    id: String(r.dao_code ?? r.id ?? "dao"),
    daoName: String(r.full_name ?? "DAO"),
    district: String(r.district ?? "—"),
    reportsSubmitted: Number(r.reports_submitted ?? 0),
    overdueReports: overdue,
    farmVisits: Number(r.farm_visits ?? 0),
    verificationRate: comp,
    lastActivity: last,
    riskScore: Math.min(100, Math.round(overdue * 14 + Math.max(0, 100 - comp))),
  };
}

export async function fetchDaoOversightRows(countyFilter: string | null): Promise<DaoOversightRow[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    let q = supabase
      .from("pilot_dao_officers")
      .select(
        "dao_code,full_name,county,district,reports_submitted,overdue_reports,farm_visits,last_activity,compliance_score",
      )
      .order("compliance_score", { ascending: false });
    if (countyFilter?.trim()) {
      q = q.ilike("county", countyFilter.trim());
    }
    const { data, error } = await q;
    if (error || !data?.length) return daoOversightFallback(countyFilter);
    return (data as Record<string, unknown>[]).map(mapPilotDaoDbRow);
  } catch {
    return daoOversightFallback(countyFilter);
  }
}

function eventTone(sev: string): MinistryFeedTone {
  const s = sev.toUpperCase();
  if (s === "HIGH") return "rose";
  if (s === "MEDIUM") return "amber";
  if (s === "LOW") return "emerald";
  return "slate";
}

function mapEventToFeed(e: MinistryOperationalEventRecord): MinistryFeedItem {
  return {
    id: e.eventCode,
    at: new Date(e.occurredAt).toISOString(),
    tone: eventTone(e.severity),
    title: `${e.eventType} · ${e.county}`,
    detail: e.message + (e.district ? ` · ${e.district}` : ""),
  };
}

export async function fetchOperationalFeedItems(limit = 24): Promise<MinistryFeedItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("pilot_operational_events")
      .select("event_code,occurred_at,severity,county,district,event_type,message,status")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error || !data?.length) {
      return MINISTRY_OPERATIONAL_EVENTS.slice(0, limit).map(mapEventToFeed);
    }
    return (data as Record<string, unknown>[]).map((r) =>
      mapEventToFeed({
        eventCode: String(r.event_code ?? r.id ?? "evt"),
        occurredAt: String(r.occurred_at ?? new Date().toISOString()),
        severity: String(r.severity ?? "LOW").toUpperCase() as MinistryOperationalEventRecord["severity"],
        county: String(r.county ?? "National"),
        district: String(r.district ?? ""),
        eventType: String(r.event_type ?? "Event"),
        message: String(r.message ?? ""),
        status: String(r.status ?? "Open") as MinistryOperationalEventRecord["status"],
      }),
    );
  } catch {
    return MINISTRY_OPERATIONAL_EVENTS.slice(0, limit).map(mapEventToFeed);
  }
}

export function ministryWarehouseToSignalRow(w: MinistryWarehouseRecord): WarehouseRow {
  const u = w.utilizationPct ?? 0;
  let stockRisk: PilotStatus = "healthy";
  if (u >= 92 || w.operationalStatus.toLowerCase().includes("down")) stockRisk = "critical";
  else if (u >= 78) stockRisk = "warning";
  const stock = w.currentStockMt || 0;
  return {
    id: w.ministryCode,
    name: w.name,
    county: w.county,
    riceSeedTons: Math.round(stock * 0.42 * 10) / 10,
    fertilizerTons: Math.round(stock * 0.38 * 10) / 10,
    pesticideTons: Math.round(stock * 0.2 * 10) / 10,
    stockRisk,
    donorTaggedPct: w.donorResupplyFlag ? 72 : 38,
  };
}

export function warehousesSignalFallback(countyFilter: string | null): WarehouseRow[] {
  const mapped = MINISTRY_WAREHOUSES.map(ministryWarehouseToSignalRow);
  if (!countyFilter) return mapped;
  const k = normalizeCountyKey(countyFilter);
  return mapped.filter((w) => normalizeCountyKey(w.county) === k);
}

export async function fetchCountyWarehouseSignals(countyFilter: string | null): Promise<WarehouseRow[]> {
  const fallback = warehousesSignalFallback(countyFilter);
  try {
    const supabase = getSupabaseBrowserClient();
    let q = supabase
      .from("warehouses")
      .select(
        "ministry_code,name,county,current_stock_mt,utilization_pct,operational_status,donor_resupply_flag,capacity_mt",
      )
      .not("ministry_code", "is", null)
      .limit(80);
    if (countyFilter?.trim()) {
      q = q.ilike("county", countyFilter.trim());
    }
    const { data, error } = await q;
    if (error || !data?.length) return fallback;
    const rows = (data as Record<string, unknown>[]).map((r) =>
      ministryWarehouseToSignalRow({
        ministryCode: String(r.ministry_code ?? "WH"),
        name: String(r.name ?? "Warehouse"),
        county: String(r.county ?? ""),
        capacityMt: Number(r.capacity_mt ?? 0),
        currentStockMt: Number(r.current_stock_mt ?? 0),
        utilizationPct: Number(r.utilization_pct ?? 0),
        managerName: "",
        operationalStatus: String(r.operational_status ?? "Operational"),
        donorResupplyFlag: Boolean(r.donor_resupply_flag),
        latitude: 0,
        longitude: 0,
      }),
    );
    return rows.length ? rows : fallback;
  } catch {
    return fallback;
  }
}

function foodRiskToLoss(risk: string): { lossPct: number; status: PilotStatus } {
  const x = risk.toLowerCase();
  if (x.includes("critical") || x.includes("severe")) return { lossPct: 15.5, status: "critical" };
  if (x.includes("high") || x.includes("elev")) return { lossPct: 12.4, status: "warning" };
  if (x.includes("moder")) return { lossPct: 11.2, status: "warning" };
  return { lossPct: 9.6, status: "healthy" };
}

export function countyMetricToProductionRow(
  m: MinistryCountyMetricRecord,
  farmersRegistered = 0,
): CountyProductionRow {
  const prod = Math.max(0, m.productionIndex) * 620;
  const { lossPct, status } = foodRiskToLoss(m.foodRisk);
  let st: PilotStatus = status;
  if (m.daoCompliance < 55) st = st === "healthy" ? "warning" : st;
  if (m.daoCompliance < 40) st = "critical";
  return {
    county: m.county,
    productionMt: prod,
    targetMt: prod * 1.12,
    lossPct,
    status: st,
    farmersRegistered,
  };
}

export function countyMetricsFallbackRows(): CountyProductionRow[] {
  return MINISTRY_COUNTY_METRICS.map((m) => countyMetricToProductionRow(m, 0));
}

export async function fetchPilotCountyMetricRows(): Promise<CountyProductionRow[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("pilot_county_metrics")
      .select("county,production_index,food_risk,dao_compliance")
      .order("production_index", { ascending: false });
    if (error || !data?.length) return countyMetricsFallbackRows();
    return (data as Record<string, unknown>[]).map((r) =>
      countyMetricToProductionRow(
        {
          county: String(r.county ?? ""),
          productionIndex: Number(r.production_index ?? 0),
          foodRisk: String(r.food_risk ?? "Low"),
          daoCompliance: Number(r.dao_compliance ?? 70),
          lng: 0,
          lat: 0,
        },
        0,
      ),
    );
  } catch {
    return countyMetricsFallbackRows();
  }
}
