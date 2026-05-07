import { daoQueueGetAll, daoQueuePut } from "@/lib/dao/dao-workflow-db";
import type { DaoWorkflowRecord } from "@/lib/dao/dao-workflow-types";
import { MINISTRY_FARMERS } from "@/lib/data/ministry-canonical-data";

const SAMPLE_SESSION_KEY = "agrivault_dao_sample_queue_seeded";

/** Seed the offline queue once per browser session when empty (realistic DAO rehearsal data). */
export async function injectSampleDaoQueueIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return;
  const existing = await daoQueueGetAll();
  if (existing.length > 0) return;
  if (sessionStorage.getItem(SAMPLE_SESSION_KEY) === "1") return;

  const now = new Date().toISOString();
  const samples: DaoWorkflowRecord[] = [
    {
      id: "sample-draft-pest",
      kind: "pest_disease_report",
      status: "draft",
      payload: {
        county: "Nimba",
        pest_type: "Stem borer",
        severity: "moderate",
        notes: "Draft capture — confirm affected hectares with farmer tomorrow.",
      },
      sync_attempts: 0,
      created_at: now,
      updated_at: now,
      title: "Pest observation · Nimba (draft)",
    },
    {
      id: "sample-draft-production",
      kind: "production_estimate",
      status: "draft",
      payload: {
        farmer_id: "",
        season: "2026-A",
        expected_yield_kg: 4200,
        county: "Nimba",
        district: "Sanniquellie-Mah",
        notes: "DAO estimate after plot walk — confirm farmer UUID before submit.",
      },
      sync_attempts: 0,
      created_at: now,
      updated_at: now,
      title: "Production estimate · draft",
    },
  ];

  for (const s of samples) {
    await daoQueuePut(s);
  }
  sessionStorage.setItem(SAMPLE_SESSION_KEY, "1");
}

export type DaoTaskVisit = {
  id: string;
  farmerName: string;
  registryHint?: string;
  county: string;
  district: string;
  dueLabel: string;
  priority: "high" | "normal";
};

export type DaoTaskReport = {
  id: string;
  label: string;
  district: string;
  overdueCount: number;
};

export function sampleDaoTasksForJurisdiction(county: string | null, district: string | null): {
  visits: DaoTaskVisit[];
  reports: DaoTaskReport[];
} {
  const nc = (county ?? "").trim().toLowerCase();
  const nd = (district ?? "").trim().toLowerCase();

  const farmers = MINISTRY_FARMERS.filter((f) => {
    if (!nc) return true;
    return f.county.toLowerCase() === nc;
  }).filter((f) => {
    if (!nd) return true;
    return f.district.toLowerCase().includes(nd);
  });

  const visits: DaoTaskVisit[] = farmers.slice(0, 6).map((f, i) => ({
    id: `visit-${f.registryPublicId}`,
    farmerName: f.fullName,
    registryHint: f.registryPublicId,
    county: f.county,
    district: f.district,
    dueLabel: i < 2 ? "Due today · morning route" : i < 4 ? "Due today · afternoon" : "Scheduled · this week",
    priority: i < 2 ? "high" : "normal",
  }));

  const overdueWeekly = nc.includes("nimba") || nd.includes("fuamah") ? 1 : 0;
  const reports: DaoTaskReport[] = [
    {
      id: "rep-weekly",
      label: "Weekly situational crop sheet",
      district: district ?? county ?? "District",
      overdueCount: overdueWeekly,
    },
    {
      id: "rep-subsidy",
      label: "Subsidy delivery reconciliation",
      district: district ?? county ?? "District",
      overdueCount: 0,
    },
    {
      id: "rep-pest",
      label: "Pest / disease rapid alert (DAO)",
      district: district ?? county ?? "District",
      overdueCount: farmers.length >= 4 ? 1 : 0,
    },
  ];

  return { visits, reports };
}
