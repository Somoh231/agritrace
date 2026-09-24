import { NextResponse } from "next/server";

import { beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { clampStr, parseJsonObject } from "@/lib/http/api-security";
import { WORKFLOW_MUTATION_POLICY } from "@/lib/http/rate-limit-policies";
import { requireWorkflowPrincipal } from "@/lib/ops/server-permissions";
import { checkWorkflowPermission, workflowStageForRole } from "@/lib/workflow/roles";
import {
  computeSubmissionTransition,
  isWorkflowAction,
  isWorkflowStatus,
  type WorkflowStatus,
} from "@/lib/workflow/status-model";
import type {
  OperationalSubmission,
  WorkflowActionRecord,
  WorkflowAssignment,
  WorkflowComment,
  WorkflowMutationBody,
} from "@/lib/workflow/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapSubmission(r: Record<string, unknown>): OperationalSubmission {
  return {
    id: String(r.id),
    referenceCode: (r.reference_code as string) ?? null,
    submissionType: String(r.submission_type ?? ""),
    title: String(r.title ?? ""),
    summary: (r.summary as string) ?? null,
    status: (r.status as WorkflowStatus) ?? "draft",
    actorId: (r.actor_id as string) ?? null,
    organizationId: (r.organization_id as string) ?? null,
    county: (r.county as string) ?? null,
    district: (r.district as string) ?? null,
    currentAssigneeId: (r.current_assignee_id as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

function mapAction(r: Record<string, unknown>): WorkflowActionRecord {
  return {
    id: String(r.id),
    submissionId: String(r.submission_id),
    actorId: (r.actor_id as string) ?? null,
    action: String(r.action ?? ""),
    fromStatus: (r.from_status as WorkflowStatus) ?? null,
    toStatus: (r.to_status as WorkflowStatus) ?? null,
    note: (r.note as string) ?? null,
    createdAt: String(r.created_at ?? ""),
  };
}

function mapComment(r: Record<string, unknown>): WorkflowComment {
  return {
    id: String(r.id),
    submissionId: String(r.submission_id),
    actorId: (r.actor_id as string) ?? null,
    body: String(r.body ?? ""),
    isCorrectionRequest: Boolean(r.is_correction_request),
    createdAt: String(r.created_at ?? ""),
  };
}

function mapAssignment(r: Record<string, unknown>): WorkflowAssignment {
  return {
    id: String(r.id),
    submissionId: String(r.submission_id),
    assignedBy: (r.assigned_by as string) ?? null,
    assigneeId: (r.assignee_id as string) ?? null,
    roleScope: (r.role_scope as string) ?? null,
    status: String(r.status ?? "active"),
    note: (r.note as string) ?? null,
    createdAt: String(r.created_at ?? ""),
  };
}

const SELECT_SUBMISSION =
  "id,reference_code,submission_type,title,summary,status,actor_id,organization_id,county,district,current_assignee_id,metadata,created_at,updated_at";

// ===========================================================================
// POST — safe mutation handlers
// ===========================================================================
export async function POST(req: Request) {
  const principal = await requireWorkflowPrincipal();
  if (!principal.ok) {
    return NextResponse.json({ ok: false, code: principal.code, message: principal.message }, { status: principal.status });
  }

  const ctx = await beginApiRequestAsync(req, WORKFLOW_MUTATION_POLICY, principal.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const { supabase, userId, profile } = principal;
  const stage = workflowStageForRole(profile.role);

  const parsed = await parseJsonObject(req, 128_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, code: parsed.status === 413 ? "payload_too_large" : "bad_request", message: parsed.error },
      { status: parsed.status },
    );
  }
  const body = parsed.body as WorkflowMutationBody;

  if (!isWorkflowAction(body.action)) {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Unknown workflow action." }, { status: 400 });
  }
  const action = body.action;
  const note = clampStr(body.note, 4_000);

  // -------------------------------------------------------------------------
  // Create + submit (no submissionId, has `create`). The database derives
  // county/district/organization from the operator profile (wf_create_submission).
  // -------------------------------------------------------------------------
  if (action === "submit" && !body.submissionId) {
    const c = body.create;
    const submissionType = clampStr(c?.submissionType, 100);
    const title = clampStr(c?.title, 240);
    if (!c || !submissionType || !title) {
      return NextResponse.json(
        { ok: false, code: "bad_request", message: "submissionType and title are required to create a submission." },
        { status: 400 },
      );
    }
    const perm = checkWorkflowPermission({
      stage,
      action: "submit",
      actorCounty: profile.county,
      submissionCounty: c.county ?? profile.county,
      isAuthor: false,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, code: "forbidden", message: perm.reason }, { status: 403 });
    }

    const { data, error } = await supabase.rpc("wf_create_submission", {
      p_submission_type: submissionType,
      p_title: title,
      p_summary: clampStr(c.summary, 4_000) || null,
      p_county: c.county ?? null,
      p_district: c.district ?? null,
      p_metadata: c.metadata ?? {},
      p_note: note || null,
      p_request_id: ctx.requestId,
    });
    if (error || !data) return workflowRpcError(error, "Could not create submission.");
    const result = data as { submission: Record<string, unknown>; deduplicated: boolean };
    return NextResponse.json({
      ok: true,
      submission: mapSubmission(result.submission),
      persisted: !result.deduplicated,
      ...(result.deduplicated ? { deduplicated: true } : {}),
    });
  }

  // -------------------------------------------------------------------------
  // Mutations on an existing submission
  // -------------------------------------------------------------------------
  const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";
  if (!submissionId || !UUID_RE.test(submissionId)) {
    return NextResponse.json({ ok: false, code: "bad_request", message: "A valid submissionId is required." }, { status: 400 });
  }

  const { data: row, error: loadErr } = await supabase
    .from("operational_submissions")
    .select(SELECT_SUBMISSION)
    .eq("id", submissionId)
    .maybeSingle();
  if (loadErr) {
    console.error("[workflow] submission load failed", loadErr.message);
    return NextResponse.json({ ok: false, code: "load_failed", message: "Could not load submission." }, { status: 422 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, code: "not_found", message: "Submission not found or outside your scope." }, { status: 404 });
  }

  const submission = mapSubmission(row);

  // Fast, well-worded pre-checks. The database re-validates everything inside
  // wf_transition under a row lock, so these are not the security boundary.
  const perm = checkWorkflowPermission({
    stage,
    action,
    actorCounty: profile.county,
    submissionCounty: submission.county,
    actorDistrict: profile.district,
    submissionDistrict: submission.district,
    isAuthor: submission.actorId === userId,
  });
  if (!perm.ok) {
    return NextResponse.json({ ok: false, code: "forbidden", message: perm.reason }, { status: 403 });
  }
  const tr = computeSubmissionTransition(submission.status, action, stage);
  if (!tr.ok) {
    return NextResponse.json({ ok: false, code: "invalid_transition", message: tr.error }, { status: 422 });
  }

  let assigneeId: string | null = null;
  if (action === "assign_reviewer") {
    assigneeId = typeof body.assigneeId === "string" ? body.assigneeId.trim() : "";
    if (!assigneeId || !UUID_RE.test(assigneeId)) {
      return NextResponse.json({ ok: false, code: "bad_request", message: "assign_reviewer requires a valid assigneeId." }, { status: 400 });
    }
  }

  // State change, ledger, comment, assignment, notification and audit row
  // commit or roll back together.
  const { data, error } = await supabase.rpc("wf_transition", {
    p_submission_id: submission.id,
    p_action: action,
    p_note: note || null,
    p_assignee_id: assigneeId,
    p_request_id: ctx.requestId,
  });
  if (error || !data) return workflowRpcError(error, "Could not persist workflow decision.");
  const result = data as { submission: Record<string, unknown> };
  return NextResponse.json({ ok: true, submission: mapSubmission(result.submission), persisted: true });
}

/** Maps database-enforced workflow errors to stable API responses without leaking internals. */
function workflowRpcError(
  error: { code?: string; message?: string } | null,
  fallback: string,
): NextResponse {
  const code = error?.code ?? "";
  if (code === "42501") {
    return NextResponse.json({ ok: false, code: "forbidden", message: "This action is outside your role or scope." }, { status: 403 });
  }
  if (code === "P0002") {
    return NextResponse.json({ ok: false, code: "not_found", message: "Submission not found or outside your scope." }, { status: 404 });
  }
  if (code === "22023" || code === "22001") {
    return NextResponse.json(
      { ok: false, code: "invalid_transition", message: "This submission changed or the request is invalid. Reload and try again." },
      { status: 409 },
    );
  }
  console.error("[workflow] rpc failed", code, error?.message);
  return NextResponse.json({ ok: false, code: "persist_failed", message: fallback }, { status: 422 });
}

// ===========================================================================
// GET — read workflow thread for a submission, or list submissions in scope
// ===========================================================================
export async function GET(req: Request) {
  const principal = await requireWorkflowPrincipal();
  if (!principal.ok) {
    return NextResponse.json({ ok: false, code: principal.code, message: principal.message }, { status: principal.status });
  }
  const { supabase } = principal;
  const url = new URL(req.url);
  const submissionId = url.searchParams.get("submissionId");

  if (submissionId) {
    if (!UUID_RE.test(submissionId)) {
      return NextResponse.json({ ok: false, code: "bad_request", message: "Invalid submissionId." }, { status: 400 });
    }
    const { data: sub } = await supabase.from("operational_submissions").select(SELECT_SUBMISSION).eq("id", submissionId).maybeSingle();
    if (!sub) {
      return NextResponse.json({ ok: false, code: "not_found", message: "Submission not found or outside scope." }, { status: 404 });
    }
    const [actions, comments, assignments] = await Promise.all([
      supabase.from("workflow_actions").select("*").eq("submission_id", submissionId).order("created_at", { ascending: true }),
      supabase.from("workflow_comments").select("*").eq("submission_id", submissionId).order("created_at", { ascending: true }),
      supabase.from("workflow_assignments").select("*").eq("submission_id", submissionId).order("created_at", { ascending: true }),
    ]);
    return NextResponse.json({
      ok: true,
      thread: {
        submission: mapSubmission(sub),
        actions: (actions.data ?? []).map(mapAction),
        comments: (comments.data ?? []).map(mapComment),
        assignments: (assignments.data ?? []).map(mapAssignment),
      },
    });
  }

  // List mode — RLS restricts rows to the caller's scope.
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  let q = supabase.from("operational_submissions").select(SELECT_SUBMISSION).order("created_at", { ascending: false }).limit(100);
  if (status && isWorkflowStatus(status)) q = q.eq("status", status);
  if (type) q = q.eq("submission_type", type);
  const { data, error } = await q;
  if (error) {
    console.error("[workflow] submission list failed", error.message);
    return NextResponse.json({ ok: false, code: "load_failed", message: "Could not load submissions." }, { status: 422 });
  }
  return NextResponse.json({ ok: true, submissions: (data ?? []).map(mapSubmission) });
}
