import type {
  VerificationGridRow,
  VerificationQueueDetail,
  VerificationQueueStatus,
} from "@/lib/ops/ministry-verification-queue-data";

export type VerificationWorkflowMutation = "approve" | "reject" | "escalate" | "revision" | "investigate";

function fmtStatus(s: VerificationQueueStatus): string {
  return s.replace(/_/g, " ");
}

export function computeVerificationTransition(args: {
  detail: VerificationQueueDetail;
  action: VerificationWorkflowMutation;
}): { nextStatus: VerificationQueueStatus; auditNote: string } | { error: string } {
  const { detail, action } = args;
  const st = detail.status;

  switch (action) {
    case "approve":
      if (st === "verified") return { error: "Record is already verified." };
      return {
        nextStatus: "verified",
        auditNote: "Approved — ministry attestation recorded.",
      };
    case "reject":
      if (st === "rejected") return { error: "Record is already rejected." };
      return {
        nextStatus: "rejected",
        auditNote: "Rejected — returned to DAO with disposition code.",
      };
    case "escalate":
      return {
        nextStatus: "escalated",
        auditNote: "Escalated to ministry oversight desk.",
      };
    case "revision":
      return {
        nextStatus: "under_review",
        auditNote: "Revision requested — DAO packet incomplete.",
      };
    case "investigate":
      return {
        nextStatus: "escalated",
        auditNote: "Investigation assigned — custody chain preserved.",
      };
    default:
      return { error: "Unsupported verification workflow action." };
  }
}

export function applyVerificationWorkflowMutation(args: {
  row: VerificationGridRow;
  action: VerificationWorkflowMutation;
  reviewerLabel: string;
  note?: string;
  atIso?: string;
}): VerificationGridRow | { error: string } {
  const transition = computeVerificationTransition({ detail: args.row._detail, action: args.action });
  if ("error" in transition) return transition;

  const iso = args.atIso ?? new Date().toISOString();
  const auditNote = args.note?.trim() || transition.auditNote;
  const reviewer = args.reviewerLabel || "Reviewer";
  const nextStatus = transition.nextStatus;

  const d: VerificationQueueDetail = {
    ...args.row._detail,
    status: nextStatus,
    auditTimeline: [...args.row._detail.auditTimeline, { at: iso, actor: reviewer, stage: "workflow", note: auditNote }],
  };

  return {
    ...args.row,
    status: fmtStatus(d.status),
    verificationAge: args.row.verificationAge,
    posture: d.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
    _detail: d,
  };
}
