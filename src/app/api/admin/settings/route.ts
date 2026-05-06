import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminConsole } from "@/lib/supabase/require-admin-console";

export async function GET() {
  const guard = await requireAdminConsole();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("app_settings")
      .select("id,app_name,country,theme,logo_url,notifications_enabled,created_at,updated_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdminConsole();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const body = (await request.json()) as any;
    const admin = getSupabaseAdminClient();

    const { data: current, error: curErr } = await admin
      .from("app_settings")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (curErr) throw curErr;
    if (!current?.id) return NextResponse.json({ error: "app_settings row missing." }, { status: 500 });

    const patch: any = {};
    for (const k of ["app_name", "country", "theme", "logo_url", "notifications_enabled"] as const) {
      if (typeof body[k] !== "undefined") patch[k] = body[k];
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from("app_settings")
      .update(patch)
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("audit_log").insert({
      user_id: guard.userId,
      action: "ADMIN_UPDATE_SETTINGS",
      table_name: "app_settings",
      record_id: current.id,
      new_values: patch,
    } as any);

    return NextResponse.json({ settings: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

