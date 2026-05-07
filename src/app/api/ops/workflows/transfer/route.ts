import { NextResponse } from "next/server";

import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { findTransferOrderServer } from "@/lib/logistics/transfer-repository-server";
import {
  computeTransferWorkflowTransition,
  transferMutationToPermissionAction,
  type TransferWorkflowMutation,
} from "@/lib/logistics/transfer-workflow-transitions";
import type { TransferOrderView } from "@/lib/logistics/types";
import { canPerform, explainPermission, type OperationalPermissionContext } from "@/lib/ops/permissions";
import { requireWorkflowPrincipal, workflowScopeFailure } from "@/lib/ops/server-permissions";
import { persistOperationalWorkflowEvent, persistWorkflowAuditLog } from "@/lib/ops/server-workflow-io";

function countyForCode(code: string): string {
  return MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code)?.county ?? "—";
}

function transferOperationalContext(order: TransferOrderView): OperationalPermissionContext {
  const corridorCounty = countyForCode(order.fromMinistryCode);
  return {
    rowCounty: corridorCounty,
    transfer: {
      fromMinistryCode: order.fromMinistryCode,
      toMinistryCode: order.toMinistryCode,
      status: order.status,
      corridorCounty,
    },
  };
}

function isPersistableSupabasePk(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
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

  let body: { transferId?: string; action?: string; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }

  const transferId = typeof body.transferId === "string" ? body.transferId.trim() : "";
  const rawAction = typeof body.action === "string" ? body.action.trim() : "";

  const actions = new Set<TransferWorkflowMutation>([
    "approve",
    "reject",
    "dispatch",
    "mark_received",
    "verify",
    "escalate",
    "investigate",
    "dispute",
  ]);

  if (!transferId || !actions.has(rawAction as TransferWorkflowMutation)) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "transferId and a valid action are required." },
      { status: 400 },
    );
  }
  const action = rawAction as TransferWorkflowMutation;

  const order = await findTransferOrderServer(principal.supabase, transferId);
  if (!order) {
    return NextResponse.json({ ok: false, code: "not_found", message: "Transfer order not found in corridor ledger." }, { status: 404 });
  }

  const permAction = transferMutationToPermissionAction(action);
  const pctx = transferOperationalContext(order);

  if (!canPerform(principal.actor, permAction, pctx)) {
    return NextResponse.json(
      {
        ok: false,
        code: "forbidden",
        message: explainPermission(principal.actor, permAction, pctx),
      },
      { status: 403 },
    );
  }

  const tr = computeTransferWorkflowTransition(order, action);
  if ("error" in tr) {
    return NextResponse.json({ ok: false, code: "invalid_transition", message: tr.error }, { status: 422 });
  }

  const extraNote = typeof body.note === "string" && body.note.trim() ? body.note.trim() : "";
  const mergedNotes = extraNote ? `${tr.notes} · ${extraNote}` : tr.notes;

  const nextOrder: TransferOrderView = {
    ...order,
    status: tr.nextStatus,
    notes: mergedNotes,
    approvedAt: tr.timestamps.approvedAt ?? order.approvedAt ?? null,
    dispatchedAt: tr.timestamps.dispatchedAt ?? order.dispatchedAt ?? null,
    deliveredAt: tr.timestamps.deliveredAt ?? order.deliveredAt ?? null,
    completedAt: tr.timestamps.completedAt ?? order.completedAt ?? null,
  };

  let persisted = false;
  if (order.source === "supabase" && isPersistableSupabasePk(order.id)) {
    const patch: Record<string, unknown> = {
      status: tr.nextStatus,
      notes: mergedNotes,
      updated_at: new Date().toISOString(),
    };
    if (tr.timestamps.approvedAt) patch.approved_at = tr.timestamps.approvedAt;
    if (tr.timestamps.dispatchedAt) patch.dispatched_at = tr.timestamps.dispatchedAt;
    if (tr.timestamps.deliveredAt) patch.delivered_at = tr.timestamps.deliveredAt;
    if (tr.timestamps.completedAt) patch.completed_at = tr.timestamps.completedAt;

    const { error: updErr } = await principal.supabase.from("warehouse_transfer_orders").update(patch).eq("id", order.id);
    if (updErr) {
      console.error("[workflow] transfer persist failed", updErr.message);
      return NextResponse.json(
        {
          ok: false,
          code: "persist_failed",
          message: "Could not persist transfer status — verify Supabase permissions and row integrity.",
        },
        { status: 422 },
      );
    }
    persisted = true;
  }

  const auditLabel =
    action === "dispute"
      ? "transfer_dispute"
      : action === "mark_received"
        ? "transfer_mark_received"
        : `transfer_${action}`;

  await persistWorkflowAuditLog({
    supabase: principal.supabase,
    userId: principal.userId,
    action: auditLabel,
    tableHint: "warehouse_transfer_orders",
    recordRef: order.transferCode,
    detail: {
      next_status: tr.nextStatus,
      internal_id: order.id,
      persisted,
      note: typeof body.note === "string" ? body.note : null,
    },
  });

  const laneCounty = countyForCode(order.fromMinistryCode);

  await persistOperationalWorkflowEvent({
    supabase: principal.supabase,
    eventType: "transfer_workflow",
    severity: tr.nextStatus === "disputed" ? "High" : "Medium",
    county: laneCounty !== "—" ? laneCounty : null,
    message: `${auditLabel.replace(/_/g, " ")} · ${order.transferCode} (${order.fromMinistryCode} → ${order.toMinistryCode})`,
    codePrefix: "EVT-WF-TRF",
  });

  return NextResponse.json({ ok: true, order: nextOrder, persisted });
}
