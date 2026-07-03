import {
  API_ERROR_UNAUTHORIZED,
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
