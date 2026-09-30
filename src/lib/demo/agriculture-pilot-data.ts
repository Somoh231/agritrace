/**
 * Illustrative preview dataset — synthetic, NOT programme results or government statistics.
 *
 * Rules (Ministry preview readiness, 2026-09-29):
 *   - pilot counties only (Nimba, Bong, Lofa); nothing implies national coverage;
 *   - modest, round, obviously illustrative figures;
 *   - no personal names, phone numbers or real facility names ("Sample …");
 *   - identifiers use a SMP- prefix that cannot collide with production records;
 *   - no institutional claims (no "verified by", no ownership statements beyond R-19).
 * Every platform page that can show these values carries PREVIEW_DATA_LABEL
 * (src/lib/utils/pilot-config.ts).
 */

export const PILOT_DATA_LABEL = "Illustrative preview data";

/** Liberia's fifteen counties — geography reference only, never used for figures. */
export const PILOT_COUNTIES_FULL = [
  "Bomi",
  "Bong",
  "Gbarpolu",
  "Grand Bassa",
  "Grand Cape Mount",
  "Grand Gedeh",
  "Grand Kru",
  "Lofa",
  "Margibi",
  "Maryland",
  "Montserrado",
  "Nimba",
  "River Cess",
  "River Gee",
  "Sinoe",
] as const;

export const PILOT_COUNTIES_ACTIVE = ["Nimba", "Bong", "Lofa"] as const;

export type PilotStatus = "healthy" | "warning" | "critical";

export type CountyProductionRow = {
  county: string;
  productionMt: number;
  targetMt: number;
  lossPct: number;
  status: PilotStatus;
  farmersRegistered: number;
};

/** Pilot counties only. Synthetic. */
export const countyProductionPerformance: CountyProductionRow[] = [
  { county: "Nimba", productionMt: 4_200, targetMt: 4_800, lossPct: 10, status: "healthy", farmersRegistered: 1_200 },
  { county: "Bong", productionMt: 3_100, targetMt: 3_600, lossPct: 12, status: "warning", farmersRegistered: 900 },
  { county: "Lofa", productionMt: 3_600, targetMt: 4_000, lossPct: 9, status: "healthy", farmersRegistered: 1_000 },
];

const sum = (k: "productionMt" | "targetMt" | "farmersRegistered") => countyProductionPerformance.reduce((s, r) => s + r[k], 0);

/** Key names are historical; every value is a pilot-county synthetic total. */
export const nationalHeroMetrics = {
  registeredFarmers: sum("farmersRegistered"),
  domesticRiceProductionMt: sum("productionMt"),
  nationalProductionTargetMt: sum("targetMt"),
  inputInventoryCoveragePct: 75,
  countiesReporting: PILOT_COUNTIES_ACTIVE.length,
  countiesActivePilot: PILOT_COUNTIES_ACTIVE.length,
  dataQualityScore: 80,
  postHarvestLossRatePct: 10,
  activeFieldOfficers: 24,
  activeCountyAgOfficers: PILOT_COUNTIES_ACTIVE.length,
  callCenterAssistedSubmissions7d: 18,
  offlinePendingSync: 6,
  /** Retained for type compatibility; not shown as a national statistic. */
  importDependencyPct: 0,
};

export const farmerRegistrationPipeline = {
  verified: 2_600,
  pendingVerification: 400,
  flagged: 100,
  geoTaggedPct: 70,
  lastSyncHoursAgo: 2,
};

export const inputDistributionProgress = {
  fertilizerAllocatedMt: 600,
  fertilizerDistributedMt: 450,
  seedAllocatedMt: 300,
  seedDistributedMt: 240,
  countiesFullyDistributed: 1,
};

export type WarehouseRow = {
  id: string;
  name: string;
  county: string;
  riceSeedTons: number;
  fertilizerTons: number;
  pesticideTons: number;
  stockRisk: PilotStatus;
  donorTaggedPct: number;
};

export const warehouses: WarehouseRow[] = [
  { id: "SMP-WH-A", name: "Sample warehouse A · Nimba", county: "Nimba", riceSeedTons: 40, fertilizerTons: 30, pesticideTons: 4, stockRisk: "healthy", donorTaggedPct: 0 },
  { id: "SMP-WH-B", name: "Sample warehouse B · Bong", county: "Bong", riceSeedTons: 28, fertilizerTons: 24, pesticideTons: 3, stockRisk: "warning", donorTaggedPct: 0 },
  { id: "SMP-WH-C", name: "Sample warehouse C · Lofa", county: "Lofa", riceSeedTons: 32, fertilizerTons: 26, pesticideTons: 3, stockRisk: "healthy", donorTaggedPct: 0 },
];

export type InventoryTransfer = {
  id: string;
  from: string;
  to: string;
  commodity: string;
  qtyTons: number;
  status: "completed" | "in_transit" | "scheduled";
  date: string;
};

export const inventoryTransfers: InventoryTransfer[] = [
  { id: "SMP-TR-1", from: "Sample warehouse A · Nimba", to: "Sample warehouse B · Bong", commodity: "Urea", qtyTons: 5, status: "in_transit", date: "2026-05-04" },
  { id: "SMP-TR-2", from: "Sample warehouse A · Nimba", to: "District A · Nimba", commodity: "Rice seed", qtyTons: 2, status: "completed", date: "2026-05-03" },
  { id: "SMP-TR-3", from: "Sample warehouse C · Lofa", to: "District B · Lofa", commodity: "NPK", qtyTons: 3, status: "scheduled", date: "2026-05-06" },
];

export type FarmerRegistryDemoRow = {
  id: string;
  fullName: string;
  county: string;
  district: string;
  cooperative: string;
  /** Registry id when synced from preview seed */
  registryPublicId?: string;
  daoOfficerCode?: string;
  primaryWarehouseCode?: string;
  gpsStatus: "verified" | "pending" | "none";
  acreage: number;
  mainCrop: string;
  productionHistorySeasons: number;
  subsidyEligible: boolean;
  verification: "verified" | "pending" | "flagged";
  lastFieldVisit: string;
};

export const farmerRegistrySample: FarmerRegistryDemoRow[] = [
  { id: "SMP-F-001", fullName: "Sample farmer 01", county: "Nimba", district: "District A", cooperative: "Sample cooperative A", gpsStatus: "verified", acreage: 3, mainCrop: "Rice", productionHistorySeasons: 2, subsidyEligible: true, verification: "verified", lastFieldVisit: "2026-05-01" },
  { id: "SMP-F-002", fullName: "Sample farmer 02", county: "Bong", district: "District B", cooperative: "Sample cooperative B", gpsStatus: "pending", acreage: 2, mainCrop: "Rice", productionHistorySeasons: 1, subsidyEligible: true, verification: "pending", lastFieldVisit: "2026-04-28" },
  { id: "SMP-F-003", fullName: "Sample farmer 03", county: "Lofa", district: "District C", cooperative: "Sample cooperative C", gpsStatus: "verified", acreage: 4, mainCrop: "Rice", productionHistorySeasons: 2, subsidyEligible: false, verification: "verified", lastFieldVisit: "2026-05-02" },
  { id: "SMP-F-004", fullName: "Sample farmer 04", county: "Nimba", district: "District A", cooperative: "Sample cooperative A", gpsStatus: "none", acreage: 1, mainCrop: "Rice", productionHistorySeasons: 1, subsidyEligible: true, verification: "flagged", lastFieldVisit: "2026-04-15" },
  { id: "SMP-F-005", fullName: "Sample farmer 05", county: "Bong", district: "District B", cooperative: "Sample cooperative B", gpsStatus: "verified", acreage: 1, mainCrop: "Rice", productionHistorySeasons: 1, subsidyEligible: true, verification: "verified", lastFieldVisit: "2026-05-05" },
];

export type FieldReportDemo = {
  id: string;
  officer: string;
  county: string;
  summary: string;
  channel: "offline" | "online" | "call_center";
  submittedAt: string;
};

export const fieldReports: FieldReportDemo[] = [
  { id: "SMP-R-01", officer: "Sample field officer 01", county: "Nimba", summary: "Moisture readings elevated · drying advisory issued", channel: "offline", submittedAt: "2026-05-06T08:40:00Z" },
  { id: "SMP-R-02", officer: "Sample field officer 02", county: "Bong", summary: "Input voucher redemption checked", channel: "online", submittedAt: "2026-05-06T07:15:00Z" },
  { id: "SMP-R-03", officer: "Sample call desk", county: "Lofa", summary: "Voice-assisted registration completed", channel: "call_center", submittedAt: "2026-05-05T16:22:00Z" },
];

export type OfflineQueueItem = {
  id: string;
  deviceId: string;
  records: number;
  oldestAgeMinutes: number;
  county: string;
};

export const offlineSyncQueue: OfflineQueueItem[] = [
  { id: "q-1", deviceId: "SMP-DEVICE-01", records: 3, oldestAgeMinutes: 35, county: "Nimba" },
  { id: "q-2", deviceId: "SMP-DEVICE-02", records: 2, oldestAgeMinutes: 120, county: "Bong" },
  { id: "q-3", deviceId: "SMP-DEVICE-03", records: 1, oldestAgeMinutes: 18, county: "Lofa" },
];

export type CallCenterSubmission = {
  id: string;
  topic: string;
  county: string;
  agent: string;
  resolved: boolean;
  time: string;
};

export const callCenterSubmissions: CallCenterSubmission[] = [
  { id: "cc-1", topic: "Eligibility clarification", county: "Nimba", agent: "Sample agent 01", resolved: true, time: "2026-05-06 09:12" },
  { id: "cc-2", topic: "Duplicate farmer merge request", county: "Bong", agent: "Sample agent 02", resolved: false, time: "2026-05-06 08:55" },
  { id: "cc-3", topic: "Warehouse stock discrepancy", county: "Lofa", agent: "Sample agent 03", resolved: false, time: "2026-05-05 17:40" },
];

export type DataQualityAlertDemo = {
  id: string;
  severity: PilotStatus;
  title: string;
  county?: string;
};

export const dataQualityAlerts: DataQualityAlertDemo[] = [
  { id: "dq-1", severity: "warning", title: "Some farmer GPS reads older than 180 days", county: "Bong" },
  { id: "dq-2", severity: "critical", title: "District submission gap · no sync in 36h", county: "Lofa" },
  { id: "dq-3", severity: "healthy", title: "Nimba meeting the agreed completeness check" },
];

export type LossAlertDemo = {
  id: string;
  county: string;
  lossPct: number;
  driver: string;
};

export const postHarvestLossAlerts: LossAlertDemo[] = [
  { id: "ph-1", county: "Bong", lossPct: 12, driver: "Moisture / storage" },
];

export type SubsidyRecordDemo = {
  id: string;
  county: string;
  farmersPaid: number;
  amountUsd: number;
  period: string;
};

export const subsidyDistributionRecords: SubsidyRecordDemo[] = [
  { id: "sub-1", county: "Nimba", farmersPaid: 80, amountUsd: 8_000, period: "Sample period · tranche 1" },
  { id: "sub-2", county: "Bong", farmersPaid: 60, amountUsd: 6_000, period: "Sample period · tranche 1" },
  { id: "sub-3", county: "Lofa", farmersPaid: 70, amountUsd: 7_000, period: "Sample period · tranche 1" },
];

export type DonorInventoryDemo = {
  donor: string;
  sku: string;
  tons: string;
  warehouse: string;
};

export const donorInventoryRecords: DonorInventoryDemo[] = [
  { donor: "Sample programme stock A", sku: "Rice seed", tons: "20 t", warehouse: "Sample warehouse A · Nimba" },
  { donor: "Sample programme stock B", sku: "Urea", tons: "12 t", warehouse: "Sample warehouse C · Lofa" },
];

export const foodSecurityIndicators = {
  /** Pilot-scope synthetic demand, not a national figure. */
  riceDemandMt: 14_000,
  domesticProductionMt: nationalHeroMetrics.domesticRiceProductionMt,
  importDependencyTrend: "Not assessed in the pilot preview",
  emergencyAlerts: 1,
  marketPriceWatch: "Illustrative band",
  nationalRiskScore: 50,
  countyForecastNote: "Pilot counties only · illustrative",
};

export type OfficerDemo = { id: string; name: string; county: string; activeSubmissions7d: number };

export const fieldOfficers: OfficerDemo[] = [
  { id: "fo-1", name: "Sample field officer 01", county: "Nimba", activeSubmissions7d: 12 },
  { id: "fo-2", name: "Sample field officer 02", county: "Bong", activeSubmissions7d: 9 },
  { id: "fo-3", name: "Sample field officer 03", county: "Lofa", activeSubmissions7d: 10 },
];

export const countyAgOfficers: OfficerDemo[] = PILOT_COUNTIES_ACTIVE.map((county, i) => ({
  id: `cac-${i}`,
  name: `Sample county officer · ${county}`,
  county,
  activeSubmissions7d: 6 + i,
}));

export const districtAgOfficersSample: OfficerDemo[] = [
  { id: "dao-1", name: "Sample DAO · District A", county: "Nimba", activeSubmissions7d: 5 },
  { id: "dao-2", name: "Sample DAO · District B", county: "Bong", activeSubmissions7d: 4 },
];

export type ConnectivityRiskRow = { county: string; riskScore: number; note: string };

export const connectivityRiskByCounty: ConnectivityRiskRow[] = [
  { county: "Lofa", riskScore: 70, note: "Sparse coverage · offline capture advised" },
  { county: "Bong", riskScore: 55, note: "Mixed coverage" },
  { county: "Nimba", riskScore: 42, note: "Mixed coverage" },
];

export const countyOperationsCards = [
  { county: "Nimba", pendingVerification: 20, inputProgressPct: 80, fieldReports7d: 15, diseaseAlerts: 1, warehouseRequests: 2, dqIssues: 3 },
  { county: "Bong", pendingVerification: 30, inputProgressPct: 70, fieldReports7d: 12, diseaseAlerts: 0, warehouseRequests: 1, dqIssues: 4 },
  { county: "Lofa", pendingVerification: 15, inputProgressPct: 85, fieldReports7d: 13, diseaseAlerts: 1, warehouseRequests: 1, dqIssues: 2 },
];

/** Consistent with the owner-approved data-ownership language (R-19). */
export const governanceFraming = {
  headline: "Institution-owned programme data",
  bullets: [
    "Institutions retain ownership and control of the operational data generated through their programmes",
    "Role-based access and a recorded decision history",
    "County-to-national coordination, introduced in phases",
    "AgriVault provides the technology and operating support; capability transfer is planned",
  ],
};
