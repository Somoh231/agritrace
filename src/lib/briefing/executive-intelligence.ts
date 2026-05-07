import { canonicalTransferOrders } from "@/lib/logistics/canonical-transfers";
import type { TransferWorkflowStatus } from "@/lib/logistics/types";
import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

export type ExecutiveBriefingSnapshot = {
  generatedAtIso: string;
  nationalProduction: {
    productionIndexAvg: number;
    farmerCountCanon: number;
    farmersLive: number | null;
    riceKgBookedLive: number | null;
    headline: string;
  };
  foodSecurity: {
    nationalRiskScoreLive: number | null;
    postureLabel: string;
    elevatedCounties: string[];
    moderateCount: number;
  };
  countyRanking: Array<{
    county: string;
    productionIndex: number;
    foodRisk: string;
    daoCompliance: number;
    interventionPriority: number;
  }>;
  subsidyUtilization: {
    beneficiaryFarmers: number;
    totalAllocatedMt: number;
    utilizationPct: number;
    narrative: string;
  };
  warehouseCoverage: {
    facilityCount: number;
    countiesCovered: number;
    avgUtilizationPct: number;
    overCapacityCount: number;
    donorFlagSites: number;
  };
  incidents: Array<{
    code: string;
    severity: string;
    county: string;
    district: string;
    eventType: string;
    message: string;
    status: string;
    occurredAt: string;
  }>;
  pestOutbreaks: Array<{
    code: string;
    county: string;
    message: string;
    status: string;
    occurredAt: string;
  }>;
  donorProgrammes: Array<{ programme: string; status: string; coverage: string; notes: string }>;
  daoCompliance: { avgPct: number; submissionsCycle: string; warningOfficers: string[] };
  inventoryRisks: Array<{ sku: string; warehouse: string; issue: string }>;
  shipmentDelays: Array<{
    transferCode: string;
    sku: string;
    qty: number;
    status: TransferWorkflowStatus;
    corridor: string;
  }>;
  keyChangesThisWeek: string[];
  countiesNeedingIntervention: string[];
  productionForecasts: string[];
};

export type LiveExecutiveSignals = {
  farmersCount: number | null;
  countiesOnboarded: number | null;
  riceKgBooked: number | null;
  nationalRiskScore: number | null;
};

function riskRank(risk: string): number {
  const order: Record<string, number> = { Elevated: 3, Moderate: 2, Low: 1 };
  return order[risk] ?? 0;
}

export function buildExecutiveBriefingSnapshot(live?: Partial<LiveExecutiveSignals>): ExecutiveBriefingSnapshot {
  const generatedAtIso = new Date().toISOString();

  const productionIndexAvg =
    MINISTRY_COUNTY_METRICS.reduce((s, c) => s + c.productionIndex, 0) / Math.max(MINISTRY_COUNTY_METRICS.length, 1);

  const elevatedCounties = MINISTRY_COUNTY_METRICS.filter((c) => c.foodRisk === "Elevated").map((c) => c.county);
  const moderateCount = MINISTRY_COUNTY_METRICS.filter((c) => c.foodRisk === "Moderate").length;

  const nationalRiskScoreLive = live?.nationalRiskScore ?? null;
  const postureLabel =
    nationalRiskScoreLive != null && nationalRiskScoreLive >= 70
      ? "Elevated national attention"
      : elevatedCounties.length > 0
        ? "County hotspots active"
        : moderateCount >= 4
          ? "Distributed moderate pressure"
          : "Stable national posture";

  const subsidyEligible = MINISTRY_FARMERS.filter((f) => f.subsidyEligible);
  const totalAllocatedMt = subsidyEligible.reduce((s, f) => s + f.subsidyAllocationQty, 0);
  const denomMt = subsidyEligible.length * 12;
  const utilizationPct = denomMt > 0 ? Math.min(100, Math.round((totalAllocatedMt / denomMt) * 100)) : 0;

  const countiesCovered = new Set(MINISTRY_WAREHOUSES.map((w) => w.county)).size;
  const avgUtil =
    MINISTRY_WAREHOUSES.reduce((s, w) => s + w.utilizationPct, 0) / Math.max(MINISTRY_WAREHOUSES.length, 1);
  const overCapacityCount = MINISTRY_WAREHOUSES.filter((w) => w.utilizationPct >= 90).length;
  const donorFlagSites = MINISTRY_WAREHOUSES.filter((w) => w.donorResupplyFlag).length;

  const daoAvg =
    MINISTRY_DAO_OFFICERS.reduce((s, d) => s + d.complianceScore, 0) / Math.max(MINISTRY_DAO_OFFICERS.length, 1);
  const warningOfficers = MINISTRY_DAO_OFFICERS.filter((d) => d.status === "Warning").map((d) => `${d.daoCode} (${d.county})`);

  const incidents = [...MINISTRY_OPERATIONAL_EVENTS].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const pestOutbreaks = incidents
    .filter((e) => e.eventType.toLowerCase().includes("pest"))
    .map((e) => ({
      code: e.eventCode,
      county: e.county,
      message: e.message,
      status: e.status,
      occurredAt: e.occurredAt,
    }));

  const inventoryRisks = MINISTRY_INVENTORY_LINES.filter(
    (l) => l.stockStatus.toLowerCase().includes("low") || isExpirySoon(l.expiryDate),
  ).map((l) => {
    const low = l.stockStatus.toLowerCase().includes("low");
    return {
      sku: l.sku,
      warehouse: l.warehouseMinistryCode,
      issue: low ? `Stock status: ${l.stockStatus}` : `Expiry window: ${l.expiryDate}`,
    };
  });

  const transfers = canonicalTransferOrders();
  const delayedStatuses: TransferWorkflowStatus[] = ["in_transit", "dispatched", "disputed", "requested"];
  const shipmentDelays = transfers
    .filter((t) => delayedStatuses.includes(t.status))
    .map((t) => ({
      transferCode: t.transferCode,
      sku: t.sku,
      qty: t.quantity,
      status: t.status,
      corridor: `${t.fromMinistryCode} → ${t.toMinistryCode}`,
    }));

  const countyRanking = [...MINISTRY_COUNTY_METRICS]
    .map((c) => ({
      county: c.county,
      productionIndex: c.productionIndex,
      foodRisk: c.foodRisk,
      daoCompliance: c.daoCompliance,
      interventionPriority: riskRank(c.foodRisk) * 10 + (100 - c.daoCompliance) / 10 + (85 - c.productionIndex) / 5,
    }))
    .sort((a, b) => b.productionIndex - a.productionIndex);

  const countiesNeedingIntervention = countyRanking
    .filter((c) => c.foodRisk === "Elevated" || c.daoCompliance < 84 || c.productionIndex < 62)
    .slice(0, 6)
    .map((c) => c.county);

  const donorWarehouses = MINISTRY_WAREHOUSES.filter((w) => w.donorResupplyFlag).map((w) => w.ministryCode);
  const donorProgrammes: ExecutiveBriefingSnapshot["donorProgrammes"] = [
    {
      programme: "Strategic reserve & corridor replenishment (multi-donor)",
      status: donorFlagSites > 0 ? "Resupply watch — Lofa corridor" : "Nominal",
      coverage: donorWarehouses.length ? donorWarehouses.join(", ") : "National hubs",
      notes: "Inputs tracked through WH codes with donor flag and ministry custody ledger.",
    },
    {
      programme: "Pilot verified farmer subsidy window",
      status: utilizationPct >= 75 ? "High uptake" : "Headroom available",
      coverage: `${subsidyEligible.length} verified beneficiaries`,
      notes: "Allocation quantities reconciled against DAO distribution attestations.",
    },
  ];

  const farmerDisplay = live?.farmersCount ?? MINISTRY_FARMERS.length;
  const headline =
    live?.riceKgBooked != null && live.riceKgBooked > 0 ?
      `National rice bookings ${Intl.NumberFormat().format(Math.round(live.riceKgBooked))} kg · registry ${Intl.NumberFormat().format(farmerDisplay)} farmers`
    : `Pilot production index ${productionIndexAvg.toFixed(1)} · ${farmerDisplay} farmers (registry signal)`;

  const keyChangesThisWeek = [
    `${MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.status === "Open" || e.status === "Escalated").length} operational incidents open or escalated ministry-wide.`,
    `${shipmentDelays.length} active logistics corridors require custody confirmation (TRF ledger).`,
    `${overCapacityCount} warehouse sites ≥90% utilization — redistribution recommended.`,
    daoAvg >= 88 ?
      `DAO reporting cycle: average compliance ${daoAvg.toFixed(0)}%.`
    : `DAO compliance trailing target (${daoAvg.toFixed(0)}%) — supervision sweep advised.`,
  ];

  const productionForecasts = countyRanking.slice(0, 4).map(
    (c) =>
      `${c.county}: outlook ${c.productionIndex >= 70 ? "stable to positive" : "monitor rainfall & inputs"} — food risk ${c.foodRisk.toLowerCase()}.`,
  );

  return {
    generatedAtIso,
    nationalProduction: {
      productionIndexAvg,
      farmerCountCanon: MINISTRY_FARMERS.length,
      farmersLive: live?.farmersCount ?? null,
      riceKgBookedLive: live?.riceKgBooked ?? null,
      headline,
    },
    foodSecurity: {
      nationalRiskScoreLive,
      postureLabel,
      elevatedCounties,
      moderateCount,
    },
    countyRanking,
    subsidyUtilization: {
      beneficiaryFarmers: subsidyEligible.length,
      totalAllocatedMt,
      utilizationPct,
      narrative: `${utilizationPct}% of modeled subsidy envelope deployed across ${subsidyEligible.length} beneficiaries.`,
    },
    warehouseCoverage: {
      facilityCount: MINISTRY_WAREHOUSES.length,
      countiesCovered,
      avgUtilizationPct: Math.round(avgUtil),
      overCapacityCount,
      donorFlagSites,
    },
    incidents: incidents.map((e) => ({
      code: e.eventCode,
      severity: e.severity,
      county: e.county,
      district: e.district,
      eventType: e.eventType,
      message: e.message,
      status: e.status,
      occurredAt: e.occurredAt,
    })),
    pestOutbreaks,
    donorProgrammes,
    daoCompliance: {
      avgPct: Math.round(daoAvg),
      submissionsCycle: "Weekly DAO production & distribution package",
      warningOfficers,
    },
    inventoryRisks,
    shipmentDelays,
    keyChangesThisWeek,
    countiesNeedingIntervention,
    productionForecasts,
  };
}

function isExpirySoon(isoDate: string): boolean {
  const d = new Date(isoDate).getTime();
  const now = Date.now();
  const days90 = 90 * 86400000;
  return d - now < days90 && d > now;
}

function formatBriefingHeader(title: string, snap: ExecutiveBriefingSnapshot): string {
  const stamp = snap.generatedAtIso.slice(0, 19).replace("T", " ") + " UTC";
  return `${title}\nRepublic of Liberia · Ministry of Agriculture · Agrivault AIS\nGenerated ${stamp}\n${"─".repeat(64)}\n`;
}

export function generateWeeklyBriefingText(snap: ExecutiveBriefingSnapshot): string {
  const lines: string[] = [];
  lines.push(formatBriefingHeader("WEEKLY MINISTER BRIEFING", snap));
  lines.push("EXECUTIVE SUMMARY");
  lines.push(snap.nationalProduction.headline);
  lines.push(`Food security posture: ${snap.foodSecurity.postureLabel}.`);
  if (snap.foodSecurity.nationalRiskScoreLive != null) {
    lines.push(`National risk score (live signal): ${snap.foodSecurity.nationalRiskScoreLive}.`);
  }
  lines.push("");
  lines.push("KEY CHANGES");
  snap.keyChangesThisWeek.forEach((l) => lines.push(`• ${l}`));
  lines.push("");
  lines.push("COUNTIES — INTERVENTION QUEUE");
  snap.countiesNeedingIntervention.forEach((c) => lines.push(`• ${c}`));
  lines.push("");
  lines.push("SUBSIDY & WAREHOUSE");
  lines.push(`Subsidy utilization: ${snap.subsidyUtilization.narrative}`);
  lines.push(
    `Warehouse footprint: ${snap.warehouseCoverage.facilityCount} facilities / ${snap.warehouseCoverage.countiesCovered} counties · avg utilization ${snap.warehouseCoverage.avgUtilizationPct}%`,
  );
  lines.push("");
  lines.push("LOGISTICS & INVENTORY RISK");
  snap.shipmentDelays.slice(0, 6).forEach((s) => lines.push(`• ${s.transferCode} (${s.status}) ${s.sku} qty ${s.qty}`));
  snap.inventoryRisks.slice(0, 6).forEach((r) => lines.push(`• ${r.sku} @ ${r.warehouse}: ${r.issue}`));
  lines.push("");
  lines.push("PESTS & INCIDENTS");
  snap.pestOutbreaks.forEach((p) => lines.push(`• [${p.status}] ${p.county}: ${p.message}`));
  snap.incidents
    .filter((i) => i.status !== "Resolved")
    .slice(0, 5)
    .forEach((i) => lines.push(`• [${i.severity}] ${i.eventType} · ${i.county}: ${i.message}`));
  return lines.join("\n");
}

export function generateCabinetSummaryText(snap: ExecutiveBriefingSnapshot): string {
  const lines: string[] = [];
  lines.push(formatBriefingHeader("CABINET SUMMARY — FOOD & AGRICULTURE", snap));
  lines.push(
    `Production signal: national pilot index ${snap.nationalProduction.productionIndexAvg.toFixed(1)}; registry farmers ${snap.nationalProduction.farmersLive ?? snap.nationalProduction.farmerCountCanon}.`,
  );
  lines.push(`Food security: ${snap.foodSecurity.postureLabel}.`);
  if (snap.foodSecurity.elevatedCounties.length) {
    lines.push(`Elevated county risk: ${snap.foodSecurity.elevatedCounties.join(", ")}.`);
  }
  lines.push(`Subsidy envelope utilization approximately ${snap.subsidyUtilization.utilizationPct}%.`);
  lines.push(`Warehouse stress: ${snap.warehouseCoverage.overCapacityCount} sites at ≥90% capacity.`);
  lines.push(`DAO compliance average ${snap.daoCompliance.avgPct}% (${snap.daoCompliance.warningOfficers.length} officers in warning).`);
  lines.push(`Active pest escalations: ${snap.pestOutbreaks.filter((p) => p.status === "Escalated").length}.`);
  return lines.join("\n");
}

export function generateDonorBriefingText(snap: ExecutiveBriefingSnapshot): string {
  const lines: string[] = [];
  lines.push(formatBriefingHeader("DONOR PROGRAMME BRIEFING", snap));
  snap.donorProgrammes.forEach((p) => {
    lines.push(`Programme: ${p.programme}`);
    lines.push(`Status: ${p.status}`);
    lines.push(`Coverage: ${p.coverage}`);
    lines.push(`Notes: ${p.notes}`);
    lines.push("");
  });
  lines.push("CUSTODY & TRANSPARENCY");
  lines.push(`Facilities reporting donor resupply flag: ${snap.warehouseCoverage.donorFlagSites}.`);
  lines.push(`Open shipment confirmations pending: ${snap.shipmentDelays.length}.`);
  lines.push("County ranking excerpt (production index):");
  snap.countyRanking.slice(0, 5).forEach((c, i) => lines.push(`  ${i + 1}. ${c.county} — ${c.productionIndex}`));
  return lines.join("\n");
}

export function generateCountyEscalationText(snap: ExecutiveBriefingSnapshot): string {
  const lines: string[] = [];
  lines.push(formatBriefingHeader("COUNTY ESCALATION SUMMARY", snap));
  lines.push("Priority counties (intervention queue)");
  snap.countiesNeedingIntervention.forEach((c) => lines.push(`• ${c}`));
  lines.push("");
  lines.push("DAO compliance warnings");
  snap.daoCompliance.warningOfficers.forEach((w) => lines.push(`• ${w}`));
  lines.push("");
  lines.push("Inventory & logistics friction");
  snap.inventoryRisks.slice(0, 8).forEach((r) => lines.push(`• ${r.warehouse} · ${r.sku}: ${r.issue}`));
  snap.shipmentDelays
    .filter((s) => s.status === "disputed" || s.status === "in_transit")
    .forEach((s) => lines.push(`• ${s.transferCode} ${s.corridor} (${s.status})`));
  lines.push("");
  lines.push("Pest / verification");
  snap.pestOutbreaks.forEach((p) => lines.push(`• ${p.county}: ${p.message} [${p.status}]`));
  return lines.join("\n");
}

export function exportDonorTxt(snap: ExecutiveBriefingSnapshot): string {
  return generateDonorBriefingText(snap);
}

export function exportMinistryPrintPlaintext(snap: ExecutiveBriefingSnapshot): string {
  return [
    generateCabinetSummaryText(snap),
    "\n\n",
    generateWeeklyBriefingText(snap),
    "\n\n",
    "APPENDIX — COUNTY RANKING\n",
    snap.countyRanking.map((c) => `${c.county}\t${c.productionIndex}\t${c.foodRisk}\tDAO ${c.daoCompliance}%`).join("\n"),
  ].join("");
}
