import { redirect } from "next/navigation";

import { mayAccessCountyDashboard, postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function CountyDashboardLayout({ children }: { children: React.ReactNode }) {
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
  if (!mayAccessCountyDashboard(role)) {
    redirect(postLoginHomeForRole(role));
  }

  return children;
}
