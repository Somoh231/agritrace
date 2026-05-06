import { NextResponse } from "next/server";

import { DEFAULT_PUBLIC_CONTENT } from "@/lib/growth/content";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminConsole } from "@/lib/supabase/require-admin-console";

export async function GET() {
  const guard = await requireAdminConsole();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.from("public_content_blocks").select("key,value").eq("locale", "en");
    if (error) throw error;

    const merged: Record<string, unknown> = structuredClone(DEFAULT_PUBLIC_CONTENT);
    for (const row of (data ?? []) as any[]) {
      if (row.key in merged && row.value && typeof row.value === "object") {
        merged[row.key] = { ...(merged[row.key] as object), ...(row.value as object) };
      }
    }
    return NextResponse.json({ content: merged });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdminConsole();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const admin = getSupabaseAdminClient();
    const entries = Object.entries(body).filter(([, value]) => value && typeof value === "object");
    if (entries.length === 0) return NextResponse.json({ error: "No content payload provided." }, { status: 400 });

    const rows = entries.map(([key, value]) => ({
      key,
      locale: "en",
      value,
      updated_by: guard.userId,
    }));

    const { error } = await admin.from("public_content_blocks").upsert(rows, { onConflict: "key,locale" });
    if (error) throw error;

    await admin.from("audit_log").insert({
      user_id: guard.userId,
      action: "ADMIN_UPDATE_PUBLIC_CONTENT",
      table_name: "public_content_blocks",
      new_values: { keys: entries.map(([k]) => k) },
    } as any);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

