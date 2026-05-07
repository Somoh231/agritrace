import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView } from "@/lib/logistics/types";

export function downloadLogisticsCsv(filename: string, headers: string[], rows: string[][]) {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const body = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportWarehouseUtilization(): void {
  const headers = ["ministry_code", "name", "county", "capacity_mt", "current_stock_mt", "utilization_pct", "donor_resupply"];
  const rows = MINISTRY_WAREHOUSES.map((w) => [
    w.ministryCode,
    w.name,
    w.county,
    String(w.capacityMt),
    String(w.currentStockMt),
    String(w.utilizationPct),
    w.donorResupplyFlag ? "yes" : "no",
  ]);
  downloadLogisticsCsv("warehouse-utilization-export.csv", headers, rows);
}

export function exportMinistryAllocationReport(transfers: TransferOrderView[]): void {
  const headers = ["transfer_code", "from", "to", "sku", "qty", "status", "requested_at"];
  const rows = transfers.map((t) => [
    t.transferCode,
    t.fromMinistryCode,
    t.toMinistryCode,
    t.sku,
    String(t.quantity),
    t.status,
    t.requestedAt,
  ]);
  downloadLogisticsCsv("ministry-allocation-transfers.csv", headers, rows);
}

export function exportDonorShipmentTracker(rows: Array<{ donor: string; sku: string; qty: string; warehouse: string; received: string }>): void {
  downloadLogisticsCsv(
    "donor-shipment-tracker.csv",
    ["donor", "sku", "quantity", "warehouse", "received_at"],
    rows.map((r) => [r.donor, r.sku, r.qty, r.warehouse, r.received]),
  );
}

export function buildStockoutForecastText(transfers: TransferOrderView[]): string {
  const inFlight = transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched").length;
  const lines = [
    "Agrivault AIS · stockout risk heuristic (demo)",
    `Active corridor movements: ${inFlight}`,
    "Forecast assumes donor programmes maintain 14-day cover at coded hubs.",
    "Escalate when utilization > 92% AND in-transit confirmations lag > 72h.",
    "",
    ...MINISTRY_WAREHOUSES.filter((w) => w.utilizationPct >= 85).map(
      (w) => ` · ${w.ministryCode}: ${w.utilizationPct}% util · stock ${w.currentStockMt}/${w.capacityMt} MT`,
    ),
  ];
  return lines.join("\n");
}
