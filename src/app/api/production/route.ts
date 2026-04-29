import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "100"), 1), 500);
  const season = (url.searchParams.get("season") ?? "").trim();

  let query = supabase
    .from("rice_production_records")
    .select(
      "id,farmer_id,plot_id,season,actual_yield_kg,expected_yield_kg,post_harvest_loss_kg,county,district,recorded_at",
    )
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (season) query = query.eq("season", season);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ production: data ?? [] });
}

