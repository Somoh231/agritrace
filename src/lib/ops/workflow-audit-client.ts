import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type WorkflowAuditPayload = {
  action: string;
  /** Logical entity e.g. verification_queue */
  tableHint?: string;
  /** Human-readable target id (VRF-*, TRF-*, etc.) */
  recordRef?: string;
  detail?: Record<string, unknown>;
};

/**
 * Best-effort audit_log insert for ministry workflow actions.
 * No-op if unauthenticated or RLS denies insert — UI remains usable offline/demo.
 */
export async function logWorkflowAudit(payload: WorkflowAuditPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("audit_log").insert({
      user_id: user?.id ?? null,
      action: payload.action,
      table_name: payload.tableHint ?? "workflow",
      record_id: null,
      old_values: null,
      new_values: {
        record_ref: payload.recordRef ?? null,
        ...(payload.detail ?? {}),
        at: new Date().toISOString(),
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "audit failed" };
  }
}
