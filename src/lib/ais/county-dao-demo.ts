/** DAO oversight metrics for CAO workspace — merged from `pilot_dao_officers` or ministry canonical fallback. */

export type DaoSyncStatus = "synced" | "pending" | "at_risk";

export type DaoRiskStatus = "low" | "medium" | "high";

export type DaoOversightRow = Record<string, unknown> & {
  id: string;
  daoId: string;
  daoName: string;
  district: string;
  assignedFarmers: number;
  reportsSubmitted: number;
  overdueReports: number;
  farmVisits: number;
  subsidyVerifications: number;
  /** Legacy aggregate compliance / verification index from pilot feed */
  verificationRate: number;
  gpsVerificationRate: number;
  syncStatus: DaoSyncStatus;
  lastActivity: string;
  riskScore: number;
  riskStatus: DaoRiskStatus;
};
