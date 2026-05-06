/**
 * Illustrative pilot dataset for Liberia ministry demos — not official government statistics.
 * All figures are clearly synthetic for UX demonstration while live Ministry data is configured.
 */

export const PILOT_DATA_LABEL = "Illustrative pilot dataset";

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

export const nationalHeroMetrics = {
  registeredFarmers: 48_620,
  domesticRiceProductionMt: 298_400,
  nationalProductionTargetMt: 340_000,
  inputInventoryCoveragePct: 78,
  countiesReporting: 15,
  countiesActivePilot: 3,
  dataQualityScore: 84,
  postHarvestLossRatePct: 11.2,
  activeFieldOfficers: 142,
  activeCountyAgOfficers: 15,
  callCenterAssistedSubmissions7d: 186,
  offlinePendingSync: 23,
  importDependencyPct: 62,
};

export type CountyProductionRow = {
  county: string;
  productionMt: number;
  targetMt: number;
  lossPct: number;
  status: PilotStatus;
  farmersRegistered: number;
};

export const countyProductionPerformance: CountyProductionRow[] = [
  { county: "Nimba", productionMt: 62_100, targetMt: 68_000, lossPct: 10.1, status: "healthy", farmersRegistered: 11_200 },
  { county: "Bong", productionMt: 44_800, targetMt: 52_000, lossPct: 12.4, status: "warning", farmersRegistered: 8_400 },
  { county: "Lofa", productionMt: 51_200, targetMt: 55_000, lossPct: 9.8, status: "healthy", farmersRegistered: 9_100 },
  { county: "Montserrado", productionMt: 38_400, targetMt: 48_000, lossPct: 13.2, status: "warning", farmersRegistered: 7_800 },
  { county: "Margibi", productionMt: 28_900, targetMt: 34_000, lossPct: 14.5, status: "critical", farmersRegistered: 5_200 },
  { county: "Grand Bassa", productionMt: 22_100, targetMt: 28_000, lossPct: 11.0, status: "warning", farmersRegistered: 4_600 },
  { county: "Maryland", productionMt: 18_600, targetMt: 22_000, lossPct: 10.5, status: "healthy", farmersRegistered: 3_900 },
  { county: "Sinoe", productionMt: 12_400, targetMt: 16_000, lossPct: 15.1, status: "critical", farmersRegistered: 2_700 },
  ...PILOT_COUNTIES_FULL.filter((c) =>
    !["Nimba", "Bong", "Lofa", "Montserrado", "Margibi", "Grand Bassa", "Maryland", "Sinoe"].includes(c),
  ).map((county, i) => ({
    county,
    productionMt: 8_000 + i * 420,
    targetMt: 11_000 + i * 400,
    lossPct: 9 + (i % 5),
    status: (i % 4 === 0 ? "warning" : "healthy") as PilotStatus,
    farmersRegistered: 1200 + i * 80,
  })),
];

export const farmerRegistrationPipeline = {
  verified: 41_200,
  pendingVerification: 4_120,
  flagged: 892,
  geoTaggedPct: 71,
  lastSyncHoursAgo: 2,
};

export const inputDistributionProgress = {
  fertilizerAllocatedMt: 18_400,
  fertilizerDistributedMt: 14_200,
  seedAllocatedMt: 9_800,
  seedDistributedMt: 7_650,
  countiesFullyDistributed: 9,
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
  { id: "wh-001", name: "Central Hub · Ganta", county: "Nimba", riceSeedTons: 420, fertilizerTons: 310, pesticideTons: 42, stockRisk: "healthy", donorTaggedPct: 55 },
  { id: "wh-002", name: "County Store · Gbarnga", county: "Bong", riceSeedTons: 280, fertilizerTons: 240, pesticideTons: 28, stockRisk: "warning", donorTaggedPct: 40 },
  { id: "wh-003", name: "Voinjama Depot", county: "Lofa", riceSeedTons: 315, fertilizerTons: 265, pesticideTons: 31, stockRisk: "healthy", donorTaggedPct: 62 },
  { id: "wh-004", name: "Monrovia Strategic Reserve", county: "Montserrado", riceSeedTons: 890, fertilizerTons: 720, pesticideTons: 88, stockRisk: "warning", donorTaggedPct: 35 },
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
  { id: "tr-1", from: "Monrovia Strategic Reserve", to: "Gbarnga · Bong", commodity: "Urea", qtyTons: 45, status: "in_transit", date: "2026-05-04" },
  { id: "tr-2", from: "Ganta Hub", to: "District 3 · Nimba", commodity: "NERICA seed", qtyTons: 12, status: "completed", date: "2026-05-03" },
  { id: "tr-3", from: "Voinjama Depot", to: "Kolahun · Lofa", commodity: "NPK", qtyTons: 18, status: "scheduled", date: "2026-05-06" },
];

export type FarmerRegistryDemoRow = {
  id: string;
  fullName: string;
  county: string;
  district: string;
  cooperative: string;
  gpsStatus: "verified" | "pending" | "none";
  acreage: number;
  mainCrop: string;
  productionHistorySeasons: number;
  subsidyEligible: boolean;
  verification: "verified" | "pending" | "flagged";
  lastFieldVisit: string;
};

export const farmerRegistrySample: FarmerRegistryDemoRow[] = [
  { id: "F-10492", fullName: "James W. Toe", county: "Nimba", district: "Sanniquellie-Mahn", cooperative: "Nimba Highlands Cooperative", gpsStatus: "verified", acreage: 3.2, mainCrop: "Rice", productionHistorySeasons: 4, subsidyEligible: true, verification: "verified", lastFieldVisit: "2026-05-01" },
  { id: "F-21883", fullName: "Mary Suah", county: "Bong", district: "Fuamah", cooperative: "Bong Central Farmers Union", gpsStatus: "pending", acreage: 2.1, mainCrop: "Rice", productionHistorySeasons: 2, subsidyEligible: true, verification: "pending", lastFieldVisit: "2026-04-28" },
  { id: "F-33021", fullName: "Mohammed Kamara", county: "Lofa", district: "Voinjama", cooperative: "Lofa Rice Alliance", gpsStatus: "verified", acreage: 4.8, mainCrop: "Rice", productionHistorySeasons: 6, subsidyEligible: false, verification: "verified", lastFieldVisit: "2026-05-02" },
  { id: "F-44102", fullName: "Patience Doe", county: "Margibi", district: "Kakata", cooperative: "Margibi Growers", gpsStatus: "none", acreage: 1.4, mainCrop: "Rice", productionHistorySeasons: 1, subsidyEligible: true, verification: "flagged", lastFieldVisit: "2026-04-15" },
  { id: "F-55291", fullName: "Emmanuel Weah", county: "Montserrado", district: "Careysburg", cooperative: "Urban Edge Cooperative", gpsStatus: "verified", acreage: 0.9, mainCrop: "Rice", productionHistorySeasons: 3, subsidyEligible: true, verification: "verified", lastFieldVisit: "2026-05-05" },
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
  { id: "R-9081", officer: "S. Kollie", county: "Nimba", summary: "Moisture readings elevated · drying advisory issued", channel: "offline", submittedAt: "2026-05-06T08:40:00Z" },
  { id: "R-9082", officer: "A. Sumo", county: "Bong", summary: "Input voucher redemption verified · 42 farmers", channel: "online", submittedAt: "2026-05-06T07:15:00Z" },
  { id: "R-9078", officer: "Call desk · ext 204", county: "Lofa", summary: "Voice-assisted registration completed · 3 parcels", channel: "call_center", submittedAt: "2026-05-05T16:22:00Z" },
];

export type OfflineQueueItem = {
  id: string;
  deviceId: string;
  records: number;
  oldestAgeMinutes: number;
  county: string;
};

export const offlineSyncQueue: OfflineQueueItem[] = [
  { id: "q-1", deviceId: "TAB-NIM-042", records: 8, oldestAgeMinutes: 35, county: "Nimba" },
  { id: "q-2", deviceId: "TAB-BONG-019", records: 5, oldestAgeMinutes: 120, county: "Bong" },
  { id: "q-3", deviceId: "TAB-LOF-007", records: 10, oldestAgeMinutes: 18, county: "Lofa" },
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
  { id: "cc-1", topic: "Subsidy eligibility clarification", county: "Nimba", agent: "J. Flomo", resolved: true, time: "2026-05-06 09:12" },
  { id: "cc-2", topic: "Duplicate farmer merge request", county: "Bong", agent: "R. Johnson", resolved: false, time: "2026-05-06 08:55" },
  { id: "cc-3", topic: "Warehouse stock discrepancy", county: "Montserrado", agent: "P. Mensah", resolved: false, time: "2026-05-05 17:40" },
];

export type DataQualityAlertDemo = {
  id: string;
  severity: PilotStatus;
  title: string;
  county?: string;
};

export const dataQualityAlerts: DataQualityAlertDemo[] = [
  { id: "dq-1", severity: "warning", title: "12% of farmer GPS reads older than 180 days", county: "Margibi" },
  { id: "dq-2", severity: "critical", title: "County submission gap · no sync in 36h", county: "Grand Gedeh" },
  { id: "dq-3", severity: "healthy", title: "Pilot counties meeting completeness SLA" },
];

export type LossAlertDemo = {
  id: string;
  county: string;
  lossPct: number;
  driver: string;
};

export const postHarvestLossAlerts: LossAlertDemo[] = [
  { id: "ph-1", county: "Margibi", lossPct: 14.5, driver: "Moisture / storage" },
  { id: "ph-2", county: "Sinoe", lossPct: 15.1, driver: "Transport delay" },
];

export type SubsidyRecordDemo = {
  id: string;
  county: string;
  farmersPaid: number;
  amountUsd: number;
  period: string;
};

export const subsidyDistributionRecords: SubsidyRecordDemo[] = [
  { id: "sub-1", county: "Nimba", farmersPaid: 820, amountUsd: 164_000, period: "Apr 2026 · tranche 2" },
  { id: "sub-2", county: "Bong", farmersPaid: 540, amountUsd: 108_000, period: "Apr 2026 · tranche 2" },
  { id: "sub-3", county: "Lofa", farmersPaid: 610, amountUsd: 122_000, period: "Apr 2026 · tranche 2" },
];

export type DonorInventoryDemo = {
  donor: string;
  sku: string;
  tons: string;
  warehouse: string;
};

export const donorInventoryRecords: DonorInventoryDemo[] = [
  { donor: "Illustrative donor · Programme A", sku: "NERICA seed", tons: "640 t", warehouse: "Monrovia Strategic Reserve" },
  { donor: "Illustrative donor · Programme B", sku: "Urea", tons: "420 t", warehouse: "Ganta Hub" },
];

export const foodSecurityIndicators = {
  riceDemandMt: 650_000,
  domesticProductionMt: nationalHeroMetrics.domesticRiceProductionMt,
  importDependencyTrend: "+1.2 ppt vs prior quarter (illustrative)",
  emergencyAlerts: 2,
  marketPriceWatch: "Stable · illustrative pilot band",
  nationalRiskScore: 62,
  countyForecastNote: "Pilot counties projected within ±6% of seasonal norm (illustrative)",
};

export type OfficerDemo = { id: string; name: string; county: string; activeSubmissions7d: number };

export const fieldOfficers: OfficerDemo[] = [
  { id: "fo-1", name: "Samuel Kollie", county: "Nimba", activeSubmissions7d: 38 },
  { id: "fo-2", name: "Alice Sumo", county: "Bong", activeSubmissions7d: 31 },
  { id: "fo-3", name: "Joseph Cooper", county: "Lofa", activeSubmissions7d: 29 },
];

export const countyAgOfficers: OfficerDemo[] = PILOT_COUNTIES_FULL.slice(0, 15).map((county, i) => ({
  id: `cao-${i}`,
  name: `County Ag Officer · ${county}`,
  county,
  activeSubmissions7d: 12 + (i % 8),
}));

export const districtAgOfficersSample: OfficerDemo[] = [
  { id: "dao-1", name: "DAO · Sanniquellie-Mahn", county: "Nimba", activeSubmissions7d: 14 },
  { id: "dao-2", name: "DAO · Fuamah", county: "Bong", activeSubmissions7d: 11 },
];

export type ConnectivityRiskRow = { county: string; riskScore: number; note: string };

export const connectivityRiskByCounty: ConnectivityRiskRow[] = [
  { county: "Grand Gedeh", riskScore: 78, note: "Sparse coverage · offline-first advised" },
  { county: "River Gee", riskScore: 71, note: "SMS backup channel active" },
  { county: "Nimba", riskScore: 42, note: "Mixed coverage · pilot hardened" },
];

export const countyOperationsCards = [
  { county: "Nimba", pendingVerification: 212, inputProgressPct: 82, fieldReports7d: 156, diseaseAlerts: 1, warehouseRequests: 2, dqIssues: 3 },
  { county: "Bong", pendingVerification: 318, inputProgressPct: 71, fieldReports7d: 122, diseaseAlerts: 0, warehouseRequests: 4, dqIssues: 5 },
  { county: "Lofa", pendingVerification: 164, inputProgressPct: 88, fieldReports7d: 134, diseaseAlerts: 2, warehouseRequests: 1, dqIssues: 2 },
];

export const governanceFraming = {
  headline: "Ministry-owned data infrastructure",
  bullets: [
    "Sovereign agricultural database under national governance",
    "Role-based access and audit-ready reporting",
    "County-to-national coordination with phased portability",
    "Designed for transition to government-controlled infrastructure",
  ],
};
