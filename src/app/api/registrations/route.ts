import {
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
  return apiJson(ctx, { registrations: data ?? [] }, { policy: READ_POLICY, userId: auth.session.userId });
}
