import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveEffectiveWorkspaceRole } from "@/lib/auth/effective-workspace-role";
import { mayAccessDistrictDashboard, postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { WORKSPACE_DEMO_ROLE_COOKIE } from "@/lib/auth/workspace-demo-role";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DistrictDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role">>();

  const cookieStore = await cookies();
  const role = resolveEffectiveWorkspaceRole(profile, user, cookieStore.get(WORKSPACE_DEMO_ROLE_COOKIE)?.value);
  if (!mayAccessDistrictDashboard(role)) {
    redirect(postLoginHomeForRole(role));
  }

  return children;
}
