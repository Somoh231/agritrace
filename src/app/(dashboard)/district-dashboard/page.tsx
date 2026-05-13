import { redirect } from "next/navigation";

import DistrictOfficerDashboard from "@/components/ais/DistrictOfficerDashboard";
import { assertDistrictDashboardAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

export default async function DistrictDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  const effective = profile ?? buildDemoProfileForAuthUser(user);

  const gate = assertDistrictDashboardAccess(effective.role);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <DistrictOfficerDashboard
      county={effective.county}
      district={effective.district ?? null}
      role={effective.role}
      fullName={effective.full_name}
    />
  );
}
