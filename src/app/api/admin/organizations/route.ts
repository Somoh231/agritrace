import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, message: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = resolveUserRoleWithDemoFallback(profile as any, user); // TEMP DEMO FALLBACK
  if (!role) return { ok: false as const, status: 403, message: "Profile required." };
  if (role !== "super_admin" && role !== "admin") {
    return { ok: false as const, status: 403, message: "Super admin access required." };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET() {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("organizations")
      .select("id,name,type,country,county,contact_name,contact_phone,license_number,created_at")
      .order("name");
    if (error) throw error;
    return NextResponse.json({ organizations: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load organizations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const body = (await request.json()) as any;
    const admin = getSupabaseAdminClient();

    if (!body?.name || !body?.type) {
      return NextResponse.json({ error: "Missing organization name/type." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("organizations")
      .insert({
        name: String(body.name).trim(),
        type: body.type,
        country: String(body.country ?? "Liberia"),
        county: body.county ? String(body.county) : null,
        contact_name: body.contact_name ? String(body.contact_name) : null,
        contact_phone: body.contact_phone ? String(body.contact_phone) : null,
        license_number: body.license_number ? String(body.license_number) : null,
      } as any)
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("audit_log").insert({
      user_id: guard.userId,
      action: "ADMIN_CREATE_ORG",
      table_name: "organizations",
      record_id: data.id,
      new_values: { name: data.name, type: data.type, county: data.county },
    } as any);

    return NextResponse.json({ organization: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create organization.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const body = (await request.json()) as any;
    if (!body?.id) return NextResponse.json({ error: "Missing organization id." }, { status: 400 });

    const admin = getSupabaseAdminClient();
    const patch: any = {};
    for (const k of [
      "name",
      "type",
      "country",
      "county",
      "contact_name",
      "contact_phone",
      "license_number",
    ] as const) {
      if (typeof body[k] !== "undefined") patch[k] = body[k];
    }

    const { data, error } = await admin
      .from("organizations")
      .update(patch)
      .eq("id", body.id)
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("audit_log").insert({
      user_id: guard.userId,
      action: "ADMIN_UPDATE_ORG",
      table_name: "organizations",
      record_id: body.id,
      new_values: patch,
    } as any);

    return NextResponse.json({ organization: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update organization.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


