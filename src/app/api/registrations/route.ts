import { NextResponse } from "next/server";

import {
  API_ERROR_GENERIC,
  API_ERROR_UNAUTHORIZED,
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
  const limit = parseBoundedInt(url.searchParams.get("limit"), 50, 1, 200);

  const { data, error } = await supabase
    .from("plots")
    .select(
      "id,farmer_id,commodity,area_hectares,land_tenure,water_source,years_farming_plot,county,district,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logApiError("api/registrations", error);
    return NextResponse.json({ error: API_ERROR_GENERIC }, { status: 500 });
  }
  return NextResponse.json({ registrations: data ?? [] }, { headers: rateLimitPolicyHeaders() });
}

