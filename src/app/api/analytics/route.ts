import { NextResponse } from "next/server";

import {
  API_ERROR_INVALID_JSON,
  clampStr,
  jsonPayloadTooLarge,
  logApiError,
  requestBodyTooLarge,
} from "@/lib/http/api-security";
import { rateLimitPolicyHeaders } from "@/lib/http/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { event?: string; payload?: Record<string, unknown> };

const MAX_BODY_BYTES = 16_384;
const MAX_PAYLOAD_BYTES = 8_192;

function moduleFromPath(pathname: string) {
  if (pathname.startsWith("/rice")) return "rice";
  if (pathname.startsWith("/cocoa")) return "cocoa";
  if (pathname.startsWith("/field")) return "field";
  if (pathname.startsWith("/admin")) return "system";
  return "public";
}

export async function POST(request: Request) {
  if (requestBodyTooLarge(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: API_ERROR_INVALID_JSON }, { status: 400 });

  const event = clampStr(body.event, 64);
  if (!event) return NextResponse.json({ error: "event required" }, { status: 400 });

  if (jsonPayloadTooLarge(body.payload, MAX_PAYLOAD_BYTES)) {
    return NextResponse.json({ error: "payload too large" }, { status: 400 });
  }

  // Best-effort auth context (not required).
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

  // Use service role if configured; otherwise no-op.
  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch {
    return new NextResponse(null, { status: 204, headers: rateLimitPolicyHeaders() });
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
    logApiError("api/analytics", error);
    return new NextResponse(null, { status: 204, headers: rateLimitPolicyHeaders() });
  }

  return new NextResponse(null, { status: 204, headers: rateLimitPolicyHeaders() });
}
