import type { SupabaseClient } from "@supabase/supabase-js";

export async function daoAuditInsertSafe(
  supabase: SupabaseClient,
  row: {
    action: string;
    table_name?: string | null;
    record_id?: string | null;
    new_values?: Record<string, unknown> | null;
  },
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      user_id: user?.id ?? null,
      action: row.action,
      table_name: row.table_name ?? null,
      record_id: row.record_id ?? null,
      new_values: row.new_values ?? null,
    } as Record<string, unknown>);
  } catch {
    /* audit must never block DAO capture */
  }
}
