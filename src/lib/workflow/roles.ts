/**
 * Persistent approval workflow — role → stage mapping & permission checks.
 *
 * Pure and unit-testable. Server logic resolves the role from the
 * authenticated `profiles` row (never from the client) and uses these helpers
 * to authorize actions alongside `computeSubmissionTransition`.
 */

import type { UserRole } from "@/lib/supabase/types";
import type { WorkflowAction, WorkflowStage } from "@/lib/workflow/status-model";

/** Maps a DB user role to its workflow stage. Unknown roles default to read-only donor scope. */
export function workflowStageForRole(role: UserRole | null | undefined): WorkflowStage {
  switch (role) {
    case "super_admin":
    case "admin":
    case "ministry_admin":
    case "ministry_officer":
    case "government_officer":
      return "ministry";
    case "county_agriculture_coordinator":
    case "county_officer":
      return "cac";
    case "dao_officer":
    case "district_officer":
      return "dao";
    case "clan_technician":
    case "field_agent":
      return "clan";
    case "auditor":
      return "auditor";
    case "donor_observer":
    case "donor_partner":
      return "donor";
    default:
      return "donor";
  }
}

/** Auditor + donor are strictly read-only across the workflow surface. */
export function isReadOnlyStage(stage: WorkflowStage): boolean {
  return stage === "auditor" || stage === "donor" || stage === "none";
}

/** Authors who may create/submit field submissions. */
export function canCreateSubmission(stage: WorkflowStage): boolean {
  return stage === "clan" || stage === "dao" || stage === "cac" || stage === "ministry";
}

/** Ministry/national operators are not county-bound; everyone else is. */
export function stageIsCountyBound(stage: WorkflowStage): boolean {
  return stage === "dao" || stage === "cac" || stage === "clan";
}

function normCounty(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t.toLowerCase() : null;
}

/**
 * County-scope gate. Ministry/auditor/donor are not county-bound (auditor/donor
 * are read-only and gated separately). County-bound stages must match the
 * submission county exactly.
 */
export function actorCountyMatches(
  stage: WorkflowStage,
  actorCounty: string | null | undefined,
  submissionCounty: string | null | undefined,
): boolean {
  if (!stageIsCountyBound(stage)) return true;
  const a = normCounty(actorCounty);
  const s = normCounty(submissionCounty);
  if (!a || !s) return false;
  return a === s;
}

export type WorkflowPermissionInput = {
  stage: WorkflowStage;
  action: WorkflowAction;
  actorCounty: string | null | undefined;
  submissionCounty: string | null | undefined;
  /** For non-create actions: whether the actor is the submission author. */
  isAuthor?: boolean;
};

export type WorkflowPermissionResult = { ok: true } | { ok: false; reason: string };

/**
 * Role/scope authorization, independent of the state machine.
 * Combine with `computeSubmissionTransition` for full legality:
 *   permitted = checkWorkflowPermission(...).ok && computeSubmissionTransition(...).ok
 */
export function checkWorkflowPermission(input: WorkflowPermissionInput): WorkflowPermissionResult {
  const { stage, action, actorCounty, submissionCounty, isAuthor } = input;

  if (isReadOnlyStage(stage)) {
    return { ok: false, reason: "Read-only role (auditor/donor) cannot perform workflow mutations." };
  }

  // submit: authors only; if county-bound, must own scope (author) or match county.
  if (action === "submit") {
    if (!canCreateSubmission(stage)) {
      return { ok: false, reason: "This role cannot create or submit submissions." };
    }
    if (stageIsCountyBound(stage) && !isAuthor && !actorCountyMatches(stage, actorCounty, submissionCounty)) {
      return { ok: false, reason: "Submission is outside your county scope." };
    }
    return { ok: true };
  }

  // comment: any non-read-only stage within county scope (or author).
  if (action === "comment") {
    if (isAuthor) return { ok: true };
    if (!actorCountyMatches(stage, actorCounty, submissionCounty)) {
      return { ok: false, reason: "Comment is outside your county scope." };
    }
    return { ok: true };
  }

  // Reviewer mutations (approve/reject/request_corrections/escalate/assign_reviewer/archive)
  if (stage === "clan") {
    return { ok: false, reason: "CLAN field operators cannot review submissions." };
  }
  if (!actorCountyMatches(stage, actorCounty, submissionCounty)) {
    return { ok: false, reason: "Submission is outside your county scope." };
  }
  return { ok: true };
}
