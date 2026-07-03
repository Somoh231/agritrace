import {
  API_ERROR_UNAUTHORIZED,
  clampStr,
  logApiError,
  parseBoundedInt,
} from "@/lib/http/api-security";
import {
  apiError,
  apiInternalError,
  apiJson,
  beginApiRequest,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { createClient } from "@/lib/supabase/server";

const READ_POLICY = { windowMs: 60_000, max: 120 };

export async function GET(request: Request) {
  const ctx = beginApiRequest(request, READ_POLICY);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError(ctx, API_ERROR_UNAUTHORIZED, 401, { policy: READ_POLICY });

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
    logApiError("api/production", error, ctx.requestId);
    return apiInternalError(ctx);
  }
  return apiJson(ctx, { production: data ?? [] }, { policy: READ_POLICY, userId: user.id });
}
