import { redirect } from "next/navigation";

import CountyOfficerDashboard from "@/components/ais/CountyOfficerDashboard";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

export default async function CountyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  const effective = profile ?? buildDemoProfileForAuthUser(user);

  return <CountyOfficerDashboard county={effective.county} role={effective.role} fullName={effective.full_name} />;
}
