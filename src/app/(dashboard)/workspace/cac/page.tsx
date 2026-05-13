import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

const TILE_CLASS =
  "rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700 transition";

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
      title="CAC workspace"
      description="County Agriculture Coordinators (CAC) — county verification and approval, escalation management, reporting compliance, operational coordination, and consolidation toward ministry reporting."
      actions={<SyncStatusIndicator />}
    >
      <div className="rounded-xl border border-amber-900/35 bg-amber-950/15 px-4 py-3 text-[12px] text-slate-300">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/90">Reporting chain</span>
        <p className="mt-1 leading-relaxed">
          CLAN capture → DAO consolidation → <span className="text-white">CAC county verification</span> → Ministry / national aggregation.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/county-dashboard" className={TILE_CLASS}>
          <div className="font-semibold text-white">County command center</div>
          <p className="mt-2 text-slate-400">District posture, approvals, maps, and CAC reporting exports.</p>
        </Link>
        <Link href="/verification-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">County verification queue</div>
          <p className="mt-2 text-slate-400">Approve, reject, escalate, or request corrections.</p>
        </Link>
        <Link href="/alerts" className={TILE_CLASS}>
          <div className="font-semibold text-white">Escalations</div>
          <p className="mt-2 text-slate-400">County routing to ministry where required.</p>
        </Link>
        <Link href="/compliance" className={TILE_CLASS}>
          <div className="font-semibold text-white">Compliance & audits</div>
          <p className="mt-2 text-slate-400">County compliance posture and tooling.</p>
        </Link>
        <Link href="/reporting/workspace?tab=cac" className={TILE_CLASS}>
          <div className="font-semibold text-white">CAC reporting hub</div>
          <p className="mt-2 text-slate-400">County consolidation and ministry handoff surfaces.</p>
        </Link>
        <Link href="/executive-briefing" className={TILE_CLASS}>
          <div className="font-semibold text-white">Executive briefing</div>
          <p className="mt-2 text-slate-400">Cross-cutting county and national summaries.</p>
        </Link>
      </div>
    </MinistryPageShell>
  );
}
