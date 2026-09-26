import { NextResponse } from "next/server";

import { API_ERROR_UNAUTHORIZED } from "@/lib/http/api-security";
import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import { assignedWorkspaceRoles, parseWorkspaceDemoRole, WORKSPACE_DEMO_ROLE_COOKIE } from "@/lib/auth/workspace-demo-role";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

const cookieOpts = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 14,
  secure: process.env.NODE_ENV === "production",
};

/** Signed-in user plus the roles they actually hold (server-validated). */
async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role" | "is_active">>();
  return { user, assigned: assignedWorkspaceRoles(profile) };
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, session.user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { role?: UserRole | "" | null };
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
  // Only a role the user actually holds can be selected; the preview never grants one.
  if (!session.assigned.includes(parsed)) {
    return NextResponse.json({ ok: false, error: "role not assigned" }, { status: 403, headers: apiHeaders(ctx) });
  }
  const res = NextResponse.json({ ok: true, role: parsed }, { headers: apiHeaders(ctx) });
  res.cookies.set(WORKSPACE_DEMO_ROLE_COOKIE, parsed, cookieOpts);
  return res;
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, session.user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const res = NextResponse.json({ ok: true }, { headers: apiHeaders(ctx) });
  res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
  return res;
}

/** The roles this user may switch between (empty or one role means no switcher). */
export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: API_ERROR_UNAUTHORIZED }, { status: 401 });
  }

  const ctx = await beginApiRequestAsync(request, READ_POLICY, session.user.id);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  return NextResponse.json({ allowed: session.assigned }, { headers: apiHeaders(ctx) });
}
