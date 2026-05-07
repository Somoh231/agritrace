import type { CountyProductionRow } from "@/lib/demo/agriculture-pilot-data";
import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

function ck(name: string) {
  return name.trim().toLowerCase();
}

export type CountyOperationalSnapshot = {
  county: string;
  nationalRank: number;
  reportingCompletionPct: number;
  activeFieldOfficers: number;
  warehouseHealth: "stable" | "watch" | "critical";
  fertilizerAvailabilityPct: number;
  verificationBacklog: number;
  unresolvedFieldReports: number;
  districtDelayScore: number;
  connectivityQuality: "good" | "degraded" | "poor";
  lastSyncDisplay: string;
  productionTrendLabel: string;
  inventoryMovementSummary: string;
  subsidyAllocationStatus: string;
  operationalAlerts: string[];
  donorShipmentNote: string;
  auditReconciliationNote?: string;
  reportingConfidenceScore: number;
  foodSecurityRisk: string;
  narratives: string[];
};

function connectivityForCounty(county: string, status: CountyProductionRow["status"]): CountyOperationalSnapshot["connectivityQuality"] {
  const k = ck(county);
  if (k.includes("lofa") || k.includes("margibi")) return status === "critical" ? "poor" : "degraded";
  if (status === "critical") return "degraded";
  const h = county.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return h % 11 === 0 ? "degraded" : "good";
}

export function buildCountyOperationalSnapshots(countiesRanked: CountyProductionRow[]): CountyOperationalSnapshot[] {
  const metricsMap = new Map(MINISTRY_COUNTY_METRICS.map((m) => [ck(m.county), m]));
  const sorted = [...countiesRanked].sort((a, b) => b.productionMt - a.productionMt);

  return sorted.map((row, idx) => {
    const k = ck(row.county);
    const metric = metricsMap.get(k);
    const daoInCounty = MINISTRY_DAO_OFFICERS.filter((d) => ck(d.county) === k);
    const overdueDao = daoInCounty.reduce((s, d) => s + d.overdueReports, 0);
    const activeOfficers = daoInCounty.filter((d) => d.status === "Active").length || daoInCounty.length;

    const farmersCounty = MINISTRY_FARMERS.filter((f) => ck(f.county) === k);
    const verificationBacklog = farmersCounty.filter((f) => f.verification === "Pending").length;
    const subsidyEligible = farmersCounty.filter((f) => f.subsidyEligible).length;

    const eventsCounty = MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.county && ck(e.county) === k);
    const openEscalated = eventsCounty.filter((e) => e.status === "Open" || e.status === "Escalated");

    const whCounty = MINISTRY_WAREHOUSES.filter((w) => ck(w.county) === k);
    const avgUtil =
      whCounty.length > 0 ? whCounty.reduce((s, w) => s + w.utilizationPct, 0) / whCounty.length : row.status === "healthy" ? 68 : 74;
    const codes = new Set(whCounty.map((w) => w.ministryCode));
    const lowLines = MINISTRY_INVENTORY_LINES.filter(
      (l) => codes.has(l.warehouseMinistryCode) && l.stockStatus.toLowerCase().includes("low"),
    );
    const donorWh = whCounty.some((w) => w.donorResupplyFlag);

    let warehouseHealth: CountyOperationalSnapshot["warehouseHealth"] = "stable";
    if (avgUtil >= 88 || lowLines.length >= 2) warehouseHealth = "critical";
    else if (avgUtil >= 78 || lowLines.length === 1 || row.status === "warning") warehouseHealth = "watch";

    const movements = MINISTRY_INVENTORY_MOVEMENTS.filter((m) => codes.has(m.fromWarehouseCode) || codes.has(m.toWarehouseCode));
    const movementSummary =
      movements.length === 0
        ? "No corridor movements in ledger window."
        : `${movements.length} recorded legs · last ${movements[movements.length - 1]?.reference ?? "—"}`;

    const daoCompliance = metric?.daoCompliance ?? (row.status === "healthy" ? 88 : row.status === "warning" ? 74 : 61);
    let reportingCompletionPct = Math.round(daoCompliance - overdueDao * 3 - (row.lossPct > 12 ? 8 : 0));
    reportingCompletionPct = Math.max(38, Math.min(98, reportingCompletionPct));

    const fertPct = Math.max(35, Math.min(96, Math.round(92 - row.lossPct * 2.2 - (warehouseHealth === "critical" ? 12 : 0))));

    const unresolvedFieldReports = openEscalated.length + overdueDao;
    const districtDelayScore = Math.min(
      100,
      overdueDao * 14 + openEscalated.length * 22 + (row.status === "critical" ? 28 : row.status === "warning" ? 12 : 0),
    );

    const connectivity = connectivityForCounty(row.county, row.status);
    const trend =
      row.status === "healthy"
        ? "Trajectory steady vs national seasonal curve."
        : row.status === "warning"
          ? "Attainment lagging target band — monitoring intensified."
          : "Below tolerance — county escalation path active.";

    let subsidyAllocationStatus = subsidyEligible === 0 ? "No active subsidy cohort flagged." : `${subsidyEligible} households in subsidy scope`;
    if (row.status === "critical") subsidyAllocationStatus += " · absorption review queued";

    const donorShipmentNote = donorWh
      ? "Donor resupply corridor flagged for this county — national logistics notified."
      : "No donor vessel dependency on primary hubs this interval.";

    const auditNote =
      overdueDao >= 3 || openEscalated.length >= 2
        ? "Reconciliation variance: DAO cadence + open incidents exceed ministry tolerance."
        : undefined;

    const confidence = Math.round(
      reportingCompletionPct * 0.45 + (metric?.productionIndex ?? 70) * 0.35 + (connectivity === "good" ? 12 : connectivity === "degraded" ? 4 : 0),
    );
    const reportingConfidenceScore = Math.max(41, Math.min(97, confidence));

    const foodSecurityRisk = metric?.foodRisk ?? (row.status === "critical" ? "Elevated" : row.status === "warning" ? "Moderate" : "Low");

    const narratives: string[] = [];
    if (connectivity === "poor" || connectivity === "degraded") {
      narratives.push(
        `${row.county} reporting cadence tightened after intermittent connectivity across portions of the reporting mesh.`,
      );
    }
    if (warehouseHealth === "critical" || lowLines.length > 0) {
      narratives.push(
        `${row.county} warehouse inputs ${lowLines.some((l) => l.sku.includes("FERT")) ? "show fertilizer stress" : "tightening"} — projected runway below comfort if transfers do not close.`,
      );
    }
    if (daoInCounty.length && overdueDao === 0 && row.status === "healthy") {
      narratives.push(`${row.county} field verification cadence firm — DAO roster clearing submissions without backlog.`);
    }
    if (narratives.length === 0) {
      narratives.push(`${row.county} operating within ministry reconciliation band — continue district QA sampling.`);
    }

    const operationalAlerts = openEscalated.slice(0, 3).map((e) => `${e.severity}: ${e.message}`);
    if (operationalAlerts.length === 0 && row.status !== "healthy") {
      operationalAlerts.push(`County posture ${row.status} — national desk monitoring attainment vs target.`);
    }

    return {
      county: row.county,
      nationalRank: idx + 1,
      reportingCompletionPct,
      activeFieldOfficers: activeOfficers || daoInCounty.length,
      warehouseHealth,
      fertilizerAvailabilityPct: fertPct,
      verificationBacklog,
      unresolvedFieldReports,
      districtDelayScore,
      connectivityQuality: connectivity,
      lastSyncDisplay: "2026-05-05 · 14:22 UTC (national reconcile)",
      productionTrendLabel: trend,
      inventoryMovementSummary: movementSummary,
      subsidyAllocationStatus,
      operationalAlerts,
      donorShipmentNote,
      auditReconciliationNote: auditNote,
      reportingConfidenceScore,
      foodSecurityRisk,
      narratives,
    };
  });
}
