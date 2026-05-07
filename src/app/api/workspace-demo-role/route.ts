import { NextResponse } from "next/server";

import {
  parseWorkspaceDemoRole,
  WORKSPACE_DEMO_ROLE_COOKIE,
  WORKSPACE_PREVIEW_ROLES,
} from "@/lib/auth/workspace-demo-role";
import type { UserRole } from "@/lib/supabase/types";

const cookieOpts = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 14,
  secure: process.env.NODE_ENV === "production",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { role?: UserRole | "" | null };
  const raw = body.role;
  if (raw === "" || raw === null || raw === undefined) {
    const res = NextResponse.json({ ok: true, role: null });
    res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
    return res;
  }
  const parsed = parseWorkspaceDemoRole(String(raw));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, role: parsed });
  res.cookies.set(WORKSPACE_DEMO_ROLE_COOKIE, parsed, cookieOpts);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(WORKSPACE_DEMO_ROLE_COOKIE);
  return res;
}

/** Server introspection for debugging */
export async function GET() {
  return NextResponse.json({
    allowed: WORKSPACE_PREVIEW_ROLES,
  });
}
