import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function insertClientAuditLog(input: {
  action: string;
  table_name?: string | null;
  record_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("audit_log").insert({
    user_id: user?.id ?? null,
    action: input.action,
    table_name: input.table_name ?? null,
    record_id: input.record_id ?? null,
    old_values: input.old_values ?? null,
    new_values: input.new_values ?? null,
  } as any);

  if (error) throw error;
}
