import { createClient } from "@/lib/supabase/server";

type MaybeNumber = number | null;

async function countTable(table: string): Promise<MaybeNumber> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from(table as any).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function getInstitutionalMetrics() {
  const [farmers, plots, productionRecords, users, organizations, auditEvents, analyticsEvents] = await Promise.all([
    countTable("farmers"),
    countTable("plots"),
    countTable("rice_production_records"),
    countTable("profiles"),
    countTable("organizations"),
    countTable("audit_log"),
    countTable("analytics_events"),
  ]);

  return {
    farmers,
    plots,
    productionRecords,
    users,
    organizations,
    auditEvents,
    analyticsEvents,
  };
}

