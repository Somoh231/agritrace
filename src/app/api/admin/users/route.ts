import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";
import type { UserRole } from "@/lib/supabase/types";

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
  if (role !== "super_admin" && role !== "admin") {
    return { ok: false as const, status: 403, message: "Super admin access required." };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET(request: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const role = (url.searchParams.get("role") ?? "").trim() as UserRole | "";
  const active = (url.searchParams.get("active") ?? "").trim(); // "true" | "false" | ""

  try {
    const admin = getSupabaseAdminClient();

    const usersRes = await admin.auth.admin.listUsers({ perPage: 200 });
    if (usersRes.error) throw usersRes.error;

    const ids = usersRes.data.users.map((u) => u.id);
    const profilesRes = await admin
      .from("profiles")
      .select("id,full_name,role,organization_id,county,phone,is_active,deactivated_at,created_at")
      .in("id", ids);
    if (profilesRes.error) throw profilesRes.error;

    const profileById = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));

    const merged = usersRes.data.users.map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email,
        email_confirmed_at: u.email_confirmed_at,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        profile: p
          ? {
              id: p.id,
              full_name: p.full_name,
              role: p.role,
              organization_id: p.organization_id,
              county: p.county,
              phone: p.phone,
              is_active: p.is_active ?? true,
              deactivated_at: p.deactivated_at ?? null,
              created_at: p.created_at,
            }
          : null,
      };
    });

    const filtered = merged.filter((u) => {
      if (role) {
        if (!u.profile || u.profile.role !== role) return false;
      }
      if (active === "true") {
        if (u.profile?.is_active === false) return false;
      }
      if (active === "false") {
        if (u.profile?.is_active !== false) return false;
      }
      if (q) {
        const hay = `${u.email ?? ""} ${u.profile?.full_name ?? ""} ${u.profile?.role ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return NextResponse.json({ users: filtered });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const body = (await request.json()) as {
      userId: string;
      role?: UserRole;
      organization_id?: string | null;
      is_active?: boolean;
      full_name?: string;
      county?: string | null;
      phone?: string | null;
    };

    if (!body.userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    const patch: any = {};
    if (typeof body.role !== "undefined") patch.role = body.role;
    if (typeof body.organization_id !== "undefined") patch.organization_id = body.organization_id;
    if (typeof body.full_name !== "undefined") patch.full_name = body.full_name;
    if (typeof body.county !== "undefined") patch.county = body.county;
    if (typeof body.phone !== "undefined") patch.phone = body.phone;
    if (typeof body.is_active !== "undefined") {
      patch.is_active = body.is_active;
      patch.deactivated_at = body.is_active ? null : new Date().toISOString();
    }

    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", body.userId)
      .select("id,full_name,role,organization_id,is_active,deactivated_at")
      .single();
    if (error) throw error;

    await admin.from("audit_log").insert({
      user_id: guard.userId,
      action: "ADMIN_UPDATE_USER",
      table_name: "profiles",
      record_id: body.userId,
      new_values: patch,
    } as any);

    return NextResponse.json({ profile: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

