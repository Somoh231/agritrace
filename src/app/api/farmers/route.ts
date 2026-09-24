import { NextResponse } from "next/server";

import {
  clampStr,
  logApiError,
  parseBoundedInt,
} from "@/lib/http/api-security";
import {
  apiInternalError,
  apiJson,
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import { requireApiSession } from "@/lib/http/require-api-session";
import { canAccessFarmersCooperativesProfiles } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;
  // Same role policy as the /farmers workspace: donor observers never receive farmer PII.
  if (!canAccessFarmersCooperativesProfiles(auth.session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ctx = await beginApiRequestAsync(request, READ_POLICY, auth.session.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const supabase = await createClient();

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
    logApiError("api/farmers", error, ctx.requestId);
    return apiInternalError(ctx);
  }
  return apiJson(ctx, { farmers: data ?? [] }, { policy: READ_POLICY, userId: auth.session.userId });
}
