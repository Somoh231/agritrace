import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView } from "@/lib/logistics/types";

export type LogisticsAlert = {
  id: string;
  severity: "critical" | "warning" | "watch";
  title: string;
  detail: string;
};

export function buildLogisticsAlerts(params: {
  transfers: TransferOrderView[];
  lowStockSkuApprox?: number;
  expiryWindowApprox?: number;
}): LogisticsAlert[] {
  const alerts: LogisticsAlert[] = [];

  for (const w of MINISTRY_WAREHOUSES) {
    if (w.utilizationPct >= 96) {
      alerts.push({
        id: `cap-${w.ministryCode}`,
        severity: "critical",
        title: `Over-capacity pressure · ${w.ministryCode}`,
        detail: `${w.name} at ${w.utilizationPct}% utilization vs ${w.capacityMt} MT design capacity.`,
      });
    } else if (w.utilizationPct >= 88) {
      alerts.push({
        id: `capw-${w.ministryCode}`,
        severity: "warning",
        title: `Elevated fill rate · ${w.ministryCode}`,
        detail: `${w.name} trending toward corridor limits.`,
      });
    }
    if (w.currentStockMt < w.capacityMt * 0.12 && w.capacityMt > 0) {
      alerts.push({
        id: `low-${w.ministryCode}`,
        severity: "warning",
        title: `Low structural stock · ${w.ministryCode}`,
        detail: `${w.name} physical stock ${w.currentStockMt} MT vs capacity ${w.capacityMt} MT.`,
      });
    }
  }

  const staleRequested = params.transfers.filter((t) => {
    if (t.status !== "requested") return false;
    const age = Date.now() - new Date(t.requestedAt).getTime();
    return age > 48 * 3600 * 1000;
  });
  for (const t of staleRequested) {
    alerts.push({
      id: `late-${t.transferCode}`,
      severity: "warning",
      title: "Transfer approval backlog",
      detail: `${t.transferCode} awaiting approval beyond 48h SLA.`,
    });
  }

  const missingReceipt = params.transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched");
  for (const t of missingReceipt.slice(0, 4)) {
    alerts.push({
      id: `rcv-${t.transferCode}`,
      severity: "watch",
      title: "Shipment confirmation pending",
      detail: `${t.transferCode} (${t.status}) — confirm receiver custody.`,
    });
  }

  if (params.lowStockSkuApprox != null && params.lowStockSkuApprox > 0) {
    alerts.push({
      id: "sku-low",
      severity: "warning",
      title: "SKU lines below operational buffer",
      detail: `${params.lowStockSkuApprox} warehouse_stock rows flagged under buffer threshold.`,
    });
  }

  if (params.expiryWindowApprox != null && params.expiryWindowApprox > 0) {
    alerts.push({
      id: "expiry",
      severity: "critical",
      title: "Expiry watch window",
      detail: `${params.expiryWindowApprox} tracked lots entering 90-day disposition horizon.`,
    });
  }

  return alerts.slice(0, 14);
}
