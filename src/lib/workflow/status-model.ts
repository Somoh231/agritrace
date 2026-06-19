/**
 * Persistent approval workflow — status model & transition validation.
 *
 * Pure, dependency-free, and unit-testable. The server action layer
 * (`/api/ops/workflows/submission`) is the only writer and always validates a
 * transition through `computeSubmissionTransition` before mutating state.
 *
 * Operational chain: CLAN → DAO → CAC → Ministry.
 */

export type WorkflowStatus =
  | "draft"
  | "submitted"
  | "dao_review"
  | "dao_corrections_requested"
  | "dao_approved"
  | "cac_review"
  | "cac_corrections_requested"
  | "cac_approved"
  | "ministry_review"
  | "ministry_approved"
  | "rejected"
  | "escalated"
  | "archived";

export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "draft",
  "submitted",
  "dao_review",
  "dao_corrections_requested",
  "dao_approved",
  "cac_review",
  "cac_corrections_requested",
  "cac_approved",
  "ministry_review",
  "ministry_approved",
  "rejected",
  "escalated",
  "archived",
] as const;

export type WorkflowAction =
  | "submit"
  | "approve"
  | "reject"
  | "request_corrections"
  | "escalate"
  | "assign_reviewer"
  | "comment"
  | "archive";

export const WORKFLOW_ACTIONS: readonly WorkflowAction[] = [
  "submit",
  "approve",
  "reject",
  "request_corrections",
  "escalate",
  "assign_reviewer",
  "comment",
  "archive",
] as const;

/** Stage of the acting operator within the chain. */
export type WorkflowStage = "clan" | "dao" | "cac" | "ministry" | "auditor" | "donor" | "none";

/** Terminal states accept no further state-changing transitions (except archive of finals). */
export const TERMINAL_STATUSES: readonly WorkflowStatus[] = ["ministry_approved", "rejected", "archived"];

export function isTerminalStatus(status: WorkflowStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

type Transition = {
  from: readonly WorkflowStatus[];
  action: WorkflowAction;
  stage: readonly WorkflowStage[];
  to: WorkflowStatus;
};

/**
 * Declarative transition table. A transition is legal iff a row matches the
 * current status, the action, and the actor's stage. `comment` never changes
 * state and is handled separately. Resubmission after corrections re-enters
 * the pipeline at `submitted`.
 */
const TRANSITIONS: readonly Transition[] = [
  // ---- submit / resubmit (authors) ----
  { from: ["draft"], action: "submit", stage: ["clan", "dao", "cac", "ministry"], to: "submitted" },
  {
    from: ["dao_corrections_requested", "cac_corrections_requested"],
    action: "submit",
    stage: ["clan", "dao", "cac", "ministry"],
    to: "submitted",
  },

  // ---- DAO stage ----
  { from: ["submitted"], action: "assign_reviewer", stage: ["dao", "ministry"], to: "dao_review" },
  { from: ["dao_review"], action: "assign_reviewer", stage: ["dao", "ministry"], to: "dao_review" },
  { from: ["submitted", "dao_review"], action: "approve", stage: ["dao", "ministry"], to: "dao_approved" },
  { from: ["submitted", "dao_review"], action: "request_corrections", stage: ["dao", "ministry"], to: "dao_corrections_requested" },
  { from: ["submitted", "dao_review"], action: "reject", stage: ["dao", "ministry"], to: "rejected" },
  { from: ["submitted", "dao_review"], action: "escalate", stage: ["dao", "cac", "ministry"], to: "escalated" },

  // ---- CAC stage ----
  { from: ["dao_approved"], action: "assign_reviewer", stage: ["cac", "ministry"], to: "cac_review" },
  { from: ["cac_review"], action: "assign_reviewer", stage: ["cac", "ministry"], to: "cac_review" },
  { from: ["dao_approved", "cac_review"], action: "approve", stage: ["cac", "ministry"], to: "cac_approved" },
  { from: ["dao_approved", "cac_review"], action: "request_corrections", stage: ["cac", "ministry"], to: "cac_corrections_requested" },
  { from: ["dao_approved", "cac_review"], action: "reject", stage: ["cac", "ministry"], to: "rejected" },
  { from: ["dao_approved", "cac_review"], action: "escalate", stage: ["cac", "ministry"], to: "escalated" },

  // ---- Ministry stage ----
  { from: ["cac_approved"], action: "assign_reviewer", stage: ["ministry"], to: "ministry_review" },
  { from: ["ministry_review"], action: "assign_reviewer", stage: ["ministry"], to: "ministry_review" },
  { from: ["cac_approved", "ministry_review", "escalated"], action: "approve", stage: ["ministry"], to: "ministry_approved" },
  { from: ["cac_approved", "ministry_review", "escalated"], action: "reject", stage: ["ministry"], to: "rejected" },
  { from: ["cac_approved", "ministry_review"], action: "request_corrections", stage: ["ministry"], to: "cac_corrections_requested" },

  // ---- archive (ministry only, from finals) ----
  { from: ["ministry_approved", "rejected"], action: "archive", stage: ["ministry"], to: "archived" },
];

export type TransitionResult =
  | { ok: true; nextStatus: WorkflowStatus; changed: boolean }
  | { ok: false; error: string };

/**
 * Computes the legal next status for (current, action, stage).
 * `comment` is always allowed on non-archived submissions and does not change state.
 */
export function computeSubmissionTransition(
  current: WorkflowStatus,
  action: WorkflowAction,
  stage: WorkflowStage,
): TransitionResult {
  if (action === "comment") {
    if (current === "archived") {
      return { ok: false, error: "Archived submissions are read-only." };
    }
    return { ok: true, nextStatus: current, changed: false };
  }

  const match = TRANSITIONS.find(
    (t) => t.action === action && t.from.includes(current) && t.stage.includes(stage),
  );

  if (!match) {
    // Distinguish "wrong stage" from "wrong state" for clearer operator messaging.
    const existsForAction = TRANSITIONS.some((t) => t.action === action && t.from.includes(current));
    if (existsForAction) {
      return { ok: false, error: `Your role cannot perform "${action}" at stage "${current}".` };
    }
    return { ok: false, error: `Action "${action}" is not allowed from status "${current}".` };
  }

  return { ok: true, nextStatus: match.to, changed: match.to !== current };
}

/** All actions that are legal for a stage at a given status (UI affordance hinting). */
export function allowedActionsFor(current: WorkflowStatus, stage: WorkflowStage): WorkflowAction[] {
  const out = new Set<WorkflowAction>();
  for (const a of WORKFLOW_ACTIONS) {
    const r = computeSubmissionTransition(current, a, stage);
    if (r.ok) out.add(a);
  }
  return [...out];
}

export function isWorkflowStatus(v: unknown): v is WorkflowStatus {
  return typeof v === "string" && (WORKFLOW_STATUSES as readonly string[]).includes(v);
}

export function isWorkflowAction(v: unknown): v is WorkflowAction {
  return typeof v === "string" && (WORKFLOW_ACTIONS as readonly string[]).includes(v);
}
