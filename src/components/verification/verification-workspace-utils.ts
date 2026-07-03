import type { VerificationGridRow, VerificationQueueStatus } from "@/features/verification/model/types";

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "syncing";

export function fmtVerificationStatus(s: VerificationQueueStatus): string {
  return s.replace(/_/g, " ");
}

export function verificationStatusTone(status: VerificationQueueStatus): BadgeTone {
  switch (status) {
    case "verified":
    case "resolved":
      return "success";
    case "pending":
      return "warning";
    case "under_review":
      return "info";
    case "escalated":
      return "danger";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export function verificationPriorityTone(priority: string): BadgeTone {
  switch (priority) {
    case "critical":
      return "danger";
    case "elevated":
      return "warning";
    default:
      return "neutral";
  }
}

const PIPELINE: { key: VerificationQueueStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "under_review", label: "Under review" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "escalated", label: "Escalated" },
  { key: "resolved", label: "Resolved" },
];

export const VERIFICATION_PIPELINE = PIPELINE;

export function buildVerificationStatusCounts(rows: VerificationGridRow[]) {
  const counts: Record<string, number> = {};
  for (const stage of PIPELINE) counts[stage.key] = 0;
  for (const row of rows) {
    const key = row._detail.status;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function verificationOperationalContext(row: VerificationGridRow) {
  return {
    rowCounty: String(row.county),
    verificationSubmissionType: row._detail.submissionType,
    verificationStatus: row._detail.status,
    relatedWarehouseMinistryCode: row._detail.relatedWarehouse,
  };
}
