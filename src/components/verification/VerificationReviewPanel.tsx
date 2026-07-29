"use client";

import Link from "next/link";

import { AlertCard, Timeline } from "@/components/enterprise";
import OperationalWorkflowButton from "@/components/operations/OperationalWorkflowButton";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import { verificationOperationalContext } from "@/components/verification/verification-workspace-utils";
import type { VerificationGridRow } from "@/features/verification/model/types";
import {
  canPerform,
  explainPermission,
  type OperationalActor,
} from "@/lib/ops/permissions";

export default function VerificationReviewPanel({
  row,
  actor,
  onAction,
}: {
  row: VerificationGridRow;
  actor: OperationalActor;
  onAction: (
    id: string,
    action: "approve" | "reject" | "escalate" | "revision" | "investigate",
    reviewerLabel: string,
  ) => void;
}) {
  const d = row._detail;
  const reviewer = String(row.assignedReviewer ?? "Reviewer");
  const vctx = verificationOperationalContext(row);
  const liveBacked = Boolean(d.submissionId && /^[0-9a-f-]{36}$/i.test(d.submissionId));
  const disabledReason = "Pilot training artefact — read-only. Workflow decisions require a live operational submission.";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Operational narrative</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{d.narrativeSummary}</p>
          <p className="mt-2 font-mono text-[10px] text-slate-500">{d.routingCaption}</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Audit timeline</p>
          <Timeline
            className="mt-3"
            items={d.auditTimeline.map((e, i) => ({
              id: `${e.at}-${i}`,
              title: `${e.actor} · ${e.stage}`,
              meta: e.note,
              time: new Date(e.at).toISOString().slice(0, 16).replace("T", " "),
              tone: e.stage === "workflow" ? "success" : "default",
            }))}
          />
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Submission metadata</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            {Object.entries(d.metadata).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Attachments (placeholders)</p>
          <ul className="mt-2 list-inside list-disc text-[12px] text-slate-600">
            {d.attachmentPlaceholders.map((a) => (
              <li key={a} className="font-mono">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <AlertCard tone="success" title="AI operational summary">
          {d.aiSummary}
        </AlertCard>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Custody & linkage</p>
          <p className="mt-2 text-[12px] text-slate-600">
            Related warehouse:{" "}
            {d.relatedWarehouse ? (
              <Link
                href={`/inventory/warehouse/${encodeURIComponent(d.relatedWarehouse)}`}
                className="font-mono font-medium text-forest-700 hover:underline"
              >
                {d.relatedWarehouse}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p className="mt-2 text-[12px] text-slate-600">
            Linked farmers:{" "}
            <span className="font-mono text-slate-800">{d.linkedFarmers.length ? d.linkedFarmers.join(", ") : "—"}</span>
          </p>
          <div className="mt-3">
            <OperationalRiskChipRow variants={d.chips} />
          </div>
          <ul className="mt-3 space-y-1 text-[12px] text-slate-600">
            {d.operationalNotes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Workflow actions</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {liveBacked
              ? "DAO → CAC → Ministry decisions persist through the audited workflow engine."
              : "Pilot training artefact · read-only. No decision is written for illustrative rows."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <OperationalWorkflowButton
              allowed={liveBacked && canPerform(actor, "verification.approve", vctx)}
              disabledReason={liveBacked ? explainPermission(actor, "verification.approve", vctx) : disabledReason}
              onClick={() => void onAction(String(row.id), "approve", reviewer)}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Approve
            </OperationalWorkflowButton>
            <OperationalWorkflowButton
              allowed={liveBacked && canPerform(actor, "verification.reject", vctx)}
              disabledReason={liveBacked ? explainPermission(actor, "verification.reject", vctx) : disabledReason}
              onClick={() => void onAction(String(row.id), "reject", reviewer)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Reject
            </OperationalWorkflowButton>
            <OperationalWorkflowButton
              allowed={liveBacked && canPerform(actor, "verification.escalate", vctx)}
              disabledReason={liveBacked ? explainPermission(actor, "verification.escalate", vctx) : disabledReason}
              onClick={() => void onAction(String(row.id), "escalate", reviewer)}
              className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
            >
              Escalate
            </OperationalWorkflowButton>
            <OperationalWorkflowButton
              allowed={liveBacked && canPerform(actor, "verification.request_revision", vctx)}
              disabledReason={liveBacked ? explainPermission(actor, "verification.request_revision", vctx) : disabledReason}
              onClick={() => void onAction(String(row.id), "revision", reviewer)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Request revision
            </OperationalWorkflowButton>
            <OperationalWorkflowButton
              allowed={liveBacked && canPerform(actor, "verification.assign_investigation", vctx)}
              disabledReason={liveBacked ? explainPermission(actor, "verification.assign_investigation", vctx) : disabledReason}
              onClick={() => void onAction(String(row.id), "investigate", reviewer)}
              className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-medium text-violet-800 hover:bg-violet-100"
            >
              Assign investigation
            </OperationalWorkflowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
