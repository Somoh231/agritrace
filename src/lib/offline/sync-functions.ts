import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Farmer, Plot, RiceProductionRecord } from "@/lib/supabase/types";

type SyncResult = { success: boolean; error?: string; serverId?: string };

export async function syncFarmer(record: {
  client_id: string;
  data: Partial<Farmer>;
}): Promise<SyncResult> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("farmers")
    .upsert({ ...(record.data as any), client_id: record.client_id } as any, {
      onConflict: "client_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, serverId: (data as any)?.id };
}

export async function syncProductionRecord(record: {
  client_id: string;
  data: Partial<RiceProductionRecord>;
}): Promise<SyncResult> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("rice_production_records")
    .upsert({ ...(record.data as any), client_id: record.client_id } as any, {
      onConflict: "client_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, serverId: (data as any)?.id };
}

export async function syncPlot(record: { client_id: string; data: Partial<Plot> }): Promise<SyncResult> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("plots")
    .upsert({ ...(record.data as any), client_id: record.client_id } as any, {
      onConflict: "client_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, serverId: (data as any)?.id };
}

