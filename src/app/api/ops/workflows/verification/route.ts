import { NextResponse } from "next/server";

import { applyVerificationWorkflowMutation, type VerificationWorkflowMutation } from "@/features/verification/utils/workflow-mutations";
import { buildUnifiedVerificationQueue } from "@/lib/ops/ministry-verification-queue-data";
import { canPerform, explainPermission, type OperationalWorkflowAction } from "@/lib/ops/permissions";
import { requireWorkflowPrincipal, workflowScopeFailure } from "@/lib/ops/server-permissions";
import { persistOperationalWorkflowEvent, persistWorkflowAuditLog } from "@/lib/ops/server-workflow-io";

function verificationPermissionAction(action: VerificationWorkflowMutation): OperationalWorkflowAction {
  const m: Record<VerificationWorkflowMutation, OperationalWorkflowAction> = {
    approve: "verification.approve",
    reject: "verification.reject",
    escalate: "verification.escalate",
    revision: "verification.request_revision",
    investigate: "verification.assign_investigation",
  };
  return m[action];
}

function verificationPermissionContext(row: ReturnType<typeof buildUnifiedVerificationQueue>[number]) {
  return {
    rowCounty: String(row.county),
    verificationSubmissionType: row._detail.submissionType,
    verificationStatus: row._detail.status,
    relatedWarehouseMinistryCode: row._detail.relatedWarehouse,
  };
}

export async function POST(req: Request) {
  const principal = await requireWorkflowPrincipal();
  if (!principal.ok) {
    return NextResponse.json(
      { ok: false, code: principal.code, message: principal.message },
      { status: principal.status },
    );
  }

  const scopeDenied = workflowScopeFailure(principal.actor);
  if (scopeDenied) {
    return NextResponse.json({ ok: false, code: scopeDenied.code, message: scopeDenied.message }, { status: 403 });
  }

  let body: { verificationId?: string; action?: string; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }

  const verificationId = typeof body.verificationId === "string" ? body.verificationId.trim() : "";
  const note = typeof body.note === "string" ? body.note : undefined;
  const rawAction = typeof body.action === "string" ? body.action.trim() : "";

  const actions = new Set<VerificationWorkflowMutation>(["approve", "reject", "escalate", "revision", "investigate"]);
  if (!verificationId || !actions.has(rawAction as VerificationWorkflowMutation)) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "verificationId and a valid action are required." },
      { status: 400 },
    );
  }
  const action = rawAction as VerificationWorkflowMutation;

  const queue = buildUnifiedVerificationQueue();
  const row = queue.find((r) => String(r.id) === verificationId);
  if (!row) {
    return NextResponse.json({ ok: false, code: "not_found", message: "Verification artefact not found in ministry ledger." }, { status: 404 });
  }

  const perm = verificationPermissionAction(action);
  const ctx = verificationPermissionContext(row);

  if (!canPerform(principal.actor, perm, ctx)) {
    return NextResponse.json(
      {
        ok: false,
        code: "forbidden",
        message: explainPermission(principal.actor, perm, ctx),
      },
      { status: 403 },
    );
  }

  const reviewer = principal.actor.displayName?.trim() || "Reviewer";
  const nextRow = applyVerificationWorkflowMutation({
    row,
    action,
    reviewerLabel: reviewer,
    note,
  });

  if ("error" in nextRow && !("_detail" in nextRow)) {
    return NextResponse.json({ ok: false, code: "invalid_transition", message: nextRow.error }, { status: 422 });
  }

  const auditAction = `verification_${action}`;
  await persistWorkflowAuditLog({
    supabase: principal.supabase,
    userId: principal.userId,
    action: auditAction,
    tableHint: "verification_queue",
    recordRef: verificationId,
    detail: {
      next_status: nextRow._detail.status,
      county: row.county,
      submission_type: row._detail.submissionType,
      note: note ?? null,
    },
  });

  await persistOperationalWorkflowEvent({
    supabase: principal.supabase,
    eventType: "verification_workflow",
    severity: action === "escalate" || action === "investigate" ? "High" : "Medium",
    county: String(row.county ?? ""),
    district: row._detail.district ?? null,
    message: `${auditAction.replace(/_/g, " ")} · ${verificationId} (${row._detail.submissionTypeLabel})`,
    codePrefix: "EVT-WF-VRF",
  });

  return NextResponse.json({ ok: true, row: nextRow });
}
