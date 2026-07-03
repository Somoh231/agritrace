import type { OperationalChipVariant } from "@/lib/ops/operational-chip-types";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { OperationalPermissionContext, OperationalWorkflowAction } from "@/lib/ops/permissions";

export type TransferAuditEvt = { at: string; actor: string; stage: string; note: string };

export type TransferDetail = {
  raw: TransferOrderView;
  displayStatus: string;
  category: string;
  corridorCounty: string;
  manifestLines: string[];
  checkpoints: string[];
  receivingOfficer: string;
  gpsPlaceholder: string;
  auditEvents: TransferAuditEvt[];
  aiSummary: string;
  chips: OperationalChipVariant[];
};

export type TransferGridRow = Record<string, unknown> & { id: string; _detail: TransferDetail };

export function countyForCode(code: string): string {
  return MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code)?.county ?? "—";
}

export function transferOperationalContext(order: TransferOrderView): OperationalPermissionContext {
  const corridorCounty = countyForCode(order.fromMinistryCode);
  return {
    rowCounty: corridorCounty,
    transfer: {
      fromMinistryCode: order.fromMinistryCode,
      toMinistryCode: order.toMinistryCode,
      status: order.status,
      corridorCounty,
    },
  };
}

export function transferActionToPermission(
  action: "approve" | "reject" | "escalate" | "dispatch" | "mark_received" | "verify" | "investigate",
): OperationalWorkflowAction {
  const m = {
    approve: "transfer.approve",
    reject: "transfer.reject",
    escalate: "transfer.escalate",
    dispatch: "transfer.dispatch",
    mark_received: "transfer.mark_received",
    verify: "transfer.verify",
    investigate: "transfer.investigate",
  } as const;
  return m[action];
}

function categoryForSku(sku: string): string {
  if (sku.includes("FERT")) return "Fertilizer transfer";
  if (sku.includes("SEED") || sku.includes("RICE")) return "Seed allocation";
  if (sku.includes("TOOL")) return "Equipment redistribution";
  return "County redistribution";
}

export function displayStatus(st: TransferWorkflowStatus): string {
  switch (st) {
    case "delivered":
      return "received";
    case "completed":
      return "verified";
    default:
      return st.replace(/_/g, " ");
  }
}

function seedTimeline(t: TransferOrderView): TransferAuditEvt[] {
  const ev: TransferAuditEvt[] = [
    {
      at: t.requestedAt,
      actor: t.operatorLabel ?? "Corridor operator",
      stage: "requested",
      note: "Transfer request opened — custody chain initiated.",
    },
  ];
  if (t.approvedAt)
    ev.push({ at: t.approvedAt, actor: "County logistics", stage: "approved", note: "County sign-off recorded." });
  if (t.dispatchedAt)
    ev.push({ at: t.dispatchedAt, actor: "Warehouse dispatch", stage: "dispatched", note: "Seal applied — manifest locked." });
  if (t.deliveredAt)
    ev.push({ at: t.deliveredAt, actor: "Receiving bay", stage: "received", note: "Offload observed — variance check pending." });
  if (t.completedAt)
    ev.push({ at: t.completedAt, actor: "National reconcile", stage: "verified", note: "Ledger reconciled — dispute window closed." });
  return ev;
}

function checkpointsFor(t: TransferOrderView): string[] {
  return [
    `${t.fromMinistryCode} · dispatch weighbridge`,
    "County corridor attest",
    `${t.toMinistryCode} · receiving QA`,
    "Ministry manifest reconcile",
  ];
}

function chipsFor(t: TransferOrderView): OperationalChipVariant[] {
  const out: OperationalChipVariant[] = [];
  if (t.status === "disputed") out.push("high_risk");
  if (t.status === "requested" || t.status === "approved") out.push("awaiting_verification");
  if (t.status === "in_transit" || t.status === "dispatched") out.push("inventory_risk");
  if (t.status === "disputed") out.push("compliance_delay");
  return [...new Set(out)];
}

function aiLine(t: TransferOrderView): string {
  if (t.status === "disputed") return "Disputed custody leg — receiver sign-off missing; ministry investigation recommended.";
  if (t.status === "in_transit") return "In-transit fertilizer/inputs posture elevates corridor variance risk until seal verified.";
  if (t.status === "requested") return "Approval backlog detected — county logistics queue should close before national inputs window.";
  return "Corridor stable — maintain verification checkpoints and GPS stub linkage when field tablets sync.";
}

export function toTransferGridRow(t: TransferOrderView): TransferGridRow {
  const category = categoryForSku(t.sku);
  const corridorCounty = countyForCode(t.fromMinistryCode);
  const detail: TransferDetail = {
    raw: t,
    displayStatus: displayStatus(t.status),
    category,
    corridorCounty,
    manifestLines: [
      `${t.sku} · qty ${t.quantity} · batch ministry ledger`,
      `Operator: ${t.operatorLabel ?? "—"}`,
      t.notes ? `Notes: ${t.notes}` : "Notes: —",
    ],
    checkpoints: checkpointsFor(t),
    receivingOfficer: "Receiving officer · pending biometric attestation (stub)",
    gpsPlaceholder: "GPS route polyline placeholder — uplink pending from field logistics tablet.",
    auditEvents: seedTimeline(t),
    aiSummary: aiLine(t),
    chips: chipsFor(t),
  };
  return {
    id: t.id,
    transferCode: t.transferCode,
    category,
    corridorCounty,
    origin: t.fromMinistryCode,
    destination: t.toMinistryCode,
    sku: t.sku,
    quantity: String(t.quantity),
    status: detail.displayStatus,
    requestedAt: t.requestedAt,
    posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
    _detail: detail,
  };
}

export function transferStatusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" | "syncing" {
  if (status === "verified" || status === "completed") return "success";
  if (status === "disputed") return "danger";
  if (status === "requested" || status === "received") return "warning";
  if (status === "dispatched" || status === "in transit") return "syncing";
  return "info";
}
