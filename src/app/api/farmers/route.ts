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
  const limit = parseBoundedInt(url.searchParams.get("limit"), 50, 1, 200);
  const county = clampStr(url.searchParams.get("county"), 80);

  let query = supabase
    .from("farmers")
    .select("id,full_name,national_id,phone,county,district,village,registration_date,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (county) query = query.eq("county", county);

  const { data, error } = await query;
  if (error) {
    logApiError("api/farmers", error);
    return NextResponse.json({ error: API_ERROR_GENERIC }, { status: 500 });
  }
  return NextResponse.json({ farmers: data ?? [] }, { headers: rateLimitPolicyHeaders() });
}

