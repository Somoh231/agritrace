import { redirect } from "next/navigation";

import { mayAccessDistrictDashboard, postLoginHomeForRole } from "@/lib/auth/post-login-home";
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
  if (!profile?.role) redirect("/login?error=profile_required");

  const role = profile.role;
  if (!mayAccessDistrictDashboard(role)) {
    redirect(postLoginHomeForRole(role));
  }

  return children;
}
