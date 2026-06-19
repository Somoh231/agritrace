import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

const TILE_CLASS =
  "group cmd-surface cmd-surface-hover px-3.5 py-3 text-[13px] text-emerald-50/90";

export default async function MinistryWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  const effective = profile ?? buildDemoProfileForAuthUser(user);
  const gate = assertPilotWorkspaceAccess(effective.role, "ministry");
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <MinistryPageShell
      title="Ministry national workspace"
      kicker="National Operations · Ministry of Agriculture"
      description="National operations — aggregation across counties, food security visibility, operational dashboards, audit and export posture, and escalation resolution."
      actions={<SyncStatusIndicator />}
    >
      <div className="cmd-kicker">National status</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/command-center" className={TILE_CLASS}>
          <div className="font-semibold text-white">Command center</div>
          <p className="mt-1 text-emerald-100/45">National operational posture.</p>
        </Link>
        <Link href="/national-heat-map" className={TILE_CLASS}>
          <div className="font-semibold text-white">National heat map</div>
          <p className="mt-1 text-emerald-100/45">County intelligence and signals.</p>
        </Link>
        <Link href="/national-operations" className={TILE_CLASS}>
          <div className="font-semibold text-white">National operations</div>
          <p className="mt-1 text-emerald-100/45">Cross-programme operational view.</p>
        </Link>
        <Link href="/food-security" className={TILE_CLASS}>
          <div className="font-semibold text-white">Food security</div>
          <p className="mt-1 text-emerald-100/45">National visibility on food security indicators.</p>
        </Link>
        <Link href="/reports" className={TILE_CLASS}>
          <div className="font-semibold text-white">Reporting & analytics</div>
          <p className="mt-1 text-emerald-100/45">Ministry reporting center and exports.</p>
        </Link>
        <Link href="/compliance/audit-log" className={TILE_CLASS}>
          <div className="font-semibold text-white">Audit log</div>
          <p className="mt-1 text-emerald-100/45">Immutable trail for ministry oversight.</p>
        </Link>
      </div>
      <div className="cmd-surface px-3.5 py-2.5 text-[11px] text-emerald-100/55">
        <span className="cmd-kicker">Reporting chain</span>
        <span className="mt-1 block">
          CLAN → DAO → CAC → <span className="text-white">Ministry / national intelligence</span> with audit visibility for authorised ministry roles.
        </span>
      </div>
    </MinistryPageShell>
  );
}
