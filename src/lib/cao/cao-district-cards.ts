import { normalizeCountyKey } from "@/lib/data/ministry-data-service";
import { MINISTRY_COUNTY_METRICS, MINISTRY_DAO_OFFICERS, MINISTRY_FARMERS } from "@/lib/data/ministry-canonical-data";

export type CaoDistrictCard = {
  district: string;
  productionIndex: number;
  farmerRegProgressPct: number;
  subsidyCompletionPct: number;
  daoActivityScore: number;
  foodSecurityRisk: string;
  reportingCompliancePct: number;
};

export function buildCaoDistrictCards(county: string | null): CaoDistrictCard[] {
  const nk = normalizeCountyKey(county);
  const countyMetric = MINISTRY_COUNTY_METRICS.find((m) => normalizeCountyKey(m.county) === nk);

  const daos = MINISTRY_DAO_OFFICERS.filter((d) => !nk || normalizeCountyKey(d.county) === nk);
  const byDistrict = new Map<string, typeof daos>();
  for (const d of daos) {
    const prev = byDistrict.get(d.district) ?? [];
    prev.push(d);
    byDistrict.set(d.district, prev);
  }

  const cards: CaoDistrictCard[] = [];
  for (const [district, list] of byDistrict) {
    const avgComp = list.reduce((s, x) => s + x.complianceScore, 0) / Math.max(1, list.length);
    const farmersInDistrict = MINISTRY_FARMERS.filter(
      (f) => (!nk || normalizeCountyKey(f.county) === nk) && f.district === district,
    ).length;
    const activity = Math.round(
      list.reduce((s, x) => s + x.reportsSubmitted + x.farmVisits * 0.15 + x.overdueReports * -4, 0) / Math.max(1, list.length),
    );

    cards.push({
      district,
      productionIndex: countyMetric?.productionIndex ?? 68,
      farmerRegProgressPct: Math.min(100, 28 + farmersInDistrict * 6),
      subsidyCompletionPct: Math.min(100, Math.round(52 + avgComp * 0.42)),
      daoActivityScore: Math.max(0, activity),
      foodSecurityRisk: countyMetric?.foodRisk ?? "Moderate",
      reportingCompliancePct: Math.round(avgComp),
    });
  }

  return cards.sort((a, b) => a.district.localeCompare(b.district));
}
