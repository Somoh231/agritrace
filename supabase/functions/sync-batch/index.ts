import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { farmers, plots, production_records } = await req.json();

  const results = {
    farmers: { synced: 0, failed: 0, errors: [] as string[] },
    plots: { synced: 0, failed: 0, errors: [] as string[] },
    production_records: { synced: 0, failed: 0, errors: [] as string[] },
  };

  if (farmers?.length > 0) {
    const { error } = await supabase
      .from("farmers")
      .upsert(farmers, { onConflict: "client_id", ignoreDuplicates: false });
    if (error) {
      results.farmers.failed = farmers.length;
      results.farmers.errors.push(error.message);
    } else {
      results.farmers.synced = farmers.length;
    }
  }

  if (plots?.length > 0) {
    const { error } = await supabase.from("plots").upsert(plots, { onConflict: "client_id", ignoreDuplicates: false });
    if (error) {
      results.plots.failed = plots.length;
      results.plots.errors.push(error.message);
    } else {
      results.plots.synced = plots.length;
    }
  }

  if (production_records?.length > 0) {
    const { error } = await supabase
      .from("rice_production_records")
      .upsert(production_records, { onConflict: "client_id", ignoreDuplicates: false });
    if (error) {
      results.production_records.failed = production_records.length;
      results.production_records.errors.push(error.message);
    } else {
      results.production_records.synced = production_records.length;
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});

