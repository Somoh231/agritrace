import { redirect } from "next/navigation";
import { Suspense } from "react";

import GisIntelligenceWorkspace from "@/components/gis/GisIntelligenceWorkspace";
import { assertPilotRouteAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile, UserRole } from "@/lib/supabase/types";

export default async function GisIntelligencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle<Pick<Profile, "role">>();
  const role = (profile?.role as UserRole | undefined) ?? buildDemoProfileForAuthUser(user).role;
  const gate = assertPilotRouteAccess(role, "/gis-intelligence");
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-amber-800/40 bg-amber-950/25 px-3 py-2 text-[12px] text-amber-100/95">
        <span className="font-semibold">Internal / advanced GIS (pilot restricted).</span> Ministry national and CAC roles only. For standard pilot maps use{" "}
        <a className="underline text-emerald-300" href="/map">
          Operational map
        </a>{" "}
        or{" "}
        <a className="underline text-emerald-300" href="/geo-registry">
          Geo registry
        </a>
        .
      </p>
      <Suspense fallback={<div className="min-h-[480px] animate-pulse rounded-xl bg-slate-950/80" aria-hidden />}>
        <GisIntelligenceWorkspace />
      </Suspense>
    </div>
  );
}
