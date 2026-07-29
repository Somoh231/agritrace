import { NextResponse } from "next/server";

import { API_ERROR_UNAUTHORIZED } from "@/lib/http/api-security";
import { parseJsonObject } from "@/lib/http/api-security";
import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import {
  parseWorkspaceDemoRole,
  WORKSPACE_DEMO_ROLE_COOKIE,
  WORKSPACE_PREVIEW_ROLES,
} from "@/lib/auth/workspace-demo-role";
import type { UserRole } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

const cookieOpts = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 14,
  secure: process.env.NODE_ENV === "production",
};

async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const parsedBody = await parseJsonObject(request, 4_000);
  if (!parsedBody.ok) {
    return NextResponse.json({ ok: false, error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.body as { role?: UserRole | "" | null };
  const raw = body.role;
  if (raw === "" || raw === null || raw === undefined) {
    const res = NextResponse.json({ ok: true, role: null }, { headers: apiHeaders(ctx) });
    res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
    return res;
  }
  const parsed = parseWorkspaceDemoRole(String(raw));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid role" }, { status: 400, headers: apiHeaders(ctx) });
  }
  const res = NextResponse.json({ ok: true, role: parsed }, { headers: apiHeaders(ctx) });
  res.cookies.set(WORKSPACE_DEMO_ROLE_COOKIE, parsed, cookieOpts);
  return res;
}

export async function DELETE(request: Request) {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const res = NextResponse.json({ ok: true }, { headers: apiHeaders(ctx) });
  res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
  return res;
}

/** Server introspection for debugging — authenticated only. */
export async function GET(request: Request) {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  return NextResponse.json(
    {
      allowed: WORKSPACE_PREVIEW_ROLES,
    },
    { headers: apiHeaders(ctx) },
  );
}
