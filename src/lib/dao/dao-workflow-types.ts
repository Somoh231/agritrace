export type DaoWorkflowKind =
  | "register_farmer"
  | "farm_inspection"
  | "pest_disease_report"
  | "production_estimate"
  | "subsidy_delivery_verify"
  | "gps_field_evidence"
  /** MoA operational survey templates (stored on `field_reports` with structured JSON payload). */
  | "clan_crop_monitoring"
  | "clan_field_activity_report"
  | "dao_district_summary"
  | "dao_operational_review"
  | "dao_verification_review"
  | "dao_district_escalation"
  | "cac_county_operational_summary"
  | "cac_county_verification"
  | "cac_county_escalation"
  | "cac_reporting_compliance";

export type DaoWorkflowStatus = "draft" | "pending_sync" | "submitted" | "failed";

export type DaoWorkflowRecord = {
  id: string;
  kind: DaoWorkflowKind;
  status: DaoWorkflowStatus;
  payload: Record<string, unknown>;
  error_message?: string;
  sync_attempts: number;
  created_at: string;
  updated_at: string;
  /** Short label for queue UI */
  title?: string;
};

export const LEGACY_QUEUE_STORAGE_KEY = "agrivault-dao-offline-queue";

/** Optional hooks from `useDaoWorkflowQueue` wired into DAO drawer forms. */
export type DaoWorkflowFormBindings = {
  enabled: boolean;
  saveDraft?: (snapshot: Record<string, unknown>) => Promise<void>;
  queuePending: (snapshot: Record<string, unknown>) => Promise<void>;
  onSubmitFailure: (snapshot: Record<string, unknown>, message: string) => Promise<void>;
  markSynced: (brief: Record<string, unknown>) => Promise<void>;
};
