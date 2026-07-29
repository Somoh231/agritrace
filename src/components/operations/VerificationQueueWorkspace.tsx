"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Map } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceBadge,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import OperationalWorkflowButton from "@/components/operations/OperationalWorkflowButton";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import { RegistryKpiStrip } from "@/components/registry";
import VerificationReviewPanel from "@/components/verification/VerificationReviewPanel";
import VerificationStatusPipeline from "@/components/verification/VerificationStatusPipeline";
import {
  buildVerificationStatusCounts,
  fmtVerificationStatus,
  verificationOperationalContext,
  verificationPriorityTone,
  verificationStatusTone,
} from "@/components/verification/verification-workspace-utils";
import { useVerificationQueue } from "@/features/verification/hooks/use-verification-queue";
import type { VerificationQueueResult } from "@/features/verification/repositories/verification-repository";
import type {
  VerificationGridRow,
  VerificationQueueDetail,
  VerificationQueueStatus,
} from "@/features/verification/model/types";
import { useOperationalActor } from "@/lib/ops/operational-actor-context";
import {
  canPerform,
  explainPermission,
  type OperationalWorkflowAction,
} from "@/lib/ops/permissions";
import { postWorkflowAction } from "@/lib/workflow/client";
import type { WorkflowAction } from "@/lib/workflow/status-model";
import { operationalQueryKeys } from "@/platform/query-keys";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function verificationActionToWorkflow(action: "approve" | "reject" | "escalate" | "revision" | "investigate"): WorkflowAction {
  if (action === "revision") return "request_corrections";
  if (action === "investigate") return "assign_reviewer";
  return action;
}

export default function VerificationQueueWorkspace() {
  const searchParams = useSearchParams();
  const countyFilter = searchParams.get("county")?.trim() ?? "";
  const queryClient = useQueryClient();
  const actor = useOperationalActor();
  const [workflowErr, setWorkflowErr] = React.useState<string | null>(null);

  const { data: queueResult, isPending, isError, error } = useVerificationQueue();
  const rows = React.useMemo(() => queueResult?.data ?? [], [queueResult]);
  const queueSource = queueResult?.source;

  const filteredRows = React.useMemo(
    () =>
      countyFilter ? rows.filter((r) => String(r.county).toLowerCase() === countyFilter.toLowerCase()) : rows,
    [rows, countyFilter],
  );

  const statusCounts = React.useMemo(() => buildVerificationStatusCounts(rows), [rows]);
  const pendingReview = rows.filter((r) => r._detail.status === "pending" || r._detail.status === "under_review").length;
  const escalated = rows.filter((r) => r._detail.status === "escalated").length;
  const critical = rows.filter((r) => r._detail.priority === "critical").length;

  const patchDetail = React.useCallback(
    (id: string, fn: (d: VerificationQueueDetail) => VerificationQueueDetail) => {
      queryClient.setQueryData<VerificationQueueResult>(operationalQueryKeys.verification.queue(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((r) => {
            if (r.id !== id) return r;
            const d = fn({ ...r._detail });
            return {
              ...r,
              status: fmtVerificationStatus(d.status),
              verificationAge: r.verificationAge,
              posture: d.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
              _detail: d,
            };
          }),
        };
      });
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
      const liveSubmissionId = row._detail.submissionId;
      if (!liveSubmissionId || !UUID_RE.test(liveSubmissionId)) {
        setWorkflowErr("Pilot training artefacts are read-only. Create or select a live operational submission to record a decision.");
        return;
      }
      const vctx = verificationOperationalContext(row);
      const permByUi: Record<typeof action, OperationalWorkflowAction> = {
        approve: "verification.approve",
        reject: "verification.reject",
        escalate: "verification.escalate",
        revision: "verification.request_revision",
        investigate: "verification.assign_investigation",
      };
      const perm = permByUi[action];
      if (!canPerform(actor, perm, vctx)) return;

      const key = operationalQueryKeys.verification.queue();
      const prev = queryClient.getQueryData<VerificationQueueResult>(key);
      setWorkflowErr(null);

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

      const wf = await postWorkflowAction({
        action: verificationActionToWorkflow(action),
        submissionId: liveSubmissionId,
        note: note?.trim() || auditNote,
      });
      if (!wf.ok) {
        if (prev) queryClient.setQueryData(key, prev);
        setWorkflowErr(`Workflow denied (${wf.code}) — ${wf.message}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: key });
    },
    [actor, patchDetail, queryClient, rows],
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
        <span className="font-mono text-[10px] text-slate-600">{String(row.timestamp).replace("T", " ").slice(0, 19)}</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <StatusBadge tone={verificationPriorityTone(String(row.priority))}>{String(row.priority)}</StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge tone={verificationStatusTone(row._detail.status)}>{String(row.status)}</StatusBadge>
      ),
    },
    { key: "verificationAge", header: "Age" },
    { key: "assignedReviewer", header: "Reviewer" },
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
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Operational review · National coordination"
        title="Verification queue"
        description="National coordination queue — farmer registry, DAO inspections, subsidy attestations, warehouse transfer confirmations, donor manifests, and GPS reconciliation. Expand rows for audit posture, workflow routing, and reviewer actions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/map" className="btn-gov-outline inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[12px]">
              <Map className="h-4 w-4" aria-hidden />
              Operational map
            </Link>
            <OperationalWorkflowButton
              allowed={exportAllowed}
              disabledReason={explainPermission(actor, "donor.export_audit_bundle")}
              onClick={exportAuditBundle}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Export audit JSON
            </OperationalWorkflowButton>
          </div>
        }
      />

      {queueSource ? <DataSourceBadge source={queueSource} className="block w-fit" /> : null}

      {actor.role === "donor_observer" ? (
        <AlertCard tone="info" title="Donor observer posture">
          Queue visibility is read-only; workflow mutations require ministry or county custody roles.
        </AlertCard>
      ) : null}

      {workflowErr ? <AlertCard tone="danger" title="Workflow error">{workflowErr}</AlertCard> : null}

      {countyFilter ? (
        <AlertCard tone="info" title="County scope filter">
          Showing artefacts for <strong>{countyFilter}</strong>.{" "}
          <Link href="/verification-queue" className="font-medium text-forest-700 hover:underline">
            Clear filter
          </Link>
        </AlertCard>
      ) : null}

      {isError ? (
        <AlertCard tone="danger" title="Verification ledger unavailable">
          {error instanceof Error ? error.message : "Unknown error loading verification queue."}
        </AlertCard>
      ) : null}

      <RegistryKpiStrip
        items={[
          { label: "Artefacts in scope", value: String(filteredRows.length), hint: "Current filter" },
          { label: "Pending review", value: String(pendingReview), hint: "Pending + under review", deltaTone: pendingReview > 0 ? "down" : "up" },
          { label: "Escalated", value: String(escalated), hint: "Ministry oversight", deltaTone: escalated > 0 ? "down" : "neutral" },
          { label: "Critical priority", value: String(critical), hint: "Requires immediate action", deltaTone: critical > 0 ? "down" : "up" },
        ]}
      />

      <DashboardPanel>
        <SectionHeader kicker="Queue" title="Verification status pipeline" subtitle="National workflow posture across all submission types" />
        {isPending ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="mt-4">
            <VerificationStatusPipeline counts={statusCounts} />
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader
            kicker="Review desk"
            title="Unified verification ledger"
            subtitle={`${filteredRows.length} artefacts · grouped by county`}
          />
        </div>

        {isPending ? (
          <div className="space-y-2 p-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No verification artefacts in scope"
              description="Adjust county filters or return when new DAO submissions arrive from field capture."
              action={
                <Link href="/reporting/workspace?tab=review" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                  Reporting workspace
                </Link>
              }
            />
          </div>
        ) : (
          <EnterpriseDataGrid<VerificationGridRow>
            rows={filteredRows}
            columns={columns}
            filename="verification-queue.csv"
            dense
            theme="light"
            stickyHeader
            groupHeaderKey="county"
            groupHeaderTitle="County"
            getRowKey={(row) => String(row.id)}
            toolbar={
              <span className="text-[11px] text-slate-500">
                {filteredRows.length} artefacts in scope · grouped by county
              </span>
            }
            renderExpanded={(row) => (
              <VerificationReviewPanel row={row} actor={actor} onAction={(id, action, reviewer) => void runAction(id, action, reviewer)} />
            )}
          />
        )}
      </DashboardPanel>
    </div>
  );
}
