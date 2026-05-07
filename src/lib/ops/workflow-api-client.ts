import type { VerificationGridRow } from "@/features/verification/model/types";
import type { TransferOrderView } from "@/lib/logistics/types";

export type WorkflowClientError = { ok: false; status: number; code: string; message: string };

export async function postVerificationWorkflow(
  body: {
    verificationId: string;
    action: "approve" | "reject" | "escalate" | "revision" | "investigate";
    note?: string;
  },
): Promise<{ ok: true; row: VerificationGridRow } | WorkflowClientError> {
  const res = await fetch("/api/ops/workflows/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      code: String(data.code ?? "error"),
      message: String(data.message ?? res.statusText),
    };
  }
  return { ok: true, row: data.row as VerificationGridRow };
}

export async function postTransferWorkflow(
  body: {
    transferId: string;
    action: "approve" | "reject" | "dispatch" | "mark_received" | "verify" | "escalate" | "investigate" | "dispute";
    note?: string;
  },
): Promise<{ ok: true; order: TransferOrderView; persisted: boolean } | WorkflowClientError> {
  const res = await fetch("/api/ops/workflows/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      code: String(data.code ?? "error"),
      message: String(data.message ?? res.statusText),
    };
  }
  return { ok: true, order: data.order as TransferOrderView, persisted: Boolean(data.persisted) };
}
