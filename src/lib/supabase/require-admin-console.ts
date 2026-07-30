import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import {
  assessOperationalAccess,
  type AccessRoleAssignment,
} from "@/lib/auth/access-readiness";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

/** Guards `/admin` APIs using the authenticated, active database profile. */
export async function requireAdminConsole(): Promise<
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; status: number; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, message: "Not authenticated." };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,is_active,account_status,access_transition_status,organization_id,county,district,clan_or_field_area,deactivated_at,suspended_at")
    .eq("id", user.id)
    .maybeSingle();
  const [assignmentResult, warehouseResult] = await Promise.all([
    supabase
      .from("profile_role_assignments")
      .select("role,is_primary,starts_at,expires_at,ended_at")
      .eq("profile_id", user.id)
      .is("ended_at", null),
    supabase
      .from("warehouse_assignments")
      .select("warehouse_id", { count: "exact", head: true })
      .eq("profile_id", user.id),
  ]);
  const readiness =
    error || assignmentResult.error || warehouseResult.error
      ? null
      : assessOperationalAccess(
          {
            ...profile,
            has_warehouse_assignment: (warehouseResult.count ?? 0) > 0,
          },
          (assignmentResult.data ?? []) as AccessRoleAssignment[],
        );

  const role = readiness?.ok ? readiness.role : null;
  if (!role || !isAdminConsoleRole(role)) {
    return { ok: false, status: 403, message: "Administrator access required." };
  }

  return { ok: true, userId: user.id, role };
}
