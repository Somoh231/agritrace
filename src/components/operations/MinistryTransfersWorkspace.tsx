"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import OperationalWorkflowButton from "@/components/operations/OperationalWorkflowButton";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import type { OperationalChipVariant } from "@/lib/ops/operational-chip-types";
import { useTransferOrders } from "@/features/transfers/hooks/use-transfer-orders";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";
import { useOperationalActor } from "@/lib/ops/operational-actor-context";
import {
  canPerform,
  explainPermission,
  type OperationalPermissionContext,
  type OperationalWorkflowAction,
} from "@/lib/ops/permissions";
import { postTransferWorkflow } from "@/lib/ops/workflow-api-client";
import { operationalQueryKeys } from "@/platform/query-keys";

type TransferAuditEvt = { at: string; actor: string; stage: string; note: string };

export type TransferDetail = {
  raw: TransferOrderView;
  displayStatus: string;
  category: string;
  corridorCounty: string;
  manifestLines: string[];
  checkpoints: string[];
  receivingOfficer: string;
  gpsPlaceholder: string;
  auditEvents: TransferAuditEvt[];
  aiSummary: string;
  chips: OperationalChipVariant[];
};

export type TransferGridRow = Record<string, unknown> & { id: string; _detail: TransferDetail };

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

function transferActionToPermission(
  action: "approve" | "reject" | "escalate" | "dispatch" | "mark_received" | "verify" | "investigate",
): OperationalWorkflowAction {
  const m = {
    approve: "transfer.approve",
    reject: "transfer.reject",
    escalate: "transfer.escalate",
    dispatch: "transfer.dispatch",
    mark_received: "transfer.mark_received",
    verify: "transfer.verify",
    investigate: "transfer.investigate",
  } as const;
  return m[action];
}

function categoryForSku(sku: string): string {
  if (sku.includes("FERT")) return "Fertilizer transfer";
  if (sku.includes("SEED") || sku.includes("RICE")) return "Seed allocation";
  if (sku.includes("TOOL")) return "Equipment redistribution";
  return "County redistribution";
}

/** Ministry-facing labels (delivered → received, completed → verified). */
function displayStatus(st: TransferWorkflowStatus): string {
  switch (st) {
    case "delivered":
      return "received";
    case "completed":
      return "verified";
    default:
      return st.replace(/_/g, " ");
  }
}

function seedTimeline(t: TransferOrderView): TransferAuditEvt[] {
  const ev: TransferAuditEvt[] = [
    {
      at: t.requestedAt,
      actor: t.operatorLabel ?? "Corridor operator",
      stage: "requested",
      note: "Transfer request opened — custody chain initiated.",
    },
  ];
  if (t.approvedAt)
    ev.push({ at: t.approvedAt, actor: "County logistics", stage: "approved", note: "County sign-off recorded." });
  if (t.dispatchedAt)
    ev.push({ at: t.dispatchedAt, actor: "Warehouse dispatch", stage: "dispatched", note: "Seal applied — manifest locked." });
  if (t.deliveredAt)
    ev.push({ at: t.deliveredAt, actor: "Receiving bay", stage: "received", note: "Offload observed — variance check pending." });
  if (t.completedAt)
    ev.push({ at: t.completedAt, actor: "National reconcile", stage: "verified", note: "Ledger reconciled — dispute window closed." });
  return ev;
}

function checkpointsFor(t: TransferOrderView): string[] {
  return [
    `${t.fromMinistryCode} · dispatch weighbridge`,
    "County corridor attest",
    `${t.toMinistryCode} · receiving QA`,
    "Ministry manifest reconcile",
  ];
}

function chipsFor(t: TransferOrderView): OperationalChipVariant[] {
  const out: OperationalChipVariant[] = [];
  if (t.status === "disputed") out.push("high_risk");
  if (t.status === "requested" || t.status === "approved") out.push("awaiting_verification");
  if (t.status === "in_transit" || t.status === "dispatched") out.push("inventory_risk");
  if (t.status === "disputed") out.push("compliance_delay");
  return [...new Set(out)];
}

function aiLine(t: TransferOrderView): string {
  if (t.status === "disputed") return "Disputed custody leg — receiver sign-off missing; ministry investigation recommended.";
  if (t.status === "in_transit") return "In-transit fertilizer/inputs posture elevates corridor variance risk until seal verified.";
  if (t.status === "requested") return "Approval backlog detected — county logistics queue should close before national inputs window.";
  return "Corridor stable — maintain verification checkpoints and GPS stub linkage when field tablets sync.";
}

function toGridRow(t: TransferOrderView): TransferGridRow {
  const category = categoryForSku(t.sku);
  const corridorCounty = countyForCode(t.fromMinistryCode);
  const detail: TransferDetail = {
    raw: t,
    displayStatus: displayStatus(t.status),
    category,
    corridorCounty,
    manifestLines: [
      `${t.sku} · qty ${t.quantity} · batch ministry ledger`,
      `Operator: ${t.operatorLabel ?? "—"}`,
      t.notes ? `Notes: ${t.notes}` : "Notes: —",
    ],
    checkpoints: checkpointsFor(t),
    receivingOfficer: "Receiving officer · pending biometric attestation (stub)",
    gpsPlaceholder: "GPS route polyline placeholder — uplink pending from field logistics tablet.",
    auditEvents: seedTimeline(t),
    aiSummary: aiLine(t),
    chips: chipsFor(t),
  };
  return {
    id: t.id,
    transferCode: t.transferCode,
    category,
    corridorCounty,
    origin: t.fromMinistryCode,
    destination: t.toMinistryCode,
    sku: t.sku,
    quantity: String(t.quantity),
    status: detail.displayStatus,
    requestedAt: t.requestedAt,
    posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
    _detail: detail,
  };
}

export default function MinistryTransfersWorkspace() {
  const searchParams = useSearchParams();
  const codeFilter = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const queryClient = useQueryClient();
  const actor = useOperationalActor();
  const [workflowErr, setWorkflowErr] = React.useState<string | null>(null);
  const { data: orders = [], isPending, isError, error } = useTransferOrders();

  const rows = React.useMemo(() => orders.map(toGridRow), [orders]);

  const filteredRows = React.useMemo(
    () =>
      codeFilter ? rows.filter((r) => String(r.transferCode).toUpperCase().includes(codeFilter)) : rows,
    [rows, codeFilter],
  );

  const patchOrder = React.useCallback(
    (id: string, next: TransferWorkflowStatus, note: string) => {
      queryClient.setQueryData<TransferOrderView[]>(operationalQueryKeys.transfers.list(), (prev) =>
        (prev ?? []).map((o) => {
          if (o.id !== id) return o;
          const iso = new Date().toISOString();
          const patch: Partial<TransferOrderView> = { status: next };
          if (next === "approved") patch.approvedAt = iso;
          if (next === "dispatched") patch.dispatchedAt = iso;
          if (next === "delivered") patch.deliveredAt = iso;
          if (next === "completed") patch.completedAt = iso;
          return { ...o, ...patch, notes: note || o.notes };
        }),
      );
    },
    [queryClient],
  );

  const runWorkflow = React.useCallback(
    async (
      id: string,
      action: "approve" | "reject" | "escalate" | "dispatch" | "mark_received" | "verify" | "investigate",
    ) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      const ctx = transferOperationalContext(order);
      const perm = transferActionToPermission(action);
      if (!canPerform(actor, perm, ctx)) return;

      let next: TransferWorkflowStatus | null = null;
      let note = "";
      switch (action) {
        case "approve":
          next = "approved";
          note = "Approved — county logistics chain updated.";
          break;
        case "reject":
          next = "disputed";
          note = "Rejected — corridor investigation opened.";
          break;
        case "escalate":
          next = "disputed";
          note = "Escalated — ministry oversight engaged.";
          break;
        case "dispatch":
          next = "dispatched";
          note = "Dispatched — seal custody transferred.";
          break;
        case "mark_received":
          next = "delivered";
          note = "Receiving bay confirmation logged.";
          break;
        case "verify":
          next = "completed";
          note = "National reconcile verified.";
          break;
        case "investigate":
          next = "disputed";
          note = "Investigation assigned — custody preserved.";
          break;
        default:
          break;
      }
      if (!next) return;

      const key = operationalQueryKeys.transfers.list();
      const prev = queryClient.getQueryData<TransferOrderView[]>(key);
      setWorkflowErr(null);

      patchOrder(id, next, note);

      const result = await postTransferWorkflow({ transferId: id, action });

      if (!result.ok) {
        if (prev) queryClient.setQueryData(key, prev);
        setWorkflowErr(`Workflow denied (${result.code}) — ${result.message}`);
        return;
      }

      queryClient.setQueryData<TransferOrderView[]>(key, (curr) =>
        (curr ?? []).map((o) => (o.id === result.order.id ? result.order : o)),
      );
    },
    [actor, orders, patchOrder, queryClient],
  );

  const columns: GridColumn<TransferGridRow>[] = [
    { key: "transferCode", header: "Transfer ID", width: "140px" },
    { key: "category", header: "Corridor type" },
    { key: "corridorCounty", header: "Lane county" },
    { key: "origin", header: "Source WH" },
    { key: "destination", header: "Destination WH" },
    { key: "sku", header: "SKU" },
    { key: "quantity", header: "Qty" },
    { key: "status", header: "Status" },
    {
      key: "requestedAt",
      header: "Requested",
      render: (row) => <span className="font-mono text-[10px]">{String(row.requestedAt).slice(0, 19).replace("T", " ")}</span>,
    },
    {
      key: "posture",
      header: "Risk / posture",
      render: (row) => <OperationalRiskChipRow variants={row._detail.chips} />,
    },
  ];

  return (
    <MinistryPageShell
      title="National transfer trace"
      description="Ministry-grade fertilizer, seed, donor inventory, and redistribution custody — TRF-*-*-* identifiers, verification checkpoints, receiving attestations, and audit-grade workflow actions."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/gis-intelligence"
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-200 hover:bg-slate-900 inline-flex items-center"
          >
            GIS corridors
          </Link>
          <Link
            href="/inventory/transfers"
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-200 hover:bg-slate-900 inline-flex items-center"
          >
            Stock movement UI
          </Link>
        </div>
      }
    >
      {isError ?
        <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-4 py-3 text-[12px] text-rose-100">
          Could not load transfers — {error instanceof Error ? error.message : "unknown error"}.
        </div>
      : null}
      {isPending ?
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-[11px] text-slate-500">
          Loading corridor ledger…
        </div>
      : null}
      {codeFilter ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-[11px] text-slate-400">
          Filter: <span className="text-emerald-300">{codeFilter}</span> ·{" "}
          <Link href="/transfers" className="text-emerald-400 hover:text-emerald-300">
            Clear
          </Link>
        </div>
      ) : null}

      {actor.role === "donor_observer" ?
        <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-[11px] text-slate-400">
          Donor observer posture — corridor ledger read-only; custody mutations require logistics or county ministry roles.
        </div>
      : null}

      {workflowErr ?
        <div className="rounded-lg border border-rose-900/45 bg-rose-950/25 px-4 py-2 text-[11px] text-rose-100">
          {workflowErr}
        </div>
      : null}

      <EnterpriseDataGrid<TransferGridRow>
        title="TRF ledger · grouped by workflow status"
        rows={filteredRows}
        columns={columns}
        filename="national-transfers.csv"
        dense
        stickyHeader
        groupHeaderKey="status"
        groupHeaderTitle="Status"
        getRowKey={(row) => String(row.id)}
        toolbar={
          <span className="text-[11px] text-slate-500">
            DAO → CAC → Ministry and Warehouse → County → Ministry routing patterns · {filteredRows.length} legs in scope
          </span>
        }
        renderExpanded={(row) => {
          const d = row._detail;
          const t = d.raw;
          const tctx = transferOperationalContext(t);
          return (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Transfer manifest</div>
                  <ul className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                    {d.manifestLines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-black/25 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Shipment timeline</div>
                  <ol className="mt-2 space-y-2 border-l border-slate-700 pl-3">
                    {d.auditEvents.map((e, i) => (
                      <li key={`${e.at}-${i}`} className="relative text-[11px] text-slate-400">
                        <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-sky-600/80 ring-2 ring-slate-950" aria-hidden />
                        <span className="font-mono text-[10px] text-slate-500">{e.at.slice(0, 19).replace("T", " ")}</span>
                        <span className="text-slate-600"> · </span>
                        <span className="text-slate-300">{e.actor}</span> ({e.stage})
                        <div className="text-slate-500">{e.note}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-black/20 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Verification checkpoints</div>
                  <ul className="mt-2 list-inside list-disc text-[11px] text-slate-400">
                    {d.checkpoints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <div className="mt-3 text-[11px] text-slate-500">
                    Receiving officer: <span className="text-slate-300">{d.receivingOfficer}</span>
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-slate-600">{d.gpsPlaceholder}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-900/35 bg-emerald-950/15 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-500/80">AI corridor summary</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{d.aiSummary}</p>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Custody links</div>
                  <div className="mt-2 flex flex-col gap-2 text-[11px]">
                    <Link className="text-emerald-400 hover:text-emerald-300" href={`/inventory/warehouse/${encodeURIComponent(t.fromMinistryCode)}`}>
                      Source warehouse → {t.fromMinistryCode}
                    </Link>
                    <Link className="text-emerald-400 hover:text-emerald-300" href={`/inventory/warehouse/${encodeURIComponent(t.toMinistryCode)}`}>
                      Destination warehouse → {t.toMinistryCode}
                    </Link>
                    <Link className="text-emerald-400 hover:text-emerald-300" href={`/verification-queue?county=${encodeURIComponent(d.corridorCounty)}`}>
                      Linked verification queue ({d.corridorCounty})
                    </Link>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-black/30 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Workflow actions</div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Warehouse → County → Ministry custody chain. Actions emit audit_log entries when authenticated.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.approve", tctx)}
                      disabledReason={explainPermission(actor, "transfer.approve", tctx)}
                      onClick={() => void runWorkflow(t.id, "approve")}
                      className="rounded-md border border-emerald-800/50 bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-950/60"
                    >
                      Approve
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.dispatch", tctx)}
                      disabledReason={explainPermission(actor, "transfer.dispatch", tctx)}
                      onClick={() => void runWorkflow(t.id, "dispatch")}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800"
                    >
                      Dispatch
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.mark_received", tctx)}
                      disabledReason={explainPermission(actor, "transfer.mark_received", tctx)}
                      onClick={() => void runWorkflow(t.id, "mark_received")}
                      className="rounded-md border border-sky-900/40 bg-sky-950/25 px-2 py-1 text-[10px] text-sky-100 hover:bg-sky-950/40"
                    >
                      Mark received
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.verify", tctx)}
                      disabledReason={explainPermission(actor, "transfer.verify", tctx)}
                      onClick={() => void runWorkflow(t.id, "verify")}
                      className="rounded-md border border-emerald-900/35 bg-emerald-950/25 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-950/45"
                    >
                      Verify reconcile
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.reject", tctx)}
                      disabledReason={explainPermission(actor, "transfer.reject", tctx)}
                      onClick={() => void runWorkflow(t.id, "reject")}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800"
                    >
                      Reject
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.escalate", tctx)}
                      disabledReason={explainPermission(actor, "transfer.escalate", tctx)}
                      onClick={() => void runWorkflow(t.id, "escalate")}
                      className="rounded-md border border-orange-900/45 bg-orange-950/25 px-2 py-1 text-[10px] text-orange-100 hover:bg-orange-950/40"
                    >
                      Escalate
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "transfer.investigate", tctx)}
                      disabledReason={explainPermission(actor, "transfer.investigate", tctx)}
                      onClick={() => void runWorkflow(t.id, "investigate")}
                      className="rounded-md border border-violet-900/40 bg-violet-950/25 px-2 py-1 text-[10px] text-violet-100 hover:bg-violet-950/40"
                    >
                      Assign investigation
                    </OperationalWorkflowButton>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />
    </MinistryPageShell>
  );
}
