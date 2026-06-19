import type { WorkflowAction, WorkflowStatus } from "@/lib/workflow/status-model";

/** Row shape returned by the workflow API (camel-cased subset of DB columns). */
export type OperationalSubmission = {
  id: string;
  referenceCode: string | null;
  submissionType: string;
  title: string;
  summary: string | null;
  status: WorkflowStatus;
  actorId: string | null;
  organizationId: string | null;
  county: string | null;
  district: string | null;
  currentAssigneeId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowActionRecord = {
  id: string;
  submissionId: string;
  actorId: string | null;
  action: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus | null;
  note: string | null;
  createdAt: string;
};

export type WorkflowComment = {
  id: string;
  submissionId: string;
  actorId: string | null;
  body: string;
  isCorrectionRequest: boolean;
  createdAt: string;
};

export type WorkflowAssignment = {
  id: string;
  submissionId: string;
  assignedBy: string | null;
  assigneeId: string | null;
  roleScope: string | null;
  status: string;
  note: string | null;
  createdAt: string;
};

/** Aggregated history surface for a single submission. */
export type WorkflowThread = {
  submission: OperationalSubmission;
  actions: WorkflowActionRecord[];
  comments: WorkflowComment[];
  assignments: WorkflowAssignment[];
};

export type WorkflowMutationBody = {
  action: WorkflowAction;
  /** Required for everything except creating via `submit`. */
  submissionId?: string;
  note?: string;
  /** For assign_reviewer. */
  assigneeId?: string;
  /** For creating a submission via `submit`. */
  create?: {
    submissionType: string;
    title: string;
    summary?: string;
    county?: string;
    district?: string;
    organizationId?: string;
    metadata?: Record<string, unknown>;
  };
};

export type WorkflowApiError = { ok: false; status: number; code: string; message: string };
export type WorkflowMutationResult =
  | { ok: true; submission: OperationalSubmission; persisted: boolean }
  | WorkflowApiError;
