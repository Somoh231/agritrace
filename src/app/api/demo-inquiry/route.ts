import {
  clampStr,
  isEmail,
  logApiError,
  parseJsonObject,
} from "@/lib/http/api-security";
import {
  apiError,
  apiJson,
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { PUBLIC_POLICY } from "@/lib/http/rate-limit-policies";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_BODY_BYTES = 32_768;

export async function POST(request: Request) {
  const ctx = await beginApiRequestAsync(request, PUBLIC_POLICY);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const parsed = await parseJsonObject(request, MAX_BODY_BYTES);
  if (!parsed.ok) return apiError(ctx, parsed.error, parsed.status, { policy: PUBLIC_POLICY });

  try {
    const body = parsed.body;

    const full_name = clampStr(body.full_name, 200);
    const email = clampStr(body.email, 320).toLowerCase();
    const organization = clampStr(body.organization, 200) || null;
    const phone = clampStr(body.phone, 80) || null;
    const message = clampStr(body.message, 4000) || null;
    const source = clampStr(body.source, 64) || "request_demo";

    if (full_name.length < 2) {
      return apiError(ctx, "Please enter your full name.", 400, { policy: PUBLIC_POLICY });
    }
    if (!isEmail(email)) {
      return apiError(ctx, "Please enter a valid email address.", 400, { policy: PUBLIC_POLICY });
    }

    let admin;
    try {
      admin = getSupabaseAdminClient();
    } catch {
      return apiError(ctx, "Demo requests are not configured yet. Contact the administrator.", 503, {
        policy: PUBLIC_POLICY,
      });
    }

    const { error } = await admin.from("demo_inquiries").insert({
      full_name,
      email,
      organization,
      phone,
      message,
      source,
      status: "new",
    } as Record<string, unknown>);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return apiError(ctx, "Database table missing. Run schema.demo_inquiries.sql in Supabase.", 503, {
          policy: PUBLIC_POLICY,
        });
      }
      logApiError("api/demo-inquiry", error, ctx.requestId);
      return apiError(ctx, "Could not save your request. Try again later.", 500, { policy: PUBLIC_POLICY });
    }

    return apiJson(ctx, { ok: true }, { policy: PUBLIC_POLICY });
  } catch {
    return apiError(ctx, "Invalid request.", 400, { policy: PUBLIC_POLICY });
  }
}
