"use client";

import * as React from "react";

import type { CaoApprovalItem, CaoApprovalQueueKind, CaoApprovalStatus } from "@/lib/cao/cao-approval-seed";
import { seedCaoApprovalItems } from "@/lib/cao/cao-approval-seed";
import { EmptyState, StatusBadge } from "@/components/enterprise";
import { postWorkflowAction } from "@/lib/workflow/client";
import type { WorkflowAction } from "@/lib/workflow/status-model";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const QUEUE_LABELS: Record<CaoApprovalQueueKind, string> = {
  farmer_registration: "Farmer registrations",
  farm_inspection: "Inspection approvals",
  subsidy_verification: "Subsidy verification",
  pest_escalation: "Pest escalation review",
  district_summary: "District summaries",
  warehouse_replenishment: "Warehouse replenishment",
};

function statusTone(s: CaoApprovalStatus): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (s) {
    case "pending":
      return "neutral";
    case "under_review":
      return "info";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "escalated":
      return "warning";
    default:
      return "neutral";
  }
}

export default function CaoApprovalQueues({ county, readOnly }: { county: string | null; readOnly: boolean }) {
  const [items, setItems] = React.useState<CaoApprovalItem[]>(() => seedCaoApprovalItems(county));
  const [tab, setTab] = React.useState<CaoApprovalQueueKind>("farmer_registration");
  const [statusFilter, setStatusFilter] = React.useState<CaoApprovalStatus | "all">("all");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(seedCaoApprovalItems(county));
  }, [county]);

  /**
   * Persists the decision through the audited workflow API when the row maps to
   * a real submission; otherwise the optimistic patch stands as temporary UI
   * state (demo seeds). Reverts on server rejection.
   */
  const decide = React.useCallback(
    async (row: CaoApprovalItem, action: WorkflowAction, nextStatus: CaoApprovalStatus, detailSuffix?: string) => {
      if (readOnly) return;
      const prevStatus = row.status;
      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id ? { ...x, status: nextStatus, detail: detailSuffix ? `${x.detail} · ${detailSuffix}` : x.detail } : x,
        ),
      );
      if (row.submissionId && UUID_RE.test(row.submissionId)) {
        const res = await postWorkflowAction({ action, submissionId: row.submissionId, note: detailSuffix });
        if (!res.ok) {
          setError(res.message);
          setItems((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: prevStatus } : x)));
        }
      }
    },
    [readOnly],
  );

  const tabItems = React.useMemo(() => items.filter((x) => x.queue === tab), [items, tab]);
  const visible = React.useMemo(
    () => tabItems.filter((x) => statusFilter === "all" || x.status === statusFilter),
    [tabItems, statusFilter],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900">CAC approval queues</h2>
          <p className="mt-1 text-[12px] text-slate-600">
            County-scoped supervisory actions — statuses mirror ministry routing. Decisions on rows backed by a real submission persist via the audited
            workflow engine; demo seed rows update locally as temporary UI state.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-600">
          Status filter
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaoApprovalStatus | "all")}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-800 outline-none focus:border-forest-400"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(Object.keys(QUEUE_LABELS) as CaoApprovalQueueKind[]).map((k) => {
          const n = items.filter((x) => x.queue === k && x.status === "pending").length;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left text-[11px] transition ${
                tab === k ? "border-forest-300 bg-forest-50 text-forest-900 font-medium" : "border-slate-200 bg-white text-slate-600 hover:border-forest-200"
              }`}
            >
              <div className="font-semibold">{QUEUE_LABELS[k]}</div>
              {n ? <div className="mt-0.5 font-mono text-[10px] text-amber-700">{n} pending</div> : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
          {error}{" "}
          <button type="button" className="ml-1 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-slate-100">
        {visible.length === 0 ? (
          <li className="py-6">
            <EmptyState title="No items in this queue" description="Adjust status filters or return when new DAO submissions arrive." />
          </li>
        ) : (
          visible.map((row) => (
            <li key={row.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(row.status)}>{row.status.replace(/_/g, " ")}</StatusBadge>
                  <span className="text-[13px] font-medium text-ink-900">{row.title}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {row.district} · {row.submittedBy} · {new Date(row.submittedAt).toLocaleString()}
                </div>
                <p className="text-[12px] leading-relaxed text-slate-600">{row.detail}</p>
              </div>
              {!readOnly ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => void decide(row, "approve", "approved")} className="rounded-lg bg-forest-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-forest-700">
                    Approve
                  </button>
                  <button type="button" onClick={() => void decide(row, "reject", "rejected", "CAC rejected")} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-800 hover:bg-rose-100">
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(row, "request_corrections", "under_review", `CAC requested corrections ${new Date().toISOString().slice(0, 10)}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    Request corrections
                  </button>
                  <button type="button" onClick={() => void decide(row, "escalate", "escalated", "Escalated to ministry")} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900 hover:bg-amber-100">
                    Escalate to ministry
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(row, "comment", "under_review", "Investigation assigned")}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] text-sky-800 hover:bg-sky-100"
                  >
                    Assign investigation
                  </button>
                  {row.queue === "warehouse_replenishment" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => [
                          ...prev,
                          {
                            id: `cac-repl-${Date.now()}`,
                            queue: "warehouse_replenishment",
                            title: "Triggered replenishment workflow",
                            district: row.district,
                            submittedBy: "CAC routing",
                            submittedAt: new Date().toISOString(),
                            status: "pending",
                            detail: `Derived from ${row.id} — ministry logistics notified (demo).`,
                          },
                        ])
                      }
                      className="rounded-lg border border-forest-200 bg-forest-50 px-3 py-1.5 text-[11px] text-forest-800 hover:bg-forest-100"
                    >
                      Trigger warehouse request
                    </button>
                  ) : null}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">Read-only oversight mode</span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
