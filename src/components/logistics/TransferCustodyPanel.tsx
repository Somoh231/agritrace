"use client";

import Link from "next/link";

import { AlertCard, Timeline } from "@/components/enterprise";
import OperationalWorkflowButton from "@/components/operations/OperationalWorkflowButton";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import type { TransferDetail } from "@/components/logistics/transfer-workspace-utils";
import type { OperationalActor } from "@/lib/ops/permissions";
import {
  canPerform,
  explainPermission,
} from "@/lib/ops/permissions";
import {
  transferOperationalContext,
} from "@/components/logistics/transfer-workspace-utils";

export default function TransferCustodyPanel({
  detail,
  actor,
  onWorkflow,
}: {
  detail: TransferDetail;
  actor: OperationalActor;
  onWorkflow: (
    id: string,
    action: "approve" | "reject" | "escalate" | "dispatch" | "mark_received" | "verify" | "investigate",
  ) => void;
}) {
  const t = detail.raw;
  const tctx = transferOperationalContext(t);
  const liveBacked = t.source === "supabase" && /^[0-9a-f-]{36}$/i.test(t.id);
  const readOnlyReason =
    "Canonical/offline transfer example — read-only in the national ledger. Persistent actions require a live Supabase transfer.";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Transfer manifest</p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-slate-700">
            {detail.manifestLines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Chain-of-custody timeline</p>
          <Timeline
            className="mt-3"
            items={detail.auditEvents.map((e, i) => ({
              id: `${e.at}-${i}`,
              title: `${e.actor} · ${e.stage}`,
              meta: e.note,
              time: e.at.slice(0, 19).replace("T", " "),
              tone: e.stage === "verified" ? "success" : e.stage === "dispatched" ? "warning" : "default",
            }))}
          />
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Verification checkpoints</p>
          <ul className="mt-2 list-inside list-disc text-[12px] text-slate-600">
            {detail.checkpoints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-slate-500">
            Receiving officer: <span className="text-slate-800">{detail.receivingOfficer}</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">{detail.gpsPlaceholder}</p>
        </div>
      </div>

      <div className="space-y-3">
        <AlertCard tone="success" title="Corridor intelligence">
          {detail.aiSummary}
        </AlertCard>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Risk posture</p>
          <div className="mt-2">
            <OperationalRiskChipRow variants={detail.chips} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Custody links</p>
          <div className="mt-2 flex flex-col gap-2 text-[12px]">
            <Link className="font-medium text-forest-700 hover:text-forest-600" href={`/inventory/warehouse/${encodeURIComponent(t.fromMinistryCode)}`}>
              Source warehouse → {t.fromMinistryCode}
            </Link>
            <Link className="font-medium text-forest-700 hover:text-forest-600" href={`/inventory/warehouse/${encodeURIComponent(t.toMinistryCode)}`}>
              Destination warehouse → {t.toMinistryCode}
            </Link>
            <Link className="font-medium text-forest-700 hover:text-forest-600" href={`/verification-queue?county=${encodeURIComponent(detail.corridorCounty)}`}>
              Verification queue ({detail.corridorCounty})
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Workflow actions</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {liveBacked
              ? "Warehouse → County → Ministry custody chain. Decisions persist with audit attribution."
              : "Canonical/offline example · read-only. No custody decision will be simulated."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["approve", "Approve", "transfer.approve", "border-emerald-200 bg-emerald-50 text-emerald-800"],
                ["dispatch", "Dispatch", "transfer.dispatch", "border-slate-200 bg-white text-slate-700"],
                ["mark_received", "Mark received", "transfer.mark_received", "border-sky-200 bg-sky-50 text-sky-800"],
                ["verify", "Verify reconcile", "transfer.verify", "border-emerald-200 bg-emerald-50 text-emerald-800"],
                ["reject", "Reject", "transfer.reject", "border-slate-200 bg-white text-slate-700"],
                ["escalate", "Escalate", "transfer.escalate", "border-amber-200 bg-amber-50 text-amber-900"],
                ["investigate", "Investigate", "transfer.investigate", "border-violet-200 bg-violet-50 text-violet-800"],
              ] as const
            ).map(([action, label, perm, cls]) => (
              <OperationalWorkflowButton
                key={action}
                allowed={liveBacked && canPerform(actor, perm, tctx)}
                disabledReason={liveBacked ? explainPermission(actor, perm, tctx) : readOnlyReason}
                onClick={() => onWorkflow(t.id, action)}
                className={`rounded-md border px-2 py-1 text-[10px] font-medium hover:opacity-90 ${cls}`}
              >
                {label}
              </OperationalWorkflowButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
