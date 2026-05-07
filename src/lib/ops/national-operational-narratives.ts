/**
 * Operational intelligence copy — narrative summaries derived from live/canonical signals.
 * Keeps analytics from feeling like empty SaaS KPIs.
 */

export type OpsNarrativeTone = "emerald" | "amber" | "rose" | "slate";

export type OpsNarrative = {
  id: string;
  headline: string;
  detail: string;
  tone: OpsNarrativeTone;
};

export type NationalNarrativeInputs = {
  farmersCount: number;
  productionMt: number;
  targetMt: number;
  productionProgressPct: number;
  nationalRiskScore: number;
  importDependencyPct: number;
  pendingVerification: number;
  geoTaggedPct: number;
  lossRatePct: number;
  /** Top counties by production (already sorted). */
  countiesRanked: Array<{ county: string; productionMt: number; status: string; lossPct: number }>;
  /** Warehouse at highest utilization (canonical). */
  stressedWarehouse: { code: string; name: string; county: string; utilizationPct: number } | null;
};

export function buildNationalOperationalNarratives(i: NationalNarrativeInputs): OpsNarrative[] {
  const out: OpsNarrative[] = [];

  const lead = i.countiesRanked[0];
  const lag = [...i.countiesRanked].sort((a, b) => a.productionMt - b.productionMt)[0];
  const riskiest = [...i.countiesRanked].sort((a, b) => b.lossPct - a.lossPct)[0];

  out.push({
    id: "farmers-verification",
    headline: "Farmer registry & verification posture",
    detail: `${i.farmersCount.toLocaleString()} farmers on national registry; ${i.pendingVerification.toLocaleString()} pending ministry verification; geo capture at ${i.geoTaggedPct}% of verified cohort — field completion drives subsidy eligibility.`,
    tone: i.pendingVerification > 400 ? "amber" : "emerald",
  });

  out.push({
    id: "production-target",
    headline: "Domestic rice production vs national target",
    detail: `Estimated ${i.productionMt.toFixed(0)} t produced (${i.productionProgressPct.toFixed(1)}% of ${i.targetMt.toFixed(0)} t target). ${
      lead ? `${lead.county} leads throughput` : "County mix stabilizing"
    }${lag && lag.county !== lead?.county ? `; lowest attainment signal in ${lag.county}.` : "."}`,
    tone: i.productionProgressPct < 62 ? "amber" : "slate",
  });

  if (i.stressedWarehouse && i.stressedWarehouse.utilizationPct >= 78) {
    out.push({
      id: "warehouse-pressure",
      headline: "Warehouse utilization pressure",
      detail: `${i.stressedWarehouse.name} (${i.stressedWarehouse.code}) · ${i.stressedWarehouse.county} at ${i.stressedWarehouse.utilizationPct}% utilization — redistribution or inbound transfer may be required before district allocations stall.`,
      tone: i.stressedWarehouse.utilizationPct >= 92 ? "rose" : "amber",
    });
  }

  out.push({
    id: "food-security",
    headline: "Food security & import exposure",
    detail: `National risk index ${i.nationalRiskScore}; import dependency lens ${i.importDependencyPct}%. ${
      riskiest ? `Post-harvest loss stress highest in ${riskiest.county} (~${riskiest.lossPct.toFixed(1)}%).` : "Loss gradient within tolerance across pilot counties."
    }`,
    tone: i.nationalRiskScore > 58 ? "amber" : "slate",
  });

  out.push({
    id: "loss-operations",
    headline: "Operational loss & field reconciliation",
    detail: `National loss rate indicator ${i.lossRatePct.toFixed(1)}% — DAO field packs should reconcile warehouse releases within 72h; deviations route to verification queue.`,
    tone: i.lossRatePct > 12 ? "amber" : "emerald",
  });

  return out.slice(0, 6);
}
