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
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ctx = await beginApiRequestAsync(request, READ_POLICY);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError(ctx, API_ERROR_UNAUTHORIZED, 401, { policy: READ_POLICY });

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
  return apiJson(ctx, { farmers: data ?? [] }, { policy: READ_POLICY, userId: user.id });
}
