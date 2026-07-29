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
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;
  const ctx = await beginApiRequestAsync(request, READ_POLICY, auth.session.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const supabase = await createClient();

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
  return apiJson(ctx, { production: data ?? [] }, { policy: READ_POLICY, userId: auth.session.userId });
}
