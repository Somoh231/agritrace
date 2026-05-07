import {
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

export type WarehouseOperationalBrief = {
  headline: string;
  stockPressure: string;
  donorOverview: string;
  countyAllocation: string;
  utilizationCommentary: string;
  lowStockReasoning: string;
  expiryRisk: string;
  movementSummary: string[];
};

function districtsDrawing(code: string): string[] {
  const d = [...new Set(MINISTRY_FARMERS.filter((f) => f.primaryWarehouseCode === code).map((f) => f.district))];
  return d.slice(0, 4);
}

export function buildWarehouseOperationalBrief(code: string): WarehouseOperationalBrief | null {
  const w = MINISTRY_WAREHOUSES.find((x) => x.ministryCode === code);
  if (!w) return null;

  const lines = MINISTRY_INVENTORY_LINES.filter((l) => l.warehouseMinistryCode === code);
  const lowLines = lines.filter((l) => l.stockStatus.toLowerCase().includes("low"));
  const nearExpiry = lines.filter((l) => {
    const t = new Date(l.expiryDate).getTime();
    if (!Number.isFinite(t)) return false;
    const days = (t - Date.now()) / 86400000;
    return days >= 0 && days <= 120;
  });

  const districts = districtsDrawing(code);
  const districtPhrase =
    districts.length >= 2 ? `${districts.slice(0, -1).join(", ")} and ${districts[districts.length - 1]} districts` : districts[0] ?? "linked districts";

  const subsidyFarmers = MINISTRY_FARMERS.filter((f) => f.primaryWarehouseCode === code && f.subsidyEligible);
  const fertDraw =
    lines.some((l) => l.sku.includes("FERT")) && subsidyFarmers.length >= 2
      ? "elevated fertilizer drawdown linked to increased DAO subsidy activity"
      : "steady inputs drawdown aligned with seasonal issuance";

  const headline = `${code} is operating at ${w.utilizationPct}% utilization with ${fertDraw} in ${districtPhrase}.`;

  const pressure =
    w.utilizationPct >= 88
      ? "Capacity pressure HIGH — inbound receipts and outbound pacing require daily reconcile."
      : w.utilizationPct >= 72
        ? "Capacity pressure MODERATE — monitor corridor closures and donor inbound timing."
        : "Capacity pressure CONTROLLED — runway adequate if transfers remain verified.";

  const donorOverview = w.donorResupplyFlag
    ? "Donor corridor ACTIVE — manifest verification queue should precede posting to live custody."
    : "Donor corridor nominal — standard ministry receipts only.";

  const countyAllocation = `${w.county} redistribution posture ties ${subsidyFarmers.length} subsidy-eligible beneficiary records to this hub primary custody.`;

  const utilizationCommentary =
    w.utilizationPct >= 92
      ? "Utilization above comfort threshold — defer non-critical inbound until offload verified."
      : w.utilizationPct >= 80
        ? "Utilization trending warm — emphasize verified transfers before new donor postings."
        : "Utilization within ministry operating band — maintain verification cadence.";

  const lowStockReasoning =
    lowLines.length > 0
      ? `Low-stock SKUs (${lowLines.length} lines) correlate with ${lowLines.some((l) => l.sku.includes("FERT")) ? "fertilizer-heavy " : ""}distribution pulls and incomplete inbound TRF closures.`
      : "No canonical low-stock flags on pilot ledger lines — continue SKU-level monitoring from live warehouse_stock.";

  const expiryRisk =
    nearExpiry.length > 0
      ? `${nearExpiry.length} SKU batches carry expiry windows ≤120d — prioritize FIFO issuance and donor QA coordination.`
      : "No acute expiry concentration in canonical pilot window.";

  const moves = MINISTRY_INVENTORY_MOVEMENTS.filter((m) => m.fromWarehouseCode === code || m.toWarehouseCode === code)
    .slice(-5)
    .map((m) => `${m.occurredAt.slice(0, 10)} · ${m.reference} · ${m.sku} (${m.quantity}) ${m.fromWarehouseCode}→${m.toWarehouseCode}`);

  return {
    headline,
    stockPressure: pressure,
    donorOverview,
    countyAllocation,
    utilizationCommentary,
    lowStockReasoning,
    expiryRisk,
    movementSummary: moves.length ? moves : ["No recent canonical movements logged for this ministry code."],
  };
}
