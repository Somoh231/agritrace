import type { OperationalSubmission, WorkflowMutationBody, WorkflowMutationResult, WorkflowThread } from "@/lib/workflow/types";

const ENDPOINT = "/api/ops/workflows/submission";

/** Calls a persistent, server-validated workflow mutation. */
export async function postWorkflowAction(body: WorkflowMutationBody): Promise<WorkflowMutationResult> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.ok) {
    return {
      ok: false,
      status: res.status,
      code: String(data.code ?? "error"),
      message: String(data.message ?? res.statusText),
    };
  }
  return {
    ok: true,
    submission: data.submission as OperationalSubmission,
    persisted: Boolean(data.persisted),
  };
}

/** Fetches the full history thread (actions + comments + assignments) for a submission. */
export async function fetchWorkflowThread(
  submissionId: string,
): Promise<{ ok: true; thread: WorkflowThread } | { ok: false; status: number; code: string; message: string }> {
  const res = await fetch(`${ENDPOINT}?submissionId=${encodeURIComponent(submissionId)}`, {
    method: "GET",
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !data.ok) {
    return {
      ok: false,
      status: res.status,
      code: String(data.code ?? "error"),
      message: String(data.message ?? res.statusText),
    };
  }
  return { ok: true, thread: data.thread as WorkflowThread };
}
