import { redirect } from "next/navigation";

import ActiveRoleSelector from "@/components/auth/ActiveRoleSelector";
import {
  assessOperationalAccess,
  type AccessRoleAssignment,
} from "@/lib/auth/access-readiness";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceRoleSelectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: assignments },
    { count: warehouseAssignmentCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("role,is_active,account_status,access_transition_status,organization_id,county,district,clan_or_field_area,deactivated_at,suspended_at")
      .eq("id", user.id)
      .maybeSingle(),
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
  const readiness = assessOperationalAccess(
    {
      ...profile,
      has_warehouse_assignment: (warehouseAssignmentCount ?? 0) > 0,
    },
    (assignments ?? []) as AccessRoleAssignment[],
  );
  if (!readiness.ok) {
    redirect("/login?error=profile_incomplete");
  }

  const roles = readiness.roles;
  if (!roles.length) redirect("/login?error=role_required");
  if (roles.length === 1) redirect(postLoginHomeForRole(roles[0]));

  return <ActiveRoleSelector roles={roles} currentRole={readiness.role} />;
}
