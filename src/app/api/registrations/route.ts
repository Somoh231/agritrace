import {
  API_ERROR_UNAUTHORIZED,
  logApiError,
  parseBoundedInt,
} from "@/lib/http/api-security";
import {
  apiError,
  apiInternalError,
  apiJson,
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // Identify first so the budget is per user (anonymous callers fall back to IP).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await beginApiRequestAsync(request, READ_POLICY, user?.id ?? null);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;
  if (!user) return apiError(ctx, API_ERROR_UNAUTHORIZED, 401, { policy: READ_POLICY });

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
    logApiError("api/registrations", error, ctx.requestId);
    return apiInternalError(ctx);
  }
  return apiJson(ctx, { registrations: data ?? [] }, { policy: READ_POLICY, userId: user.id });
}
