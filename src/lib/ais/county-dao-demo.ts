/** Synthetic DAO oversight metrics for CAO workspace until dedicated `district_officer_performance` table is wired. */
export type DaoOversightRow = Record<string, unknown> & {
  id: string;
  daoName: string;
  district: string;
  reportsSubmitted: number;
  overdueReports: number;
  farmVisits: number;
  verificationRate: number;
  lastActivity: string;
  riskScore: number;
};

export const COUNTY_DAO_DEMO: DaoOversightRow[] = [
  {
    id: "dao-1",
    daoName: "James Tokpah",
    district: "Fuamah",
    reportsSubmitted: 14,
    overdueReports: 1,
    farmVisits: 38,
    verificationRate: 92,
    lastActivity: "2026-05-06 09:14",
    riskScore: 28,
  },
  {
    id: "dao-2",
    daoName: "Miatta Sheriff",
    district: "Salala",
    reportsSubmitted: 11,
    overdueReports: 0,
    farmVisits: 44,
    verificationRate: 96,
    lastActivity: "2026-05-06 08:02",
    riskScore: 18,
  },
  {
    id: "dao-3",
    daoName: "Victor Kollie",
    district: "Jorquelleh",
    reportsSubmitted: 9,
    overdueReports: 3,
    farmVisits: 27,
    verificationRate: 71,
    lastActivity: "2026-05-05 16:40",
    riskScore: 61,
  },
  {
    id: "dao-4",
    daoName: "Lucy Nyema",
    district: "Sanoyea",
    reportsSubmitted: 16,
    overdueReports: 0,
    farmVisits: 52,
    verificationRate: 94,
    lastActivity: "2026-05-06 10:22",
    riskScore: 22,
  },
];
