import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireWorkflowPrincipal } from "@/lib/ops/server-permissions";
import { persistWorkflowAuditLog } from "@/lib/ops/server-workflow-io";
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

function refCode(): string {
  return `SUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function roleScopeForStatus(status: WorkflowStatus): string {
  if (status === "dao_review") return "dao";
  if (status === "cac_review") return "cac";
  if (status === "ministry_review") return "ministry";
  return "review";
}

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
  const { supabase, userId, profile } = principal;
  const stage = workflowStageForRole(profile.role);

  let body: WorkflowMutationBody;
  try {
    body = (await req.json()) as WorkflowMutationBody;
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isWorkflowAction(body.action)) {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Unknown workflow action." }, { status: 400 });
  }
  const action = body.action;
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : "";

  // -------------------------------------------------------------------------
  // Create + submit (no submissionId, has `create`)
  // -------------------------------------------------------------------------
  if (action === "submit" && !body.submissionId) {
    const c = body.create;
    if (!c || typeof c.submissionType !== "string" || !c.submissionType.trim() || typeof c.title !== "string" || !c.title.trim()) {
      return NextResponse.json(
        { ok: false, code: "bad_request", message: "submissionType and title are required to create a submission." },
        { status: 400 },
      );
    }
    const county = (c.county ?? profile.county) ?? null;
    const perm = checkWorkflowPermission({ stage, action: "submit", actorCounty: profile.county, submissionCounty: county, isAuthor: true });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, code: "forbidden", message: perm.reason }, { status: 403 });
    }

    const insertRow = {
      reference_code: refCode(),
      submission_type: c.submissionType.trim(),
      title: c.title.trim(),
      summary: c.summary?.trim() || null,
      status: "draft" as WorkflowStatus,
      actor_id: userId,
      organization_id: c.organizationId ?? profile.organization_id ?? null,
      county,
      district: (c.district ?? profile.district) ?? null,
      metadata: c.metadata ?? {},
    };
    const { data: created, error: insErr } = await supabase
      .from("operational_submissions")
      .insert(insertRow)
      .select(SELECT_SUBMISSION)
      .single();
    if (insErr || !created) {
      console.error("[workflow] submission create failed", insErr?.message);
      return NextResponse.json({ ok: false, code: "persist_failed", message: "Could not create submission." }, { status: 422 });
    }

    const submission = mapSubmission(created);
    const tr = computeSubmissionTransition("draft", "submit", stage);
    const nextStatus = tr.ok ? tr.nextStatus : "submitted";

    await supabase.from("operational_submissions").update({ status: nextStatus }).eq("id", submission.id);
    await supabase.from("workflow_actions").insert({
      submission_id: submission.id,
      actor_id: userId,
      action: "submit",
      from_status: "draft",
      to_status: nextStatus,
      county: submission.county,
      district: submission.district,
      note: note || null,
    });
    await persistWorkflowAuditLog({
      supabase,
      userId,
      action: "workflow_submit",
      tableHint: "operational_submissions",
      recordRef: submission.referenceCode,
      detail: { submission_id: submission.id, to_status: nextStatus, type: submission.submissionType },
    });

    return NextResponse.json({ ok: true, submission: { ...submission, status: nextStatus }, persisted: true });
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
  const isAuthor = submission.actorId === userId;

  // 1) Role / scope authorization
  const perm = checkWorkflowPermission({
    stage,
    action,
    actorCounty: profile.county,
    submissionCounty: submission.county,
    isAuthor,
  });
  if (!perm.ok) {
    return NextResponse.json({ ok: false, code: "forbidden", message: perm.reason }, { status: 403 });
  }

  // 2) Transition legality
  const tr = computeSubmissionTransition(submission.status, action, stage);
  if (!tr.ok) {
    return NextResponse.json({ ok: false, code: "invalid_transition", message: tr.error }, { status: 422 });
  }

  // assign_reviewer needs a target
  let assigneeId: string | null = null;
  if (action === "assign_reviewer") {
    assigneeId = typeof body.assigneeId === "string" ? body.assigneeId.trim() : "";
    if (!assigneeId || !UUID_RE.test(assigneeId)) {
      return NextResponse.json({ ok: false, code: "bad_request", message: "assign_reviewer requires a valid assigneeId." }, { status: 400 });
    }
  }

  // 3) Persist submission state
  const patch: Record<string, unknown> = {};
  if (tr.changed) patch.status = tr.nextStatus;
  if (action === "assign_reviewer" && assigneeId) patch.current_assignee_id = assigneeId;

  if (Object.keys(patch).length > 0) {
    const { error: updErr } = await supabase.from("operational_submissions").update(patch).eq("id", submission.id);
    if (updErr) {
      console.error("[workflow] submission update failed", updErr.message);
      return NextResponse.json(
        { ok: false, code: "persist_failed", message: "Could not persist workflow decision — verify permissions and scope." },
        { status: 422 },
      );
    }
  }

  // 4) Append-only action ledger entry
  await supabase.from("workflow_actions").insert({
    submission_id: submission.id,
    actor_id: userId,
    action,
    from_status: submission.status,
    to_status: tr.nextStatus,
    county: submission.county,
    district: submission.district,
    note: note || null,
  });

  // 5) Comments / correction requests
  if (action === "request_corrections" || (action === "comment" && note)) {
    await supabase.from("workflow_comments").insert({
      submission_id: submission.id,
      actor_id: userId,
      body: note || "Corrections requested.",
      is_correction_request: action === "request_corrections",
      county: submission.county,
    });
  }

  // 6) Assignment record
  if (action === "assign_reviewer" && assigneeId) {
    await supabase.from("workflow_assignments").insert({
      submission_id: submission.id,
      assigned_by: userId,
      assignee_id: assigneeId,
      role_scope: roleScopeForStatus(tr.nextStatus),
      status: "active",
      county: submission.county,
      district: submission.district,
      note: note || null,
    });
  }

  // 7) Directed notification (best-effort; never blocks the decision)
  await maybeNotify({ supabase, userId, action, submission, assigneeId, nextStatus: tr.nextStatus, note });

  // 8) Audit log
  await persistWorkflowAuditLog({
    supabase,
    userId,
    action: `workflow_${action}`,
    tableHint: "operational_submissions",
    recordRef: submission.referenceCode,
    detail: {
      submission_id: submission.id,
      from_status: submission.status,
      to_status: tr.nextStatus,
      note: note || null,
      assignee_id: assigneeId,
    },
  });

  return NextResponse.json({
    ok: true,
    submission: {
      ...submission,
      status: tr.nextStatus,
      currentAssigneeId: assigneeId ?? submission.currentAssigneeId,
    },
    persisted: true,
  });
}

async function maybeNotify(args: {
  supabase: SupabaseClient;
  userId: string;
  action: string;
  submission: OperationalSubmission;
  assigneeId: string | null;
  nextStatus: WorkflowStatus;
  note: string;
}): Promise<void> {
  const { supabase, userId, action, submission, assigneeId, nextStatus, note } = args;

  let recipient: string | null = null;
  let kind = "decision";
  let title = "";

  if (action === "assign_reviewer" && assigneeId) {
    recipient = assigneeId;
    kind = "assignment";
    title = `Assigned for review: ${submission.title}`;
  } else if (action === "request_corrections") {
    recipient = submission.actorId;
    kind = "correction_request";
    title = `Corrections requested: ${submission.title}`;
  } else if (action === "escalate") {
    recipient = submission.actorId;
    kind = "escalation";
    title = `Escalated: ${submission.title}`;
  } else if (action === "approve" || action === "reject") {
    recipient = submission.actorId;
    kind = "decision";
    title = `${action === "approve" ? "Advanced" : "Rejected"}: ${submission.title}`;
  }

  // Don't notify yourself.
  if (!recipient || recipient === userId) return;

  const { error } = await supabase.from("workflow_notifications").insert({
    submission_id: submission.id,
    recipient_id: recipient,
    created_by: userId,
    kind,
    title,
    body: note || `Status is now ${nextStatus.replace(/_/g, " ")}.`,
    county: submission.county,
  });
  if (error) console.error("[workflow] notification insert failed", error.message);
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
    return NextResponse.json({ ok: false, code: "load_failed", message: error.message }, { status: 422 });
  }
  return NextResponse.json({ ok: true, submissions: (data ?? []).map(mapSubmission) });
}
