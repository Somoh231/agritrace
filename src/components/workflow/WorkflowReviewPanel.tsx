"use client";

import * as React from "react";

import { DashboardPanel, EmptyState, SectionHeader, StatusBadge, type StatusBadgeTone } from "@/components/enterprise";
import { postWorkflowAction, fetchWorkflowThread } from "@/lib/workflow/client";
import { allowedActionsFor, type WorkflowAction, type WorkflowStage, type WorkflowStatus } from "@/lib/workflow/status-model";
import type { OperationalSubmission, WorkflowThread } from "@/lib/workflow/types";

const ACTION_LABEL: Record<WorkflowAction, string> = {
  submit: "Submit",
  approve: "Approve",
  reject: "Reject",
  request_corrections: "Request corrections",
  escalate: "Escalate",
  assign_reviewer: "Assign reviewer",
  comment: "Comment",
  archive: "Archive",
};

function statusBadgeTone(s: WorkflowStatus): StatusBadgeTone {
  if (s.includes("approved")) return "success";
  if (s === "rejected") return "danger";
  if (s.includes("corrections") || s === "escalated") return "warning";
  if (s.includes("review") || s === "submitted") return "info";
  if (s === "archived") return "neutral";
  return "neutral";
}

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function statusLabel(s: WorkflowStatus): string {
  return s.replace(/_/g, " ");
}

export default function WorkflowReviewPanel({
  stage,
  readOnly = false,
  canCreate = false,
  title = "Approval workflow",
}: {
  stage: WorkflowStage;
  readOnly?: boolean;
  canCreate?: boolean;
  title?: string;
}) {
  const [items, setItems] = React.useState<OperationalSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ops/workflows/submission", { credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !data.ok) {
      setError(String(data.message ?? "Could not load submissions."));
      setItems([]);
    } else {
      setItems((data.submissions as OperationalSubmission[]) ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const interactive = !readOnly && stage !== "auditor" && stage !== "donor";

  return (
    <DashboardPanel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title={title}
          subtitle="Persistent CLAN → DAO → CAC → Ministry decisions. Every action is audited and permission-checked server-side."
        />
        <div className="flex shrink-0 items-center gap-2">
          {canCreate && interactive ? <CreateSubmission onCreated={load} /> : null}
          <button type="button" onClick={() => void load()} className="btn-gov-outline h-9 rounded-lg px-3 text-[13px]">
            Refresh
          </button>
        </div>
      </div>

      {error ?
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-800">{error}</div>
      : null}

      <ul className="mt-4 divide-y divide-slate-100">
        {loading ?
          <li className="py-12 text-center text-[13px] text-slate-500">Loading submissions…</li>
        : items.length === 0 ?
          <li className="py-8">
            <EmptyState
              title="No submissions in scope"
              description={
                canCreate ?
                  "Create one to start the approval chain."
                : "Submissions appear here once field operators submit them."
              }
            />
          </li>
        : items.map((s) => {
            const actions = interactive ? allowedActionsFor(s.status, stage) : [];
            const isOpen = expanded === s.id;
            return (
              <li key={s.id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusBadgeTone(s.status)} uppercase>
                        {statusLabel(s.status)}
                      </StatusBadge>
                      <span className="text-[14px] font-medium text-ink-900">{s.title}</span>
                      <span className="font-mono text-[11px] text-slate-500">{s.referenceCode ?? s.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-[12px] leading-relaxed text-slate-600">
                      {s.submissionType.replace(/_/g, " ")} · {s.county ?? "—"}
                      {s.district ? ` · ${s.district}` : ""} · {fmt(s.createdAt)}
                    </div>
                    {s.summary ? <p className="text-[13px] leading-relaxed text-slate-600">{s.summary}</p> : null}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="text-[12px] font-medium text-forest-700 hover:text-forest-800 focus:outline-none focus-visible:underline"
                    >
                      {isOpen ? "Hide history" : "View history, comments & assignment"}
                    </button>
                  </div>

                  {actions.length > 0 ?
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actions
                        .filter((a) => a !== "comment" && a !== "assign_reviewer" && a !== "submit")
                        .map((a) => (
                          <ActionButton
                            key={a}
                            action={a}
                            busy={busyId === s.id}
                            onRun={async (note) => {
                              setBusyId(s.id);
                              const res = await postWorkflowAction({ action: a, submissionId: s.id, note });
                              setBusyId(null);
                              if (!res.ok) {
                                setError(res.message);
                                return;
                              }
                              setItems((prev) => prev.map((x) => (x.id === s.id ? res.submission : x)));
                            }}
                          />
                        ))}
                    </div>
                  : null}
                </div>

                {isOpen ?
                  <WorkflowThreadView
                    submissionId={s.id}
                    interactive={interactive}
                    canAssign={interactive && allowedActionsFor(s.status, stage).includes("assign_reviewer")}
                    onMutated={(updated) => {
                      if (updated) setItems((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                    }}
                  />
                : null}
              </li>
            );
          })}
      </ul>
    </DashboardPanel>
  );
}

function ActionButton({
  action,
  busy,
  onRun,
}: {
  action: WorkflowAction;
  busy: boolean;
  onRun: (note?: string) => Promise<void>;
}) {
  const needsNote = action === "request_corrections" || action === "reject" || action === "escalate";
  const className =
    action === "approve" ? "btn-emerald h-9 rounded-lg px-3 text-[12px]"
    : action === "reject" ? "h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[12px] font-medium text-rose-800 hover:bg-rose-100"
    : action === "escalate" ? "h-9 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[12px] font-medium text-amber-900 hover:bg-amber-100"
    : "btn-gov-outline h-9 rounded-lg px-3 text-[12px]";
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        let note: string | undefined;
        if (needsNote && typeof window !== "undefined") {
          const entered = window.prompt(`${ACTION_LABEL[action]} — add a note (optional):`) ?? undefined;
          note = entered?.trim() || undefined;
        }
        await onRun(note);
      }}
      className={`disabled:opacity-50 ${className}`}
    >
      {ACTION_LABEL[action]}
    </button>
  );
}

function WorkflowThreadView({
  submissionId,
  interactive,
  canAssign,
  onMutated,
}: {
  submissionId: string;
  interactive: boolean;
  canAssign: boolean;
  onMutated: (updated: OperationalSubmission | null) => void;
}) {
  const [thread, setThread] = React.useState<WorkflowThread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [comment, setComment] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetchWorkflowThread(submissionId);
    if (res.ok) setThread(res.thread);
    else setErr(res.message);
    setLoading(false);
  }, [submissionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function runComment() {
    if (!comment.trim()) return;
    setBusy(true);
    const res = await postWorkflowAction({ action: "comment", submissionId, note: comment.trim() });
    setBusy(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setComment("");
    onMutated(res.submission);
    void load();
  }

  async function runAssign() {
    if (!assignee.trim()) return;
    setBusy(true);
    const res = await postWorkflowAction({ action: "assign_reviewer", submissionId, assigneeId: assignee.trim() });
    setBusy(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setAssignee("");
    onMutated(res.submission);
    void load();
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      {err ?
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">{err}</div>
      : null}
      {loading || !thread ?
        <div className="text-[13px] text-slate-500">Loading history…</div>
      : <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="ent-label">Decision history</p>
            <ol className="mt-2 space-y-2">
              {thread.actions.length === 0 ?
                <li className="text-[12px] text-slate-500">No actions recorded.</li>
              : thread.actions.map((a) => (
                  <li key={a.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[12px]">
                    <span className="font-semibold text-ink-900">{a.action.replace(/_/g, " ")}</span>
                    {a.fromStatus && a.toStatus ?
                      <span className="text-slate-500">
                        {" "}
                        · {statusLabel(a.fromStatus)} → {statusLabel(a.toStatus)}
                      </span>
                    : null}
                    <div className="mt-0.5 text-slate-500">{fmt(a.createdAt)}</div>
                    {a.note ? <div className="mt-1 text-slate-600">“{a.note}”</div> : null}
                  </li>
                ))}
            </ol>
          </div>

          <div>
            <p className="ent-label">Comments & corrections</p>
            <ul className="mt-2 space-y-2">
              {thread.comments.length === 0 ?
                <li className="text-[12px] text-slate-500">No comments.</li>
              : thread.comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[12px]">
                    {c.isCorrectionRequest ?
                      <StatusBadge tone="warning" className="mb-1">
                        corrections
                      </StatusBadge>
                    : null}
                    <span className="text-slate-700">{c.body}</span>
                    <div className="mt-0.5 text-slate-500">{fmt(c.createdAt)}</div>
                  </li>
                ))}
            </ul>
            {interactive ?
              <div className="mt-3 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="av-input h-9 flex-1 text-[13px]"
                />
                <button type="button" disabled={busy} onClick={runComment} className="btn-gov-outline h-9 rounded-lg px-3 text-[12px] disabled:opacity-50">
                  Post
                </button>
              </div>
            : null}
          </div>

          <div>
            <p className="ent-label">Assignment</p>
            <ul className="mt-2 space-y-2">
              {thread.assignments.length === 0 ?
                <li className="text-[12px] text-slate-500">Unassigned.</li>
              : thread.assignments.map((a) => (
                  <li key={a.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[12px] text-slate-700">
                    <span className="font-semibold text-ink-900">{a.roleScope ?? "review"}</span> · {a.status}
                    <div className="font-mono text-[10px] text-slate-500">→ {a.assigneeId ? a.assigneeId.slice(0, 8) : "—"}</div>
                    <div className="text-slate-500">{fmt(a.createdAt)}</div>
                  </li>
                ))}
            </ul>
            {canAssign ?
              <div className="mt-3 flex gap-2">
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Reviewer profile ID (uuid)"
                  className="av-input h-9 flex-1 text-[13px]"
                />
                <button type="button" disabled={busy} onClick={runAssign} className="btn-emerald h-9 rounded-lg px-3 text-[12px] disabled:opacity-50">
                  Assign
                </button>
              </div>
            : null}
          </div>
        </div>}
    </div>
  );
}

function CreateSubmission({ onCreated }: { onCreated: () => void | Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState("farmer_registration");
  const [title, setTitle] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await postWorkflowAction({ action: "submit", create: { submissionType: type, title: title.trim() } });
    setBusy(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setTitle("");
    setOpen(false);
    await onCreated();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-emerald h-9 rounded-lg px-3 text-[13px]">
        New submission
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={type} onChange={(e) => setType(e.target.value)} className="av-input h-9 w-auto min-w-[160px] text-[13px]">
        <option value="farmer_registration">Farmer registration</option>
        <option value="dao_inspection">Field inspection</option>
        <option value="gps_verification">GPS verification</option>
        <option value="subsidy_verification">Subsidy verification</option>
        <option value="pest_escalation">Pest escalation</option>
        <option value="district_summary">District summary</option>
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="av-input h-9 w-48 text-[13px]"
      />
      <button type="button" disabled={busy} onClick={submit} className="btn-emerald h-9 rounded-lg px-3 text-[13px] disabled:opacity-50">
        Submit
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-gov-outline h-9 rounded-lg px-3 text-[13px]">
        Cancel
      </button>
      {err ? <span className="text-[12px] text-rose-600">{err}</span> : null}
    </div>
  );
}
