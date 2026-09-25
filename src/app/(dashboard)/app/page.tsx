import { redirect } from "next/navigation";

import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { ACCOUNT_UNAVAILABLE_PATH, roleFromProfile } from "@/lib/auth/profile-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardEntry() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role" | "is_active">>();

  const role = roleFromProfile(profile);
  if (!role) redirect(ACCOUNT_UNAVAILABLE_PATH);
  redirect(postLoginHomeForRole(role));
}
