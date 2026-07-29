import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import { assessOperationalAccess } from "@/lib/auth/access-readiness";
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

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role,is_active,account_status,organization_id,county,district,clan_or_field_area")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    const legacy = await supabase
      .from("profiles")
      .select("role,is_active,organization_id,county,district")
      .eq("id", user.id)
      .maybeSingle();
    profile = legacy.data as typeof profile;
    error = legacy.error;
  }
  const assignmentResult = await supabase
    .from("profile_role_assignments")
    .select("role")
    .eq("profile_id", user.id)
    .is("removed_at", null);
  const roles =
    assignmentResult.error || !assignmentResult.data
      ? profile?.role
        ? [profile.role as UserRole]
        : []
      : assignmentResult.data.map((item: { role: UserRole }) => item.role);
  const readiness = error ? null : assessOperationalAccess(profile, roles);

  const role = readiness?.ok ? readiness.role : null;
  if (!role || !isAdminConsoleRole(role)) {
    return { ok: false, status: 403, message: "Administrator access required." };
  }

  return { ok: true, userId: user.id, role };
}
