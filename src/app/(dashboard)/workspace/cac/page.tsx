import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

const TILE_CLASS =
  "group cmd-surface cmd-surface-hover px-3.5 py-3 text-[13px] text-emerald-50/90";

export default async function CacWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  const effective = profile ?? buildDemoProfileForAuthUser(user);
  const gate = assertPilotWorkspaceAccess(effective.role, "cac");
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <MinistryPageShell
      title="CAC county workspace"
      kicker="County Operations · County Agriculture Coordinator"
      description="County verification and approval, escalation management, reporting compliance, operational coordination, and consolidation toward ministry reporting."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <InstallAppButton label="Install App" />
          <SyncStatusIndicator />
        </div>
      }
    >
      <div className="cmd-kicker">Approvals & escalations</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/verification-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">County verification queue</div>
          <p className="mt-1 text-emerald-100/45">Approve, reject, escalate, or request corrections.</p>
        </Link>
        <Link href="/alerts" className={TILE_CLASS}>
          <div className="font-semibold text-white">Escalations</div>
          <p className="mt-1 text-emerald-100/45">County routing to ministry where required.</p>
        </Link>
        <Link href="/county-dashboard" className={TILE_CLASS}>
          <div className="font-semibold text-white">County command center</div>
          <p className="mt-1 text-emerald-100/45">District posture, approvals, maps, and CAC reporting exports.</p>
        </Link>
        <Link href="/compliance" className={TILE_CLASS}>
          <div className="font-semibold text-white">Compliance & audits</div>
          <p className="mt-1 text-emerald-100/45">County compliance posture and tooling.</p>
        </Link>
        <Link href="/reporting/workspace?tab=cac" className={TILE_CLASS}>
          <div className="font-semibold text-white">CAC reporting hub</div>
          <p className="mt-1 text-emerald-100/45">County consolidation and ministry handoff surfaces.</p>
        </Link>
        <Link href="/executive-briefing" className={TILE_CLASS}>
          <div className="font-semibold text-white">Executive briefing</div>
          <p className="mt-1 text-emerald-100/45">Cross-cutting county and national summaries.</p>
        </Link>
      </div>
      <div className="cmd-surface px-3.5 py-2.5 text-[11px] text-emerald-100/55">
        <span className="cmd-kicker">Reporting chain</span>
        <span className="mt-1 block">
          CLAN capture → DAO consolidation → <span className="text-white">CAC county verification</span> → Ministry / national aggregation.
        </span>
      </div>
    </MinistryPageShell>
  );
}
