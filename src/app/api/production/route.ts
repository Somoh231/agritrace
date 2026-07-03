import { NextResponse } from "next/server";

import {
  API_ERROR_GENERIC,
  API_ERROR_UNAUTHORIZED,
  clampStr,
  logApiError,
  parseBoundedInt,
} from "@/lib/http/api-security";
import { rateLimitPolicyHeaders } from "@/lib/http/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: API_ERROR_UNAUTHORIZED }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseBoundedInt(url.searchParams.get("limit"), 100, 1, 500);
  const season = clampStr(url.searchParams.get("season"), 40);

  let query = supabase
    .from("rice_production_records")
    .select(
      "id,farmer_id,plot_id,season,actual_yield_kg,expected_yield_kg,post_harvest_loss_kg,county,district,recorded_at",
    )
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (season) query = query.eq("season", season);

  const { data, error } = await query;
  if (error) {
    logApiError("api/production", error);
    return NextResponse.json({ error: API_ERROR_GENERIC }, { status: 500 });
  }
  return NextResponse.json({ production: data ?? [] }, { headers: rateLimitPolicyHeaders() });
}

