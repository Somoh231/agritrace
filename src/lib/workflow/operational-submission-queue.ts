import type { VerificationGridRow, VerificationQueueDetail, VerificationQueueStatus } from "@/lib/ops/ministry-verification-queue-data";
import type { CaoApprovalItem, CaoApprovalQueueKind, CaoApprovalStatus } from "@/lib/cao/cao-approval-seed";
import type { WorkflowStatus } from "@/lib/workflow/status-model";
import { OPERATIONAL_SUBMISSION_TYPES } from "@/lib/workflow/submission-types";
import type { OperationalSubmission } from "@/lib/workflow/types";

function workflowStatusToVerification(status: WorkflowStatus): VerificationQueueStatus {
  switch (status) {
    case "submitted":
    case "dao_review":
      return "pending";
    case "dao_corrections_requested":
    case "cac_corrections_requested":
    case "cac_review":
    case "ministry_review":
      return "under_review";
    case "dao_approved":
    case "cac_approved":
    case "ministry_approved":
      return "verified";
    case "rejected":
      return "rejected";
    case "escalated":
      return "escalated";
    case "archived":
      return "resolved";
    default:
      return "pending";
  }
}

function submissionTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

function verificationTypeForSubmission(type: string): VerificationQueueDetail["submissionType"] {
  if (type === OPERATIONAL_SUBMISSION_TYPES.farmerRegistration) return "farmer_registration";
  if (type === OPERATIONAL_SUBMISSION_TYPES.fieldInspection) return "dao_inspection";
  if (type === OPERATIONAL_SUBMISSION_TYPES.inputDistribution) return "subsidy_verification";
  if (type === OPERATIONAL_SUBMISSION_TYPES.warehouseTransfer) return "warehouse_transfer_confirmation";
  if (type === OPERATIONAL_SUBMISSION_TYPES.gpsVerification || type === OPERATIONAL_SUBMISSION_TYPES.farmBoundary) {
    return "gps_verification";
  }
  return "farmer_registration";
}

/** Converts a live `operational_submissions` row into a verification grid row. */
export function operationalSubmissionToVerificationRow(sub: OperationalSubmission, seq: number): VerificationGridRow {
  const refs = (sub.metadata?.entity_refs ?? {}) as Record<string, string>;
  const vType = verificationTypeForSubmission(sub.submissionType);
  const vStatus = workflowStatusToVerification(sub.status);
  const submitted = sub.createdAt;
  const detail: VerificationQueueDetail = {
    id: sub.referenceCode ?? sub.id,
    submissionType: vType,
    submissionTypeLabel: submissionTypeLabel(sub.submissionType),
    county: sub.county ?? "—",
    district: sub.district ?? "—",
    dao: "Field capture",
    status: vStatus,
    priority: sub.status === "escalated" ? "critical" : "routine",
    narrativeSummary: sub.summary ?? sub.title,
    routingCaption: "Live operational submission — decisions persist via workflow engine.",
    auditTimeline: [
      {
        at: submitted,
        actor: "Submitter",
        stage: "capture",
        note: `Submission created (${sub.submissionType.replace(/_/g, " ")}).`,
      },
      {
        at: sub.updatedAt,
        actor: "Workflow engine",
        stage: "status",
        note: `Current status: ${sub.status.replace(/_/g, " ")}.`,
      },
    ],
    metadata: {
      "Submission ID": sub.id,
      Type: sub.submissionType,
      ...(refs.farmer_id ? { "Farmer ID": refs.farmer_id } : {}),
    },
    relatedWarehouse: refs.warehouse_id ?? null,
    linkedFarmers: refs.farmer_id ? [refs.farmer_id] : [],
    operationalNotes: [`Reference ${sub.referenceCode ?? sub.id}`],
    attachmentPlaceholders: [],
    aiSummary: "Live queue item backed by operational_submissions.",
    chips: vStatus === "escalated" ? ["escalated"] : ["awaiting_verification"],
    submissionId: sub.id,
  };

  return {
    id: detail.id,
    county: detail.county,
    district: detail.district,
    dao: detail.dao,
    submissionType: detail.submissionTypeLabel,
    timestamp: submitted,
    priority: detail.priority.toUpperCase(),
    status: detail.status.replace(/_/g, " "),
    verificationAge: "live",
    assignedReviewer: "Workflow queue",
    posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
    _detail: { ...detail, submissionId: sub.id },
    _liveSubmissionId: sub.id,
    _seq: seq,
  } as VerificationGridRow & { _liveSubmissionId?: string; _seq?: number };
}

/** Merges live submissions ahead of fixture rows; skips fixture duplicates when dedupe_key matches. */
export function mergeVerificationQueueWithSubmissions(
  fixtureRows: VerificationGridRow[],
  submissions: OperationalSubmission[],
): VerificationGridRow[] {
  const liveKeys = new Set(
    submissions
      .map((s) => (typeof s.metadata?.dedupe_key === "string" ? s.metadata.dedupe_key : null))
      .filter(Boolean) as string[],
  );

  const liveRows = submissions
    .filter((s) => s.status !== "archived" && s.status !== "draft")
    .map((s, i) => operationalSubmissionToVerificationRow(s, i + 1));

  const filteredFixtures = fixtureRows.filter((r) => {
    const dedupe = r._detail.metadata?.["Dedupe key"];
    return !dedupe || !liveKeys.has(dedupe);
  });

  return [...liveRows, ...filteredFixtures];
}

/** Maps operational submissions into CAC approval queue items with real submissionId. */
export function submissionsToCaoApprovalItems(submissions: OperationalSubmission[]): CaoApprovalItem[] {
  return submissions
    .filter((s) => s.status !== "archived" && s.status !== "draft")
    .map((s) => {
      const queue: CaoApprovalQueueKind =
        s.submissionType === OPERATIONAL_SUBMISSION_TYPES.fieldInspection
          ? "farm_inspection"
          : s.submissionType === OPERATIONAL_SUBMISSION_TYPES.inputDistribution
            ? "subsidy_verification"
            : s.submissionType === OPERATIONAL_SUBMISSION_TYPES.pestDiseaseAlert
              ? "pest_escalation"
              : "farmer_registration";

      const status: CaoApprovalStatus =
        s.status === "ministry_approved" || s.status === "dao_approved" || s.status === "cac_approved"
          ? "approved"
          : s.status === "rejected"
            ? "rejected"
            : s.status === "escalated"
              ? "escalated"
              : s.status === "cac_review" || s.status === "dao_review" || s.status === "ministry_review"
                ? "under_review"
                : "pending";

      return {
        id: `live-${s.id}`,
        queue,
        title: s.title,
        district: s.district ?? "—",
        submittedBy: "Field workflow",
        submittedAt: s.createdAt,
        status,
        detail: s.summary ?? `Live submission · ${s.referenceCode ?? s.id}`,
        submissionId: s.id,
      };
    });
}
