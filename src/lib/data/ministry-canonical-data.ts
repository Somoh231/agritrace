/**
 * Canonical ministry-grade pilot dataset aligned with:
 * “Agrivault Ministry Grade Farmer Registry Sample Dataset” (IDs NIM-0001, WH-NIM-001, DAO-NIM-001, EVT-*, INV-*).
 * Single source for CSV exports, seeds, fixtures, analytics hints, and Mapbox layers.
 */

export type MinistryFarmerRecord = {
  registryPublicId: string;
  fullName: string;
  gender: string;
  phone: string;
  county: string;
  district: string;
  cooperative: string;
  cropType: string;
  acreageHa: number;
  gpsLat: number;
  gpsLng: number;
  verification: "Verified" | "Pending";
  daoCode: string;
  subsidyEligible: boolean;
  registrationDate: string;
  primaryWarehouseCode: string;
  subsidyAllocationQty: number;
  lastDistributionDate: string;
};

export type MinistryDaoOfficerRecord = {
  daoCode: string;
  fullName: string;
  county: string;
  district: string;
  reportsSubmitted: number;
  overdueReports: number;
  farmVisits: number;
  lastActivity: string;
  complianceScore: number;
  status: "Active" | "Warning";
};

export type MinistryWarehouseRecord = {
  ministryCode: string;
  name: string;
  county: string;
  capacityMt: number;
  currentStockMt: number;
  utilizationPct: number;
  managerName: string;
  operationalStatus: string;
  donorResupplyFlag: boolean;
  latitude: number;
  longitude: number;
};

export type MinistryInventoryLineRecord = {
  inventoryCode: string;
  sku: string;
  itemName: string;
  warehouseMinistryCode: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  stockStatus: string;
  lastUpdated: string;
};

export type MinistryOperationalEventRecord = {
  eventCode: string;
  occurredAt: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  county: string;
  district: string;
  eventType: string;
  message: string;
  status: "Open" | "Resolved" | "Escalated";
};

export type MinistryCountyMetricRecord = {
  county: string;
  productionIndex: number;
  foodRisk: string;
  daoCompliance: number;
  lng: number;
  lat: number;
};

export type MinistryInventoryMovementRecord = {
  id: string;
  sku: string;
  quantity: number;
  fromWarehouseCode: string;
  toWarehouseCode: string;
  movementType: "transfer" | "distribution" | "receipt";
  reference: string;
  occurredAt: string;
};

/** Farmer registry rows (ministry ID convention). */
export const MINISTRY_FARMERS: MinistryFarmerRecord[] = [
  {
    registryPublicId: "NIM-0001",
    fullName: "Kumba Kollie",
    gender: "Female",
    phone: "+231777120341",
    county: "Nimba",
    district: "Sanniquellie-Mah",
    cooperative: "Nimba Rice Cooperative",
    cropType: "Rice",
    acreageHa: 4.5,
    gpsLat: 7.3621,
    gpsLng: -8.7064,
    verification: "Verified",
    daoCode: "DAO-NIM-001",
    subsidyEligible: true,
    registrationDate: "2026-04-18",
    primaryWarehouseCode: "WH-NIM-001",
    subsidyAllocationQty: 8.2,
    lastDistributionDate: "2026-01-14",
  },
  {
    registryPublicId: "NIM-0002",
    fullName: "Joseph Zleh",
    gender: "Male",
    phone: "+231888450121",
    county: "Nimba",
    district: "Yarmein",
    cooperative: "Nimba Farmers Union",
    cropType: "Rice",
    acreageHa: 7.1,
    gpsLat: 7.5943,
    gpsLng: -8.9231,
    verification: "Verified",
    daoCode: "DAO-NIM-002",
    subsidyEligible: true,
    registrationDate: "2026-04-21",
    primaryWarehouseCode: "WH-NIM-001",
    subsidyAllocationQty: 13.5,
    lastDistributionDate: "2026-01-16",
  },
  {
    registryPublicId: "NIM-0003",
    fullName: "Mary Tokpah",
    gender: "Female",
    phone: "+231776233987",
    county: "Nimba",
    district: "Ganta District",
    cooperative: "Ganta Agro Group",
    cropType: "Cassava",
    acreageHa: 2.8,
    gpsLat: 7.2274,
    gpsLng: -8.9841,
    verification: "Pending",
    daoCode: "DAO-NIM-003",
    subsidyEligible: false,
    registrationDate: "2026-04-10",
    primaryWarehouseCode: "WH-NIM-002",
    subsidyAllocationQty: 3.4,
    lastDistributionDate: "2026-01-20",
  },
  {
    registryPublicId: "NIM-0004",
    fullName: "Emmanuel Kpargoi",
    gender: "Male",
    phone: "+231770984223",
    county: "Nimba",
    district: "Tappita",
    cooperative: "Tappita Rice Cluster",
    cropType: "Rice",
    acreageHa: 5.9,
    gpsLat: 6.9362,
    gpsLng: -8.8723,
    verification: "Verified",
    daoCode: "DAO-NIM-004",
    subsidyEligible: true,
    registrationDate: "2026-04-28",
    primaryWarehouseCode: "WH-NIM-002",
    subsidyAllocationQty: 11.1,
    lastDistributionDate: "2026-02-02",
  },
  {
    registryPublicId: "BON-0001",
    fullName: "Fatmata Kamara",
    gender: "Female",
    phone: "+231777560982",
    county: "Bong",
    district: "Gbarnga",
    cooperative: "Bong Central Cooperative",
    cropType: "Rice",
    acreageHa: 6.4,
    gpsLat: 6.9951,
    gpsLng: -9.4723,
    verification: "Verified",
    daoCode: "DAO-BON-001",
    subsidyEligible: true,
    registrationDate: "2026-04-23",
    primaryWarehouseCode: "WH-BON-001",
    subsidyAllocationQty: 12.6,
    lastDistributionDate: "2026-01-11",
  },
  {
    registryPublicId: "BON-0002",
    fullName: "Abraham Fofana",
    gender: "Male",
    phone: "+231886771122",
    county: "Bong",
    district: "Salala",
    cooperative: "Salala Farmers Association",
    cropType: "Maize",
    acreageHa: 3.2,
    gpsLat: 6.8344,
    gpsLng: -9.6321,
    verification: "Pending",
    daoCode: "DAO-BON-002",
    subsidyEligible: true,
    registrationDate: "2026-04-07",
    primaryWarehouseCode: "WH-BON-001",
    subsidyAllocationQty: 4.9,
    lastDistributionDate: "2026-01-19",
  },
  {
    registryPublicId: "BON-0003",
    fullName: "Rebecca Gaye",
    gender: "Female",
    phone: "+231775234892",
    county: "Bong",
    district: "Zota",
    cooperative: "Zota Rice Network",
    cropType: "Rice",
    acreageHa: 8.7,
    gpsLat: 6.7012,
    gpsLng: -9.7711,
    verification: "Verified",
    daoCode: "DAO-BON-003",
    subsidyEligible: true,
    registrationDate: "2026-04-29",
    primaryWarehouseCode: "WH-BON-002",
    subsidyAllocationQty: 15.8,
    lastDistributionDate: "2026-02-04",
  },
  {
    registryPublicId: "BON-0004",
    fullName: "Morris Mulbah",
    gender: "Male",
    phone: "+231778330129",
    county: "Bong",
    district: "Panta",
    cooperative: "Panta Agro Producers",
    cropType: "Cocoa",
    acreageHa: 5.4,
    gpsLat: 6.9033,
    gpsLng: -9.5219,
    verification: "Verified",
    daoCode: "DAO-BON-004",
    subsidyEligible: false,
    registrationDate: "2026-04-11",
    primaryWarehouseCode: "WH-BON-002",
    subsidyAllocationQty: 6.3,
    lastDistributionDate: "2026-02-12",
  },
  {
    registryPublicId: "LOF-0001",
    fullName: "Hawa Massaquoi",
    gender: "Female",
    phone: "+231777912334",
    county: "Lofa",
    district: "Voinjama",
    cooperative: "Lofa Rice Cooperative",
    cropType: "Rice",
    acreageHa: 9.1,
    gpsLat: 8.4212,
    gpsLng: -9.7512,
    verification: "Verified",
    daoCode: "DAO-LOF-001",
    subsidyEligible: true,
    registrationDate: "2026-04-30",
    primaryWarehouseCode: "WH-LOF-001",
    subsidyAllocationQty: 17.5,
    lastDistributionDate: "2026-01-08",
  },
  {
    registryPublicId: "LOF-0002",
    fullName: "Mohammed Sheriff",
    gender: "Male",
    phone: "+231888345991",
    county: "Lofa",
    district: "Zorzor",
    cooperative: "Zorzor Agro Union",
    cropType: "Rice",
    acreageHa: 4.1,
    gpsLat: 8.2819,
    gpsLng: -9.4211,
    verification: "Verified",
    daoCode: "DAO-LOF-002",
    subsidyEligible: true,
    registrationDate: "2026-04-19",
    primaryWarehouseCode: "WH-LOF-001",
    subsidyAllocationQty: 7.2,
    lastDistributionDate: "2026-01-15",
  },
  {
    registryPublicId: "LOF-0003",
    fullName: "Aminata Koroma",
    gender: "Female",
    phone: "+231775661902",
    county: "Lofa",
    district: "Foya",
    cooperative: "Foya Women Farmers",
    cropType: "Cassava",
    acreageHa: 3.7,
    gpsLat: 8.1123,
    gpsLng: -10.2231,
    verification: "Pending",
    daoCode: "DAO-LOF-003",
    subsidyEligible: false,
    registrationDate: "2026-04-08",
    primaryWarehouseCode: "WH-LOF-002",
    subsidyAllocationQty: 4.1,
    lastDistributionDate: "2026-02-07",
  },
  {
    registryPublicId: "MON-0001",
    fullName: "Prince Cooper",
    gender: "Male",
    phone: "+231777345888",
    county: "Montserrado",
    district: "Careysburg",
    cooperative: "Montserrado Urban Growers",
    cropType: "Vegetables",
    acreageHa: 1.4,
    gpsLat: 6.4532,
    gpsLng: -10.6722,
    verification: "Verified",
    daoCode: "DAO-MON-001",
    subsidyEligible: false,
    registrationDate: "2026-04-24",
    primaryWarehouseCode: "WH-MON-001",
    subsidyAllocationQty: 1.1,
    lastDistributionDate: "2026-01-13",
  },
  {
    registryPublicId: "MON-0002",
    fullName: "Satta Doe",
    gender: "Female",
    phone: "+231888921233",
    county: "Montserrado",
    district: "Todee",
    cooperative: "Todee Farmers Group",
    cropType: "Rice",
    acreageHa: 2.6,
    gpsLat: 6.6321,
    gpsLng: -10.8412,
    verification: "Verified",
    daoCode: "DAO-MON-002",
    subsidyEligible: true,
    registrationDate: "2026-04-26",
    primaryWarehouseCode: "WH-MON-001",
    subsidyAllocationQty: 3.8,
    lastDistributionDate: "2026-02-01",
  },
  {
    registryPublicId: "GBA-0001",
    fullName: "Samuel Peters",
    gender: "Male",
    phone: "+231776512344",
    county: "Grand Bassa",
    district: "Buchanan",
    cooperative: "Bassa Agricultural Network",
    cropType: "Rice",
    acreageHa: 5.7,
    gpsLat: 5.8831,
    gpsLng: -10.0472,
    verification: "Verified",
    daoCode: "DAO-GBA-001",
    subsidyEligible: true,
    registrationDate: "2026-04-22",
    primaryWarehouseCode: "WH-GBA-001",
    subsidyAllocationQty: 9.4,
    lastDistributionDate: "2026-01-18",
  },
  {
    registryPublicId: "MAR-0001",
    fullName: "Victoria Johnson",
    gender: "Female",
    phone: "+231777623410",
    county: "Margibi",
    district: "Kakata",
    cooperative: "Kakata Farmers Cooperative",
    cropType: "Rice",
    acreageHa: 6.9,
    gpsLat: 6.5299,
    gpsLng: -10.3522,
    verification: "Verified",
    daoCode: "DAO-MAR-001",
    subsidyEligible: true,
    registrationDate: "2026-04-27",
    primaryWarehouseCode: "WH-MAR-001",
    subsidyAllocationQty: 12.2,
    lastDistributionDate: "2026-01-22",
  },
  {
    registryPublicId: "BOM-0001",
    fullName: "Thomas Diggs",
    gender: "Male",
    phone: "+231888129944",
    county: "Bomi",
    district: "Tubmanburg",
    cooperative: "Bomi Agro Collective",
    cropType: "Cassava",
    acreageHa: 4.9,
    gpsLat: 6.8712,
    gpsLng: -10.8191,
    verification: "Pending",
    daoCode: "DAO-BOM-001",
    subsidyEligible: true,
    registrationDate: "2026-04-09",
    primaryWarehouseCode: "WH-BOM-001",
    subsidyAllocationQty: 5.1,
    lastDistributionDate: "2026-02-05",
  },
  {
    registryPublicId: "SIN-0001",
    fullName: "Janet Wilson",
    gender: "Female",
    phone: "+231776982134",
    county: "Sinoe",
    district: "Greenville",
    cooperative: "Sinoe Farmers Union",
    cropType: "Rice",
    acreageHa: 7.8,
    gpsLat: 5.0112,
    gpsLng: -9.0388,
    verification: "Verified",
    daoCode: "DAO-SIN-001",
    subsidyEligible: true,
    registrationDate: "2026-04-20",
    primaryWarehouseCode: "WH-SIN-001",
    subsidyAllocationQty: 14.7,
    lastDistributionDate: "2026-01-25",
  },
  {
    registryPublicId: "MDL-0001",
    fullName: "Peter Wreh",
    gender: "Male",
    phone: "+231777000233",
    county: "Maryland",
    district: "Harper",
    cooperative: "Harper Agricultural Society",
    cropType: "Cocoa",
    acreageHa: 10.2,
    gpsLat: 4.3772,
    gpsLng: -7.7162,
    verification: "Verified",
    daoCode: "DAO-MDL-001",
    subsidyEligible: false,
    registrationDate: "2026-04-15",
    primaryWarehouseCode: "WH-MDL-001",
    subsidyAllocationQty: 18.1,
    lastDistributionDate: "2026-02-09",
  },
  {
    registryPublicId: "RIV-0001",
    fullName: "Finda Kamara",
    gender: "Female",
    phone: "+231888456781",
    county: "River Cess",
    district: "Cestos City",
    cooperative: "Rivercess Rice Network",
    cropType: "Rice",
    acreageHa: 5.1,
    gpsLat: 5.9022,
    gpsLng: -9.5811,
    verification: "Verified",
    daoCode: "DAO-RIV-001",
    subsidyEligible: true,
    registrationDate: "2026-04-16",
    primaryWarehouseCode: "WH-RIV-001",
    subsidyAllocationQty: 8.7,
    lastDistributionDate: "2026-01-30",
  },
];

export const MINISTRY_DAO_OFFICERS: MinistryDaoOfficerRecord[] = [
  {
    daoCode: "DAO-NIM-001",
    fullName: "Joseph Yarkpawolo",
    county: "Nimba",
    district: "Sanniquellie-Mah",
    reportsSubmitted: 43,
    overdueReports: 1,
    farmVisits: 78,
    lastActivity: "2026-05-04",
    complianceScore: 94,
    status: "Active",
  },
  {
    daoCode: "DAO-NIM-002",
    fullName: "Martha Kolleh",
    county: "Nimba",
    district: "Yarmein",
    reportsSubmitted: 38,
    overdueReports: 3,
    farmVisits: 64,
    lastActivity: "2026-05-03",
    complianceScore: 87,
    status: "Active",
  },
  {
    daoCode: "DAO-BON-001",
    fullName: "Edward Gaye",
    county: "Bong",
    district: "Gbarnga",
    reportsSubmitted: 51,
    overdueReports: 0,
    farmVisits: 83,
    lastActivity: "2026-05-05",
    complianceScore: 98,
    status: "Active",
  },
  {
    daoCode: "DAO-LOF-001",
    fullName: "Fatou Sesay",
    county: "Lofa",
    district: "Voinjama",
    reportsSubmitted: 45,
    overdueReports: 2,
    farmVisits: 80,
    lastActivity: "2026-05-05",
    complianceScore: 91,
    status: "Active",
  },
  {
    daoCode: "DAO-MON-001",
    fullName: "Samuel Reeves",
    county: "Montserrado",
    district: "Careysburg",
    reportsSubmitted: 29,
    overdueReports: 4,
    farmVisits: 51,
    lastActivity: "2026-05-02",
    complianceScore: 82,
    status: "Warning",
  },
];

export const MINISTRY_WAREHOUSES: MinistryWarehouseRecord[] = [
  {
    ministryCode: "WH-NIM-001",
    name: "Nimba Central Warehouse",
    county: "Nimba",
    capacityMt: 1200,
    currentStockMt: 944,
    utilizationPct: 79,
    managerName: "Samuel Dolo",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 7.384,
    longitude: -8.728,
  },
  {
    ministryCode: "WH-NIM-002",
    name: "Nimba South Inputs Facility",
    county: "Nimba",
    capacityMt: 600,
    currentStockMt: 412,
    utilizationPct: 69,
    managerName: "Patience Tokpah",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 6.98,
    longitude: -8.91,
  },
  {
    ministryCode: "WH-BON-001",
    name: "Bong Agricultural Depot",
    county: "Bong",
    capacityMt: 900,
    currentStockMt: 641,
    utilizationPct: 71,
    managerName: "Martha Kamara",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 7.004,
    longitude: -9.469,
  },
  {
    ministryCode: "WH-BON-002",
    name: "Bong South Cooperative Store",
    county: "Bong",
    capacityMt: 720,
    currentStockMt: 498,
    utilizationPct: 69,
    managerName: "James Sumo",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 6.72,
    longitude: -9.58,
  },
  {
    ministryCode: "WH-LOF-001",
    name: "Lofa Regional Warehouse",
    county: "Lofa",
    capacityMt: 700,
    currentStockMt: 233,
    utilizationPct: 33,
    managerName: "Fatmata Kromah",
    operationalStatus: "Operational",
    donorResupplyFlag: true,
    latitude: 8.422,
    longitude: -9.748,
  },
  {
    ministryCode: "WH-LOF-002",
    name: "Lofa Foya Distribution Point",
    county: "Lofa",
    capacityMt: 400,
    currentStockMt: 285,
    utilizationPct: 71,
    managerName: "Amadu Sesay",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 8.18,
    longitude: -10.08,
  },
  {
    ministryCode: "WH-MON-001",
    name: "Montserrado Input Hub",
    county: "Montserrado",
    capacityMt: 500,
    currentStockMt: 477,
    utilizationPct: 95,
    managerName: "Peter Sonpon",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 6.328,
    longitude: -10.798,
  },
  {
    ministryCode: "WH-GBA-001",
    name: "Grand Bassa Coastal Inputs Depot",
    county: "Grand Bassa",
    capacityMt: 850,
    currentStockMt: 612,
    utilizationPct: 72,
    managerName: "Helena Dennis",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 5.881,
    longitude: -10.046,
  },
  {
    ministryCode: "WH-MAR-001",
    name: "Margibi Kakata Consolidation Hub",
    county: "Margibi",
    capacityMt: 680,
    currentStockMt: 521,
    utilizationPct: 77,
    managerName: "Marcus Zaza",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 6.531,
    longitude: -10.351,
  },
  {
    ministryCode: "WH-BOM-001",
    name: "Bomi Tubmanburg Agricultural Store",
    county: "Bomi",
    capacityMt: 420,
    currentStockMt: 298,
    utilizationPct: 71,
    managerName: "Alfred Wesseh",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 6.868,
    longitude: -10.823,
  },
  {
    ministryCode: "WH-SIN-001",
    name: "Sinoe Greenville Inputs Warehouse",
    county: "Sinoe",
    capacityMt: 640,
    currentStockMt: 473,
    utilizationPct: 74,
    managerName: "Esther Pyne",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 5.009,
    longitude: -9.035,
  },
  {
    ministryCode: "WH-MDL-001",
    name: "Maryland Harper Strategic Reserve",
    county: "Maryland",
    capacityMt: 780,
    currentStockMt: 629,
    utilizationPct: 81,
    managerName: "Francis Chea",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 4.375,
    longitude: -7.718,
  },
  {
    ministryCode: "WH-RIV-001",
    name: "River Cess Cestos Inputs Depot",
    county: "River Cess",
    capacityMt: 520,
    currentStockMt: 361,
    utilizationPct: 69,
    managerName: "Siah Kamara",
    operationalStatus: "Operational",
    donorResupplyFlag: false,
    latitude: 5.898,
    longitude: -9.578,
  },
];

export const MINISTRY_INVENTORY_LINES: MinistryInventoryLineRecord[] = [
  {
    inventoryCode: "INV-0001",
    sku: "RICE-SEED-001",
    itemName: "Improved Rice Seed",
    warehouseMinistryCode: "WH-NIM-001",
    quantity: 4200,
    unit: "bags",
    expiryDate: "2027-01-12",
    stockStatus: "Healthy",
    lastUpdated: "2026-05-05",
  },
  {
    inventoryCode: "INV-0002",
    sku: "FERT-NPK-001",
    itemName: "NPK Fertilizer",
    warehouseMinistryCode: "WH-BON-001",
    quantity: 1900,
    unit: "bags",
    expiryDate: "2026-10-08",
    stockStatus: "Healthy",
    lastUpdated: "2026-05-05",
  },
  {
    inventoryCode: "INV-0003",
    sku: "FERT-UREA-002",
    itemName: "Urea Fertilizer",
    warehouseMinistryCode: "WH-LOF-001",
    quantity: 210,
    unit: "bags",
    expiryDate: "2026-07-18",
    stockStatus: "Low Stock",
    lastUpdated: "2026-05-04",
  },
  {
    inventoryCode: "INV-0004",
    sku: "TOOL-HOE-001",
    itemName: "Agricultural Hoes",
    warehouseMinistryCode: "WH-MON-001",
    quantity: 950,
    unit: "units",
    expiryDate: "2029-01-01",
    stockStatus: "Healthy",
    lastUpdated: "2026-05-05",
  },
];

export const MINISTRY_OPERATIONAL_EVENTS: MinistryOperationalEventRecord[] = [
  {
    eventCode: "EVT-0001",
    occurredAt: "2026-05-05T09:12:00Z",
    severity: "HIGH",
    county: "Nimba",
    district: "Sanniquellie-Mah",
    eventType: "Low Inventory",
    message: "NPK fertilizer below threshold at WH-NIM-001.",
    status: "Open",
  },
  {
    eventCode: "EVT-0002",
    occurredAt: "2026-05-05T10:02:00Z",
    severity: "MEDIUM",
    county: "Bong",
    district: "Gbarnga",
    eventType: "DAO Reporting",
    message: "DAO-BON-001 submitted weekly production report.",
    status: "Resolved",
  },
  {
    eventCode: "EVT-0003",
    occurredAt: "2026-05-05T11:21:00Z",
    severity: "HIGH",
    county: "Lofa",
    district: "Voinjama",
    eventType: "Pest Alert",
    message: "Possible rice pest outbreak reported — DAO verification escalated.",
    status: "Escalated",
  },
  {
    eventCode: "EVT-0004",
    occurredAt: "2026-05-05T12:08:00Z",
    severity: "LOW",
    county: "Montserrado",
    district: "Todee",
    eventType: "Farmer Registration",
    message: "12 new farmers verified in DAO-MON-002 jurisdiction.",
    status: "Resolved",
  },
];

/** County intelligence signal centers (Mapbox point layer + dashboards). */
export const MINISTRY_COUNTY_METRICS: MinistryCountyMetricRecord[] = [
  { county: "Nimba", productionIndex: 82, foodRisk: "Low", daoCompliance: 94, lng: -8.7064, lat: 7.3621 },
  { county: "Bong", productionIndex: 74, foodRisk: "Moderate", daoCompliance: 89, lng: -9.4723, lat: 6.9951 },
  { county: "Lofa", productionIndex: 68, foodRisk: "Elevated", daoCompliance: 91, lng: -9.7512, lat: 8.4212 },
  { county: "Montserrado", productionIndex: 71, foodRisk: "Moderate", daoCompliance: 82, lng: -10.798, lat: 6.328 },
  { county: "Grand Bassa", productionIndex: 63, foodRisk: "Moderate", daoCompliance: 88, lng: -10.0472, lat: 5.8831 },
  { county: "Margibi", productionIndex: 66, foodRisk: "Moderate", daoCompliance: 90, lng: -10.3522, lat: 6.5299 },
  { county: "Bomi", productionIndex: 58, foodRisk: "Moderate", daoCompliance: 76, lng: -10.8191, lat: 6.8712 },
  { county: "Sinoe", productionIndex: 61, foodRisk: "Low", daoCompliance: 85, lng: -9.0388, lat: 5.0112 },
  { county: "Maryland", productionIndex: 59, foodRisk: "Low", daoCompliance: 83, lng: -7.7162, lat: 4.3772 },
  { county: "River Cess", productionIndex: 64, foodRisk: "Low", daoCompliance: 87, lng: -9.5811, lat: 5.9022 },
];

export const MINISTRY_INVENTORY_MOVEMENTS: MinistryInventoryMovementRecord[] = [
  {
    id: "MOV-001",
    sku: "FERT-NPK-001",
    quantity: 120,
    fromWarehouseCode: "WH-NIM-001",
    toWarehouseCode: "WH-BON-001",
    movementType: "transfer",
    reference: "MIN-TFR-2026-051",
    occurredAt: "2026-05-04T07:30:00Z",
  },
  {
    id: "MOV-002",
    sku: "RICE-SEED-001",
    quantity: 80,
    fromWarehouseCode: "WH-BON-001",
    toWarehouseCode: "WH-LOF-001",
    movementType: "transfer",
    reference: "MIN-TFR-2026-052",
    occurredAt: "2026-05-03T14:15:00Z",
  },
  {
    id: "MOV-003",
    sku: "FERT-UREA-002",
    quantity: 45,
    fromWarehouseCode: "WH-MON-001",
    toWarehouseCode: "WH-MAR-001",
    movementType: "distribution",
    reference: "MIN-DIST-2026-019",
    occurredAt: "2026-05-02T09:40:00Z",
  },
  {
    id: "MOV-004",
    sku: "TOOL-HOE-001",
    quantity: 300,
    fromWarehouseCode: "WH-MON-001",
    toWarehouseCode: "WH-SIN-001",
    movementType: "transfer",
    reference: "MIN-TFR-2026-053",
    occurredAt: "2026-05-01T16:05:00Z",
  },
];

export type MinistryCountyIntelligenceGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      county: string;
      production: number;
      food_risk: string;
      dao_compliance: number;
    };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

export function ministryCountyIntelligenceGeoJSON(): MinistryCountyIntelligenceGeoJSON {
  return {
    type: "FeatureCollection",
    features: MINISTRY_COUNTY_METRICS.map((c) => ({
      type: "Feature",
      properties: {
        county: c.county,
        production: c.productionIndex,
        food_risk: c.foodRisk,
        dao_compliance: c.daoCompliance,
      },
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
    })),
  };
}
