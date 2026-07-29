import { redirect } from "next/navigation";

import DistrictOfficerDashboard from "@/components/ais/DistrictOfficerDashboard";
import { assertDistrictDashboardAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DistrictDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/login?error=profile_required");
  const gate = assertDistrictDashboardAccess(profile.role);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <DistrictOfficerDashboard
      county={profile.county}
      district={profile.district ?? null}
      role={profile.role}
      fullName={profile.full_name}
    />
  );
}
