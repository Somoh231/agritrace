import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";

function whName(code: string): string {
  return MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code)?.name ?? code;
}

const demo: Array<{
  transferCode: string;
  fromWarehouseCode: string;
  toWarehouseCode: string;
  sku: string;
  quantity: number;
  status: TransferWorkflowStatus;
  requestedAt: string;
  operatorLabel?: string;
}> = [
  {
    transferCode: "TRF-NIM-BON-0001",
    fromWarehouseCode: "WH-NIM-001",
    toWarehouseCode: "WH-BON-001",
    sku: "FERT-NPK-001",
    quantity: 120,
    status: "in_transit",
    requestedAt: "2026-05-05T08:15:00Z",
    operatorLabel: "Logistics · Nimba hub",
  },
  {
    transferCode: "TRF-BON-LOF-0002",
    fromWarehouseCode: "WH-BON-001",
    toWarehouseCode: "WH-LOF-001",
    sku: "RICE-SEED-001",
    quantity: 80,
    status: "dispatched",
    requestedAt: "2026-05-04T07:30:00Z",
    operatorLabel: "WM-Gbarnga",
  },
  {
    transferCode: "TRF-MON-SIN-0003",
    fromWarehouseCode: "WH-MON-001",
    toWarehouseCode: "WH-SIN-001",
    sku: "TOOL-HOE-001",
    quantity: 300,
    status: "requested",
    requestedAt: "2026-05-06T10:00:00Z",
  },
  {
    transferCode: "TRF-NIM-NIM-0004",
    fromWarehouseCode: "WH-NIM-001",
    toWarehouseCode: "WH-NIM-002",
    sku: "FERT-UREA-002",
    quantity: 55,
    status: "completed",
    requestedAt: "2026-04-28T09:00:00Z",
    operatorLabel: "Internal Nimba shuttle",
  },
  {
    transferCode: "TRF-MON-MAR-0005",
    fromWarehouseCode: "WH-MON-001",
    toWarehouseCode: "WH-MAR-001",
    sku: "FERT-UREA-002",
    quantity: 45,
    status: "disputed",
    requestedAt: "2026-05-02T11:20:00Z",
    operatorLabel: "Awaiting receiver sign-off",
  },
  {
    transferCode: "TRF-LOF-GBA-0008",
    fromWarehouseCode: "WH-LOF-001",
    toWarehouseCode: "WH-GBA-001",
    sku: "RICE-SEED-001",
    quantity: 96,
    status: "approved",
    requestedAt: "2026-05-06T06:40:00Z",
    operatorLabel: "County redistribution · Lofa → Grand Bassa",
  },
];

export function canonicalTransferOrders(): TransferOrderView[] {
  return demo.map((d, i) => ({
    id: `canonical-trf-${i}`,
    transferCode: d.transferCode,
    fromMinistryCode: d.fromWarehouseCode,
    toMinistryCode: d.toWarehouseCode,
    fromName: whName(d.fromWarehouseCode),
    toName: whName(d.toWarehouseCode),
    sku: d.sku,
    quantity: d.quantity,
    status: d.status,
    requestedAt: d.requestedAt,
    operatorLabel: d.operatorLabel ?? null,
    source: "canonical" as const,
  }));
}
