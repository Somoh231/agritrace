export type DaoWorkflowKind =
  | "register_farmer"
  | "farm_inspection"
  | "pest_disease_report"
  | "production_estimate"
  | "subsidy_delivery_verify"
  | "gps_field_evidence";

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
