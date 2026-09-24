import { NextResponse } from "next/server";

import {
  ANALYTICS_STATUS_HEADER,
  isAnalyticsTableUnavailable,
} from "@/lib/analytics/availability";
import {
  clampStr,
  jsonPayloadTooLarge,
  logApiError,
  requestBodyTooLarge,
  API_ERROR_INVALID_JSON,
} from "@/lib/http/api-security";
import {
  apiError,
  apiHeaders,
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { ANALYTICS_POLICY } from "@/lib/http/rate-limit-policies";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { event?: string; payload?: Record<string, unknown> };

const MAX_BODY_BYTES = 16_384;
const MAX_PAYLOAD_BYTES = 8_192;

function analyticsNoContent(
  ctx: Awaited<ReturnType<typeof beginApiRequestAsync>>,
  status: "stored" | "disabled" | "degraded",
) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...apiHeaders(ctx, ANALYTICS_POLICY),
      [ANALYTICS_STATUS_HEADER]: status,
    },
  });
}

function moduleFromPath(pathname: string) {
  if (pathname.startsWith("/rice")) return "rice";
  if (pathname.startsWith("/cocoa")) return "cocoa";
  if (pathname.startsWith("/field")) return "field";
  if (pathname.startsWith("/admin")) return "system";
  return "public";
}

export async function POST(request: Request) {
  const ctx = await beginApiRequestAsync(request, ANALYTICS_POLICY);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  if (requestBodyTooLarge(request, MAX_BODY_BYTES)) {
    return apiError(ctx, "Payload too large.", 413, { policy: ANALYTICS_POLICY });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return apiError(ctx, API_ERROR_INVALID_JSON, 400, { policy: ANALYTICS_POLICY });

  const event = clampStr(body.event, 64);
  if (!event) return apiError(ctx, "event required", 400, { policy: ANALYTICS_POLICY });

  if (jsonPayloadTooLarge(body.payload, MAX_PAYLOAD_BYTES)) {
    return apiError(ctx, "payload too large", 400, { policy: ANALYTICS_POLICY });
  }

  // AgriVault is a private system: only signed-in operators may cause a
  // service-role write. Anonymous events are acknowledged and dropped.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) return analyticsNoContent(ctx, "disabled");

  // Use service role if configured; otherwise no-op.
  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch {
    return analyticsNoContent(ctx, "disabled");
  }

  const url = new URL(request.url);
  const path = clampStr(url.searchParams.get("path") ?? "", 2000) || null;
  const derivedModule = path ? moduleFromPath(path) : null;

  const { error } = await admin.from("analytics_events").insert({
    user_id: userId,
    event,
    path: path,
    module: derivedModule,
    payload: body.payload ?? null,
  } as any);

  if (error) {
    if (isAnalyticsTableUnavailable(error)) {
      return analyticsNoContent(ctx, "disabled");
    }
    logApiError("api/analytics", error, ctx.requestId);
    return analyticsNoContent(ctx, "degraded");
  }

  return analyticsNoContent(ctx, "stored");
}
