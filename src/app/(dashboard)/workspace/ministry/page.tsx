import { redirect } from "next/navigation";

import MinistryWorkspaceClient from "@/components/workspace/MinistryWorkspaceClient";
import {
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  nationalHeroMetrics,
} from "@/lib/demo/agriculture-pilot-data";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function MinistryWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/login?error=profile_required");
  const gate = assertPilotWorkspaceAccess(profile.role, "ministry");
  if (!gate.ok) redirect(gate.redirectTo);

  const hero = nationalHeroMetrics;
  const pipeline = farmerRegistrationPipeline;
  const fi = foodSecurityIndicators;

  return (
    <MinistryWorkspaceClient
      metrics={{
        registeredFarmers: hero.registeredFarmers,
        verifiedFarmers: pipeline.verified,
        countiesReporting: hero.countiesReporting,
        inputInventoryCoveragePct: hero.inputInventoryCoveragePct,
        nationalRiskScore: fi.nationalRiskScore,
        pendingVerification: pipeline.pendingVerification,
        activeFieldOfficers: hero.activeFieldOfficers,
        activeCountyAgOfficers: hero.activeCountyAgOfficers,
        dataQualityScore: hero.dataQualityScore,
        offlinePendingSync: hero.offlinePendingSync,
        flaggedRegistrations: pipeline.flagged,
      }}
    />
  );
}
