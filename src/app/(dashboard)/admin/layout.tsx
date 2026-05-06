import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin/users");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  // TEMP DEMO FALLBACK — missing profiles row still allows admin routes for demo role when enabled.
  const role = resolveUserRoleWithDemoFallback(profile, user);
  if (!role || (role !== "super_admin" && role !== "admin")) {
    redirect("/national-operations");
  }

  return children;
}

