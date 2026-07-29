import { redirect } from "next/navigation";

import CacWorkspaceClient from "@/components/workspace/CacWorkspaceClient";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function CacWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/login?error=profile_required");
  const gate = assertPilotWorkspaceAccess(profile.role, "cac");
  if (!gate.ok) redirect(gate.redirectTo);

  return <CacWorkspaceClient role={profile.role} />;
}
