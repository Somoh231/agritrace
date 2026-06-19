import { normalizeCountyKey } from "@/lib/data/ministry-data-service";

export type CaoApprovalQueueKind =
  | "farmer_registration"
  | "farm_inspection"
  | "subsidy_verification"
  | "pest_escalation"
  | "district_summary"
  | "warehouse_replenishment";

export type CaoApprovalStatus = "pending" | "under_review" | "approved" | "rejected" | "escalated";

export type CaoApprovalItem = {
  id: string;
  queue: CaoApprovalQueueKind;
  title: string;
  district: string;
  submittedBy: string;
  submittedAt: string;
  status: CaoApprovalStatus;
  detail: string;
  /**
   * When present and a real `operational_submissions` UUID, the queue buttons
   * persist decisions via the workflow API. Demo seed rows omit this and update
   * optimistically as temporary UI state only.
   */
  submissionId?: string;
};

export function seedCaoApprovalItems(county: string | null): CaoApprovalItem[] {
  const label = county?.trim() || "Pilot county";
  const nk = normalizeCountyKey(county);
  const isNimba = nk.includes("nimba");
  const isBong = nk.includes("bong");

  const samples: Omit<CaoApprovalItem, "id">[] = [
    {
      queue: "farmer_registration",
      title: "Bulk household registrations · rainy-season cohort",
      district: isNimba ? "Yarmein" : isBong ? "Gbarnga" : "District A",
      submittedBy: isNimba ? "DAO-NIM-002" : "DAO-BON-001",
      submittedAt: "2026-05-06T08:40:00Z",
      status: "pending",
      detail: "Twelve new farmer rows awaiting GIS consistency checks.",
    },
    {
      queue: "farm_inspection",
      title: "Follow-up inspection · fertilizer adherence",
      district: isNimba ? "Sanniquellie-Mah" : "District B",
      submittedBy: "DAO-NIM-001",
      submittedAt: "2026-05-05T16:12:00Z",
      status: "under_review",
      detail: "DAO flagged uneven basal fertilizer application.",
    },
    {
      queue: "subsidy_verification",
      title: "Seed voucher reconciliation WH linkage",
      district: isBong ? "Suakoko" : "District C",
      submittedBy: "DAO-BON-001",
      submittedAt: "2026-05-04T11:05:00Z",
      status: "pending",
      detail: "Cross-check distribution_logs vs farmer confirmations.",
    },
    {
      queue: "pest_escalation",
      title: "Stem borer uptick · rapid alert path",
      district: isNimba ? "Ganta District" : "District D",
      submittedBy: "DAO-NIM-002",
      submittedAt: "2026-05-03T09:22:00Z",
      status: "escalated",
      detail: "County escalation requested — ministry situational desk copied.",
    },
    {
      queue: "district_summary",
      title: `Weekly DAO rollup · ${label}`,
      district: "County-wide",
      submittedBy: "System synthesis",
      submittedAt: "2026-05-02T07:00:00Z",
      status: "under_review",
      detail: "Consolidated visit throughput vs reporting SLA.",
    },
    {
      queue: "warehouse_replenishment",
      title: "NPK corridor stock-out risk · replenishment",
      district: "County logistics",
      submittedBy: "WH superintendent",
      submittedAt: "2026-05-06T06:15:00Z",
      status: "pending",
      detail: "Safety stock breached below CAC threshold for county allocations.",
    },
    {
      queue: "farmer_registration",
      title: "Cooperative roster corrections",
      district: isNimba ? "Fuamah" : "District E",
      submittedBy: "DAO-NIM-001",
      submittedAt: "2026-05-01T14:30:00Z",
      status: "approved",
      detail: "Prior cycle approvals archived.",
    },
    {
      queue: "subsidy_verification",
      title: "Post-payment subsidy verification batch",
      district: "County-wide",
      submittedBy: "DAO aggregation",
      submittedAt: "2026-04-28T18:00:00Z",
      status: "rejected",
      detail: "Returned for DAO corrections — duplicate beneficiary UID.",
    },
  ];

  return samples.map((s, i) => ({
    ...s,
    id: `cac-appr-${nk || "nat"}-${i}`,
  }));
}
