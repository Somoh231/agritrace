import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { event?: string; payload?: Record<string, unknown> };

function safeStr(v: unknown, max: number) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function moduleFromPath(pathname: string) {
  if (pathname.startsWith("/rice")) return "rice";
  if (pathname.startsWith("/cocoa")) return "cocoa";
  if (pathname.startsWith("/field")) return "field";
  if (pathname.startsWith("/admin")) return "system";
  return "public";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const event = safeStr(body.event, 64);
  if (!event) return NextResponse.json({ error: "event required" }, { status: 400 });

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
    return new NextResponse(null, { status: 204 });
  }

  const url = new URL(request.url);
  const path = safeStr(url.searchParams.get("path") ?? "", 2000) || null;
  const derivedModule = path ? moduleFromPath(path) : null;

  const { error } = await admin.from("analytics_events").insert({
    user_id: userId,
    event,
    path: path,
    module: derivedModule,
    payload: body.payload ?? null,
  } as any);

  if (error) {
    // Do not surface analytics failures to clients
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}

