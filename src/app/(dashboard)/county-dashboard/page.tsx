import { redirect } from "next/navigation";

import CountyOfficerDashboard from "@/components/ais/CountyOfficerDashboard";
import { assertCountyDashboardAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function CountyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/login?error=profile_required");
  const gate = assertCountyDashboardAccess(profile.role);
  if (!gate.ok) redirect(gate.redirectTo);

  return <CountyOfficerDashboard county={profile.county} role={profile.role} fullName={profile.full_name} />;
}
