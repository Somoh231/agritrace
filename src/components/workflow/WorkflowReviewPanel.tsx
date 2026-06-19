"use client";

import * as React from "react";

import { postWorkflowAction, fetchWorkflowThread } from "@/lib/workflow/client";
import { allowedActionsFor, type WorkflowAction, type WorkflowStage, type WorkflowStatus } from "@/lib/workflow/status-model";
import type { OperationalSubmission, WorkflowThread } from "@/lib/workflow/types";

const STATUS_TONE: Record<WorkflowStatus, string> = {
  draft: "border-slate-600 bg-slate-900/80 text-slate-200",
  submitted: "border-sky-600/50 bg-sky-950/35 text-sky-50",
  dao_review: "border-sky-600/50 bg-sky-950/35 text-sky-50",
  dao_corrections_requested: "border-amber-700/50 bg-amber-950/35 text-amber-50",
  dao_approved: "border-emerald-700/45 bg-emerald-950/25 text-emerald-50",
  cac_review: "border-sky-600/50 bg-sky-950/35 text-sky-50",
  cac_corrections_requested: "border-amber-700/50 bg-amber-950/35 text-amber-50",
  cac_approved: "border-emerald-700/45 bg-emerald-950/25 text-emerald-50",
  ministry_review: "border-sky-600/50 bg-sky-950/35 text-sky-50",
  ministry_approved: "border-emerald-700/55 bg-emerald-900/35 text-emerald-50",
  rejected: "border-rose-700/50 bg-rose-950/30 text-rose-50",
  escalated: "border-amber-700/50 bg-amber-950/35 text-amber-50",
  archived: "border-slate-700 bg-slate-900/60 text-slate-400",
};

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
    <section className="rounded-xl border border-slate-700/85 bg-slate-950/45 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white">{title}</h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Persistent CLAN → DAO → CAC → Ministry decisions. Every action is audited and permission-checked server-side.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && interactive ? <CreateSubmission onCreated={load} /> : null}
          <button
            type="button"
            onClick={() => void load()}
            className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-100 hover:bg-slate-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-[12px] text-rose-100">{error}</div> : null}

      <ul className="mt-4 divide-y divide-slate-800/90">
        {loading ? (
          <li className="py-10 text-center text-[12px] text-slate-500">Loading submissions…</li>
        ) : items.length === 0 ? (
          <li className="py-10 text-center text-[12px] text-slate-500">
            No submissions in your scope yet. {canCreate ? "Create one to start the approval chain." : "Submissions appear here once field operators submit them."}
          </li>
        ) : (
          items.map((s) => {
            const actions = interactive ? allowedActionsFor(s.status, stage) : [];
            const isOpen = expanded === s.id;
            return (
              <li key={s.id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_TONE[s.status]}`}>
                        {statusLabel(s.status)}
                      </span>
                      <span className="text-[13px] font-medium text-white">{s.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">{s.referenceCode ?? s.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {s.submissionType.replace(/_/g, " ")} · {s.county ?? "—"}
                      {s.district ? ` · ${s.district}` : ""} · {fmt(s.createdAt)}
                    </div>
                    {s.summary ? <p className="text-[12px] leading-relaxed text-slate-400">{s.summary}</p> : null}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      {isOpen ? "Hide history" : "View history, comments & assignment"}
                    </button>
                  </div>

                  {actions.length > 0 ? (
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
                  ) : null}
                </div>

                {isOpen ? (
                  <WorkflowThreadView
                    submissionId={s.id}
                    interactive={interactive}
                    canAssign={interactive && allowedActionsFor(s.status, stage).includes("assign_reviewer")}
                    onMutated={(updated) => {
                      if (updated) setItems((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                    }}
                  />
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </section>
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
  const tone =
    action === "approve"
      ? "bg-emerald-800 text-white hover:bg-emerald-700"
      : action === "reject"
        ? "border border-rose-700/60 text-rose-100 hover:bg-rose-950/35"
        : action === "escalate"
          ? "border border-amber-700/55 text-amber-100 hover:bg-amber-950/30"
          : "border border-slate-600 text-slate-200 hover:bg-slate-900";
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
      className={`rounded-lg px-3 py-1.5 text-[11px] disabled:opacity-50 ${tone}`}
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
    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      {err ? <div className="mb-2 rounded border border-rose-800/50 bg-rose-950/30 px-2 py-1 text-[11px] text-rose-100">{err}</div> : null}
      {loading || !thread ? (
        <div className="text-[11px] text-slate-500">Loading history…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Decision history</div>
            <ol className="mt-2 space-y-1.5">
              {thread.actions.length === 0 ? (
                <li className="text-[11px] text-slate-500">No actions recorded.</li>
              ) : (
                thread.actions.map((a) => (
                  <li key={a.id} className="text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-100">{a.action.replace(/_/g, " ")}</span>
                    {a.fromStatus && a.toStatus ? (
                      <span className="text-slate-500">
                        {" "}
                        · {statusLabel(a.fromStatus)} → {statusLabel(a.toStatus)}
                      </span>
                    ) : null}
                    <div className="text-slate-500">{fmt(a.createdAt)}</div>
                    {a.note ? <div className="text-slate-400">“{a.note}”</div> : null}
                  </li>
                ))
              )}
            </ol>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Comments & corrections</div>
            <ul className="mt-2 space-y-1.5">
              {thread.comments.length === 0 ? (
                <li className="text-[11px] text-slate-500">No comments.</li>
              ) : (
                thread.comments.map((c) => (
                  <li key={c.id} className="text-[11px]">
                    {c.isCorrectionRequest ? (
                      <span className="mr-1 rounded bg-amber-950/50 px-1 text-[10px] font-semibold uppercase text-amber-200">corrections</span>
                    ) : null}
                    <span className="text-slate-300">{c.body}</span>
                    <div className="text-slate-500">{fmt(c.createdAt)}</div>
                  </li>
                ))
              )}
            </ul>
            {interactive ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="h-8 flex-1 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-100 outline-none focus:border-emerald-600"
                />
                <button type="button" disabled={busy} onClick={runComment} className="rounded-md border border-slate-600 px-2 text-[11px] text-slate-200 hover:bg-slate-900 disabled:opacity-50">
                  Post
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Assignment</div>
            <ul className="mt-2 space-y-1.5">
              {thread.assignments.length === 0 ? (
                <li className="text-[11px] text-slate-500">Unassigned.</li>
              ) : (
                thread.assignments.map((a) => (
                  <li key={a.id} className="text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-100">{a.roleScope ?? "review"}</span> · {a.status}
                    <div className="font-mono text-[10px] text-slate-500">→ {a.assigneeId ? a.assigneeId.slice(0, 8) : "—"}</div>
                    <div className="text-slate-500">{fmt(a.createdAt)}</div>
                  </li>
                ))
              )}
            </ul>
            {canAssign ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Reviewer profile ID (uuid)"
                  className="h-8 flex-1 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-100 outline-none focus:border-emerald-600"
                />
                <button type="button" disabled={busy} onClick={runAssign} className="rounded-md border border-slate-600 px-2 text-[11px] text-slate-200 hover:bg-slate-900 disabled:opacity-50">
                  Assign
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
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
      <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-lg bg-emerald-700 px-3 text-[12px] font-semibold text-white hover:bg-emerald-600">
        New submission
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-lg border border-slate-600 bg-slate-950 px-2 text-[12px] text-slate-100">
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
        className="h-9 w-48 rounded-lg border border-slate-600 bg-slate-950 px-2 text-[12px] text-slate-100 outline-none focus:border-emerald-600"
      />
      <button type="button" disabled={busy} onClick={submit} className="h-9 rounded-lg bg-emerald-700 px-3 text-[12px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
        Submit
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-slate-600 px-3 text-[12px] text-slate-300 hover:bg-slate-900">
        Cancel
      </button>
      {err ? <span className="text-[11px] text-rose-300">{err}</span> : null}
    </div>
  );
}
