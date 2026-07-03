import { NextResponse } from "next/server";

import { API_ERROR_UNAUTHORIZED } from "@/lib/http/api-security";
import { rateLimitPolicyHeaders } from "@/lib/http/rate-limit";
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

  const body = (await request.json().catch(() => ({}))) as { role?: UserRole | "" | null };
  const raw = body.role;
  if (raw === "" || raw === null || raw === undefined) {
    const res = NextResponse.json({ ok: true, role: null }, { headers: rateLimitPolicyHeaders() });
    res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
    return res;
  }
  const parsed = parseWorkspaceDemoRole(String(raw));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, role: parsed }, { headers: rateLimitPolicyHeaders() });
  res.cookies.set(WORKSPACE_DEMO_ROLE_COOKIE, parsed, cookieOpts);
  return res;
}

export async function DELETE() {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true }, { headers: rateLimitPolicyHeaders() });
  res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
  return res;
}

/** Server introspection for debugging — authenticated only. */
export async function GET() {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  return NextResponse.json(
    {
      allowed: WORKSPACE_PREVIEW_ROLES,
    },
    { headers: rateLimitPolicyHeaders() },
  );
}
