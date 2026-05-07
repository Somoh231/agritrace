"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import OperationalWorkflowButton from "@/components/operations/OperationalWorkflowButton";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import { useVerificationQueue } from "@/features/verification/hooks/use-verification-queue";
import type {
  VerificationGridRow,
  VerificationQueueDetail,
  VerificationQueueStatus,
} from "@/features/verification/model/types";
import { useOperationalActor } from "@/lib/ops/operational-actor-context";
import {
  canPerform,
  explainPermission,
  type OperationalPermissionContext,
  type OperationalWorkflowAction,
} from "@/lib/ops/permissions";
import { logWorkflowAudit } from "@/lib/ops/workflow-audit-client";
import { operationalQueryKeys } from "@/platform/query-keys";

function fmtStatus(s: VerificationQueueStatus): string {
  return s.replace(/_/g, " ");
}

function AuditTimelineStrip({ events }: { events: VerificationQueueDetail["auditTimeline"] }) {
  return (
    <div className="rounded-lg border border-slate-700/80 bg-black/25 p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Audit timeline</div>
      <ol className="mt-2 space-y-2 border-l border-slate-700 pl-3">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="relative text-[11px] text-slate-400">
            <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-emerald-600/80 ring-2 ring-slate-950" aria-hidden />
            <span className="font-mono text-[10px] text-slate-500">{new Date(e.at).toISOString().slice(0, 16).replace("T", " ")}</span>
            <span className="text-slate-600"> · </span>
            <span className="text-slate-300">{e.actor}</span>
            <span className="text-slate-600"> ({e.stage})</span>
            <div className="mt-0.5 text-slate-500">{e.note}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function verificationContext(row: VerificationGridRow): OperationalPermissionContext {
  return {
    rowCounty: String(row.county),
    verificationSubmissionType: row._detail.submissionType,
    verificationStatus: row._detail.status,
    relatedWarehouseMinistryCode: row._detail.relatedWarehouse,
  };
}

export default function VerificationQueueWorkspace() {
  const searchParams = useSearchParams();
  const countyFilter = searchParams.get("county")?.trim() ?? "";
  const queryClient = useQueryClient();
  const actor = useOperationalActor();

  const { data: rows = [], isPending, isError, error } = useVerificationQueue();

  const filteredRows = React.useMemo(
    () =>
      countyFilter ? rows.filter((r) => String(r.county).toLowerCase() === countyFilter.toLowerCase()) : rows,
    [rows, countyFilter],
  );

  const patchDetail = React.useCallback(
    (id: string, fn: (d: VerificationQueueDetail) => VerificationQueueDetail) => {
      queryClient.setQueryData<VerificationGridRow[]>(operationalQueryKeys.verification.queue(), (prev) =>
        (prev ?? []).map((r) => {
          if (r.id !== id) return r;
          const d = fn({ ...r._detail });
          return {
            ...r,
            status: fmtStatus(d.status),
            verificationAge: r.verificationAge,
            posture: d.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
            _detail: d,
          };
        }),
      );
    },
    [queryClient],
  );

  const runAction = React.useCallback(
    async (
      id: string,
      action: "approve" | "reject" | "escalate" | "revision" | "investigate",
      reviewerLabel: string,
      note?: string,
    ) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      const vctx = verificationContext(row);
      const permByUi: Record<typeof action, OperationalWorkflowAction> = {
        approve: "verification.approve",
        reject: "verification.reject",
        escalate: "verification.escalate",
        revision: "verification.request_revision",
        investigate: "verification.assign_investigation",
      };
      const perm = permByUi[action];
      if (!canPerform(actor, perm, vctx)) return;

      const iso = new Date().toISOString();
      const reviewer = reviewerLabel || "Reviewer";
      let nextStatus: VerificationQueueStatus | null = null;
      let auditNote = "";
      switch (action) {
        case "approve":
          nextStatus = "verified";
          auditNote = note?.trim() || "Approved — ministry attestation recorded.";
          break;
        case "reject":
          nextStatus = "rejected";
          auditNote = note?.trim() || "Rejected — returned to DAO with disposition code.";
          break;
        case "escalate":
          nextStatus = "escalated";
          auditNote = note?.trim() || "Escalated to ministry oversight desk.";
          break;
        case "revision":
          nextStatus = "under_review";
          auditNote = note?.trim() || "Revision requested — DAO packet incomplete.";
          break;
        case "investigate":
          nextStatus = "escalated";
          auditNote = note?.trim() || "Investigation assigned — custody chain preserved.";
          break;
        default:
          break;
      }
      if (!nextStatus) return;

      patchDetail(id, (d) => ({
        ...d,
        status: nextStatus!,
        auditTimeline: [...d.auditTimeline, { at: iso, actor: reviewer, stage: "workflow", note: auditNote }],
      }));

      await logWorkflowAudit({
        action: `verification_${action}`,
        tableHint: "verification_queue",
        recordRef: id,
        detail: { next_status: nextStatus, note: auditNote },
      });
    },
    [actor, patchDetail, rows],
  );

  const columns: GridColumn<VerificationGridRow>[] = [
    { key: "id", header: "ID", width: "120px" },
    { key: "county", header: "County" },
    { key: "district", header: "District" },
    { key: "dao", header: "DAO" },
    { key: "submissionType", header: "Submission type" },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (row) => (
        <span className="font-mono text-[10px] text-slate-300">{String(row.timestamp).replace("T", " ").slice(0, 19)}</span>
      ),
    },
    { key: "priority", header: "Priority" },
    { key: "status", header: "Status" },
    { key: "verificationAge", header: "Verification age" },
    { key: "assignedReviewer", header: "Assigned reviewer" },
    {
      key: "posture",
      header: "Risk / posture",
      render: (row) => <OperationalRiskChipRow variants={row._detail.chips} />,
    },
  ];

  const exportAuditBundle = React.useCallback(() => {
    const bundle = filteredRows.map((r) => ({
      id: r.id,
      county: r.county,
      submissionType: r.submissionType,
      status: r.status,
      audit: r._detail.auditTimeline,
    }));
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verification-audit-bundle.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  const exportAllowed = canPerform(actor, "donor.export_audit_bundle");

  return (
    <MinistryPageShell
      title="Verification queue"
      description="National coordination queue — farmer registry, DAO inspections, subsidy attestations, warehouse transfer confirmations, donor manifests, and GPS reconciliation. Expand rows for audit posture, workflow routing, and reviewer actions."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/gis-intelligence"
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-200 hover:bg-slate-900 inline-flex items-center"
          >
            GIS linkage
          </Link>
          <OperationalWorkflowButton
            allowed={exportAllowed}
            disabledReason={explainPermission(actor, "donor.export_audit_bundle")}
            onClick={exportAuditBundle}
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-200 hover:bg-slate-900"
          >
            Export audit JSON
          </OperationalWorkflowButton>
        </div>
      }
    >
      {actor.role === "donor_observer" ?
        <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-[11px] text-slate-400">
          Donor observer posture — queue visibility read-only; workflow mutations require ministry or county custody roles.
        </div>
      : null}

      {countyFilter ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-[11px] text-slate-400">
          County scope: <span className="text-emerald-300">{countyFilter}</span> ·{" "}
          <Link href="/verification-queue" className="text-emerald-400 hover:text-emerald-300">
            Clear filter
          </Link>
        </div>
      ) : null}

      {isError ?
        <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-4 py-3 text-[12px] text-rose-100">
          Verification ledger unavailable — {error instanceof Error ? error.message : "unknown error"}.
        </div>
      : null}
      {isPending ?
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-[11px] text-slate-500">
          Loading unified verification ledger…
        </div>
      : null}

      <EnterpriseDataGrid<VerificationGridRow>
        title="Unified verification ledger"
        rows={filteredRows}
        columns={columns}
        filename="verification-queue.csv"
        dense
        stickyHeader
        groupHeaderKey="county"
        groupHeaderTitle="County"
        getRowKey={(row) => String(row.id)}
        toolbar={
          <span className="text-[11px] text-slate-500">
            {filteredRows.length} artefacts in scope · grouped by county · institutional dense mode
          </span>
        }
        renderExpanded={(row) => {
          const d = row._detail;
          const reviewer = String(row.assignedReviewer ?? "Reviewer");
          const vctx = verificationContext(row);

          return (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Operational narrative</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{d.narrativeSummary}</p>
                  <p className="mt-2 font-mono text-[10px] text-slate-500">{d.routingCaption}</p>
                </div>
                <AuditTimelineStrip events={d.auditTimeline} />
                <div className="rounded-lg border border-slate-700/80 bg-black/20 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Submission metadata</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {Object.entries(d.metadata).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt className="text-slate-600">{k}</dt>
                        <dd className="text-slate-300">{v}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-black/20 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Attachments (placeholders)</div>
                  <ul className="mt-2 list-inside list-disc text-[11px] text-slate-500">
                    {d.attachmentPlaceholders.map((a) => (
                      <li key={a} className="font-mono">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/15 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-500/80">AI operational summary</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{d.aiSummary}</p>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-black/25 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Custody & linkage</div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Related warehouse:{" "}
                    {d.relatedWarehouse ? (
                      <Link href={`/inventory/warehouse/${encodeURIComponent(d.relatedWarehouse)}`} className="font-mono text-emerald-400 hover:text-emerald-300">
                        {d.relatedWarehouse}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Linked farmers:{" "}
                    <span className="font-mono text-slate-300">{d.linkedFarmers.length ? d.linkedFarmers.join(", ") : "—"}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                    {d.operationalNotes.map((n) => (
                      <li key={n}>• {n}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Workflow actions</div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    DAO → CAO → Ministry patterns enforced via reviewer attribution and audit_log inserts (best-effort).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "verification.approve", vctx)}
                      disabledReason={explainPermission(actor, "verification.approve", vctx)}
                      onClick={() => void runAction(String(row.id), "approve", reviewer)}
                      className="rounded-md border border-emerald-800/50 bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-950/60"
                    >
                      Approve
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "verification.reject", vctx)}
                      disabledReason={explainPermission(actor, "verification.reject", vctx)}
                      onClick={() => void runAction(String(row.id), "reject", reviewer)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800"
                    >
                      Reject
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "verification.escalate", vctx)}
                      disabledReason={explainPermission(actor, "verification.escalate", vctx)}
                      onClick={() => void runAction(String(row.id), "escalate", reviewer)}
                      className="rounded-md border border-orange-900/45 bg-orange-950/25 px-2 py-1 text-[10px] text-orange-100 hover:bg-orange-950/40"
                    >
                      Escalate
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "verification.request_revision", vctx)}
                      disabledReason={explainPermission(actor, "verification.request_revision", vctx)}
                      onClick={() => void runAction(String(row.id), "revision", reviewer)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800"
                    >
                      Request revision
                    </OperationalWorkflowButton>
                    <OperationalWorkflowButton
                      allowed={canPerform(actor, "verification.assign_investigation", vctx)}
                      disabledReason={explainPermission(actor, "verification.assign_investigation", vctx)}
                      onClick={() => void runAction(String(row.id), "investigate", reviewer)}
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
