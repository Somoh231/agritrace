import { NextResponse } from "next/server";

import {
  assessOperationalAccess,
  type AccessRoleAssignment,
} from "@/lib/auth/access-readiness";
import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { ADMIN_MUTATION_POLICY } from "@/lib/http/rate-limit-policies";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const ctx = await beginApiRequestAsync(request, ADMIN_MUTATION_POLICY, user.id);
  const limited = rejectIfRateLimited(ctx);
  if (limited) return limited;
  const headers = apiHeaders(ctx);
  const admin = getSupabaseAdminClient();

  try {
    const [profileResult, roleResult, warehouseResult] = await Promise.all([
      admin
        .from("profiles")
        .select(
          "id,role,organization_id,county,district,clan_or_field_area,is_active,account_status,access_transition_status,activated_at,deactivated_at,suspended_at",
        )
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("profile_role_assignments")
        .select("role,is_primary,starts_at,expires_at,ended_at")
        .eq("profile_id", user.id)
        .is("ended_at", null),
      admin
        .from("warehouse_assignments")
        .select("warehouse_id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);
    if (
      profileResult.error ||
      roleResult.error ||
      warehouseResult.error ||
      !profileResult.data
    ) {
      return NextResponse.json(
        {
          error:
            "Your identity was verified, but your AgriVault access profile is incomplete. Contact your system administrator.",
        },
        { status: 403, headers },
      );
    }

    const profile = profileResult.data as any;
    if (profile.account_status === "inactive") {
      return NextResponse.json(
        { error: "This account is inactive. Contact your system administrator." },
        { status: 403, headers },
      );
    }
    const readiness = assessOperationalAccess(
      {
        ...profile,
        is_active: true,
        account_status: "active",
        has_warehouse_assignment: (warehouseResult.count ?? 0) > 0,
      },
      (roleResult.data ?? []) as AccessRoleAssignment[],
    );
    if (!readiness.ok) {
      return NextResponse.json({ error: readiness.message }, { status: 403, headers });
    }

    const now = new Date().toISOString();
    const activation = await admin
      .from("profiles")
      .update({
        is_active: true,
        account_status: "active",
        activated_at: profile.activated_at ?? now,
        deactivated_at: null,
      } as any)
      .eq("id", user.id);
    if (activation.error) throw activation.error;

    const unban = await admin.auth.admin.updateUserById(user.id, { ban_duration: "none" });
    if (unban.error) throw unban.error;

    await admin.from("audit_log").insert({
      user_id: user.id,
      action: "ACCOUNT_ACTIVATED",
      table_name: "profiles",
      record_id: user.id,
      new_values: { request_id: ctx.requestId, activation: "invitation_or_recovery_completion" },
    } as any);

    return NextResponse.json(
      {
        ok: true,
        role: readiness.role,
        roles: readiness.roles,
        multipleRoles: readiness.multipleRoles,
      },
      { headers },
    );
  } catch (error) {
    console.error("Workforce activation failed", { requestId: ctx.requestId, userId: user.id, error });
    return NextResponse.json(
      { error: "Account activation could not be completed. Contact your system administrator." },
      { status: 500, headers },
    );
  }
}
