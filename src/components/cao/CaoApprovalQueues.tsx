"use client";

import * as React from "react";

import type { CaoApprovalItem, CaoApprovalQueueKind, CaoApprovalStatus } from "@/lib/cao/cao-approval-seed";
import { seedCaoApprovalItems } from "@/lib/cao/cao-approval-seed";
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

function statusClasses(s: CaoApprovalStatus): string {
  switch (s) {
    case "pending":
      return "border-slate-600 bg-slate-900/80 text-slate-200";
    case "under_review":
      return "border-sky-600/50 bg-sky-950/35 text-sky-50";
    case "approved":
      return "border-emerald-700/45 bg-emerald-950/25 text-emerald-50";
    case "rejected":
      return "border-rose-700/50 bg-rose-950/30 text-rose-50";
    case "escalated":
      return "border-amber-700/50 bg-amber-950/35 text-amber-50";
    default:
      return "border-slate-700 text-slate-200";
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
    <section className="rounded-xl border border-slate-700/85 bg-slate-950/45 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white">CAC approval queues</h2>
          <p className="mt-1 text-[12px] text-slate-400">
            County-scoped supervisory actions — statuses mirror ministry routing. Decisions on rows backed by a real submission persist via the audited
            workflow engine; demo seed rows update locally as temporary UI state.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          Status filter
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaoApprovalStatus | "all")}
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-2 text-[12px] text-slate-100 outline-none focus:border-emerald-600"
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
                tab === k ? "border-emerald-600/55 bg-emerald-950/35 text-emerald-50" : "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600"
              }`}
            >
              <div className="font-semibold">{QUEUE_LABELS[k]}</div>
              {n ? <div className="mt-0.5 font-mono text-[10px] text-amber-200/90">{n} pending</div> : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-[12px] text-rose-100">
          {error}{" "}
          <button type="button" className="ml-1 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-slate-800/90">
        {visible.length === 0 ? (
          <li className="py-10 text-center text-[12px] text-slate-500">No items in this queue for the current filters.</li>
        ) : (
          visible.map((row) => (
            <li key={row.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClasses(row.status)}`}>{row.status.replace(/_/g, " ")}</span>
                  <span className="text-[13px] font-medium text-white">{row.title}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {row.district} · {row.submittedBy} · {new Date(row.submittedAt).toLocaleString()}
                </div>
                <p className="text-[12px] leading-relaxed text-slate-400">{row.detail}</p>
              </div>
              {!readOnly ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => void decide(row, "approve", "approved")} className="rounded-lg bg-emerald-800 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-700">
                    Approve
                  </button>
                  <button type="button" onClick={() => void decide(row, "reject", "rejected", "CAC rejected")} className="rounded-lg border border-rose-700/60 px-3 py-1.5 text-[11px] text-rose-100 hover:bg-rose-950/35">
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(row, "request_corrections", "under_review", `CAC requested corrections ${new Date().toISOString().slice(0, 10)}`)}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-900"
                  >
                    Request corrections
                  </button>
                  <button type="button" onClick={() => void decide(row, "escalate", "escalated", "Escalated to ministry")} className="rounded-lg border border-amber-700/55 px-3 py-1.5 text-[11px] text-amber-100 hover:bg-amber-950/30">
                    Escalate to ministry
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(row, "comment", "under_review", "Investigation assigned")}
                    className="rounded-lg border border-sky-700/50 px-3 py-1.5 text-[11px] text-sky-100 hover:bg-sky-950/30"
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
                      className="rounded-lg border border-emerald-800/50 px-3 py-1.5 text-[11px] text-emerald-100 hover:bg-emerald-950/25"
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
