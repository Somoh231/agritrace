import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import type { Profile } from "@/lib/supabase/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin/users");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role" | "is_active">>();

  if (!profile?.role || profile.is_active === false || !isAdminConsoleRole(profile.role)) {
    redirect("/command-center");
  }

  return children;
}
