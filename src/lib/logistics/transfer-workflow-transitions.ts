import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";

export type TransferWorkflowMutation =
  | "approve"
  | "reject"
  | "dispatch"
  | "mark_received"
  | "verify"
  | "escalate"
  | "investigate"
  | "dispute";

function mergeNotes(existing: string | null | undefined, line: string): string {
  return [existing?.trim() || null, line].filter(Boolean).join(" · ");
}

export type TransferTransitionResult =
  | {
      nextStatus: TransferWorkflowStatus;
      notes: string;
      timestamps: Partial<
        Pick<TransferOrderView, "approvedAt" | "dispatchedAt" | "deliveredAt" | "completedAt">
      >;
    }
  | { error: string };

export function computeTransferWorkflowTransition(
  order: TransferOrderView,
  action: TransferWorkflowMutation,
): TransferTransitionResult {
  const st = order.status;
  const iso = new Date().toISOString();

  if (st === "completed") {
    return { error: "Transfer is already reconciled — no further workflow transitions apply." };
  }
  if (st === "disputed") {
    if (action !== "investigate") {
      return { error: "Transfer is disputed — only investigation routing may append custody notes." };
    }
    return {
      nextStatus: "disputed",
      notes: mergeNotes(order.notes, "Investigation assignment reinforced."),
      timestamps: {},
    };
  }

  switch (action) {
    case "approve": {
      if (st !== "requested") return { error: "Approve is valid only while transfer status is requested." };
      return {
        nextStatus: "approved",
        notes: mergeNotes(order.notes, "Approved — county logistics chain updated."),
        timestamps: { approvedAt: iso },
      };
    }
    case "dispatch": {
      if (st !== "approved" && st !== "requested") {
        return { error: "Dispatch requires requested or approved corridor state." };
      }
      return {
        nextStatus: "dispatched",
        notes: mergeNotes(order.notes, "Dispatched — seal custody transferred."),
        timestamps: {
          ...(st === "requested" ? { approvedAt: iso } : {}),
          dispatchedAt: iso,
        },
      };
    }
    case "mark_received": {
      if (!["dispatched", "in_transit", "approved"].includes(st)) {
        return { error: "Receiving confirmation requires dispatched or in-transit (or approved staging) posture." };
      }
      return {
        nextStatus: "delivered",
        notes: mergeNotes(order.notes, "Receiving bay confirmation logged."),
        timestamps: { deliveredAt: iso },
      };
    }
    case "verify": {
      if (st !== "delivered") return { error: "National reconcile verification applies after receiving confirmation." };
      return {
        nextStatus: "completed",
        notes: mergeNotes(order.notes, "National reconcile verified."),
        timestamps: { completedAt: iso },
      };
    }
    case "reject":
    case "escalate":
    case "investigate":
    case "dispute": {
      const noteLine =
        action === "reject"
          ? "Rejected — corridor investigation opened."
          : action === "escalate"
            ? "Escalated — ministry oversight engaged."
            : action === "investigate"
              ? "Investigation assigned — custody preserved."
              : "Disputed — custody chain flagged.";
      return {
        nextStatus: "disputed",
        notes: mergeNotes(order.notes, noteLine),
        timestamps: {},
      };
    }
    default:
      return { error: "Unsupported workflow action." };
  }
}

export function transferMutationToPermissionAction(
  action: TransferWorkflowMutation,
):
  | "transfer.approve"
  | "transfer.reject"
  | "transfer.dispatch"
  | "transfer.mark_received"
  | "transfer.verify"
  | "transfer.escalate"
  | "transfer.investigate" {
  switch (action) {
    case "approve":
      return "transfer.approve";
    case "reject":
    case "dispute":
      return "transfer.reject";
    case "dispatch":
      return "transfer.dispatch";
    case "mark_received":
      return "transfer.mark_received";
    case "verify":
      return "transfer.verify";
    case "escalate":
      return "transfer.escalate";
    case "investigate":
      return "transfer.investigate";
    default:
      return "transfer.reject";
  }
}
