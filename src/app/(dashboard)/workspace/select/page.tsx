import { redirect } from "next/navigation";

import ActiveRoleSelector from "@/components/auth/ActiveRoleSelector";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export default async function WorkspaceRoleSelectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("role,is_active,account_status").eq("id", user.id).maybeSingle(),
    supabase
      .from("profile_role_assignments")
      .select("role,is_primary")
      .eq("profile_id", user.id)
      .is("removed_at", null),
  ]);
  if (!profile?.role || profile.is_active === false || profile.account_status !== "active") {
    redirect("/login?error=profile_incomplete");
  }

  const roles = [...new Set((assignments ?? []).map((item: any) => item.role as UserRole))];
  if (!roles.length) redirect("/login?error=role_required");
  if (roles.length === 1) redirect(postLoginHomeForRole(roles[0]));

  return <ActiveRoleSelector roles={roles} currentRole={profile.role as UserRole} />;
}
