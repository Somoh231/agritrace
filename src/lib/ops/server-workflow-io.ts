import type { SupabaseClient } from "@supabase/supabase-js";

function wfEventCode(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 12)}`;
}

export async function persistWorkflowAuditLog(args: {
  supabase: SupabaseClient;
  userId: string | null;
  action: string;
  tableHint: string;
  recordRef?: string | null;
  detail?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const at = new Date().toISOString();
  const { error } = await args.supabase.from("audit_log").insert({
    user_id: args.userId,
    action: args.action,
    table_name: args.tableHint,
    record_id: null,
    old_values: null,
    new_values: {
      record_ref: args.recordRef ?? null,
      ...(args.detail ?? {}),
      at,
    },
  });
  if (error) {
    console.error("[workflow] audit_log insert failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function persistOperationalWorkflowEvent(args: {
  supabase: SupabaseClient;
  eventType: string;
  message: string;
  severity?: string;
  county?: string | null;
  district?: string | null;
  status?: string;
  codePrefix?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await args.supabase.from("pilot_operational_events").insert({
    event_code: wfEventCode(args.codePrefix ?? "EVT-WF"),
    occurred_at: new Date().toISOString(),
    severity: args.severity ?? "Medium",
    county: args.county ?? null,
    district: args.district ?? null,
    event_type: args.eventType,
    message: args.message,
    status: args.status ?? "Open",
  });
  if (error) {
    console.error("[workflow] pilot_operational_events insert failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
