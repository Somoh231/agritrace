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

export default async function ClanWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  const effective = profile ?? buildDemoProfileForAuthUser(user);
  const gate = assertPilotWorkspaceAccess(effective.role, "clan");
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <MinistryPageShell
      title="CLAN field workspace"
      kicker="Field Operations · Clan Agriculture Crops Technicians"
      description="Field capture, farm registration, GPS boundaries, observations, and offline-first reporting. Submissions flow to the District Agriculture Officer (DAO) for district review."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <InstallAppButton label="Install App" />
          <SyncStatusIndicator />
        </div>
      }
    >
      <div className="cmd-kicker">Priority field tasks</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/field/boundary-capture" className={TILE_CLASS}>
          <div className="font-semibold text-white">GPS boundary capture</div>
          <p className="mt-1 text-emerald-100/45">Walk corners, approximate farm outline, queue when offline.</p>
        </Link>
        <Link href="/field/mobile" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field activity & checklists</div>
          <p className="mt-1 text-emerald-100/45">Mobile-first capture with offline queue.</p>
        </Link>
        <Link href="/field/sync-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">Offline queue</div>
          <p className="mt-1 text-emerald-100/45">Pending sync and reconciliation.</p>
        </Link>
        <Link href="/field" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field home</div>
          <p className="mt-1 text-emerald-100/45">Farm registration and pilot field tools.</p>
        </Link>
        <Link href="/field/inspections" className={TILE_CLASS}>
          <div className="font-semibold text-white">Inspection visits</div>
          <p className="mt-1 text-emerald-100/45">Geo-stamped visits and outcomes.</p>
        </Link>
        <Link href="/field/pest-reports" className={TILE_CLASS}>
          <div className="font-semibold text-white">Pest & disease</div>
          <p className="mt-1 text-emerald-100/45">Structured field alerts.</p>
        </Link>
      </div>
      <div className="cmd-surface px-3.5 py-2.5 text-[11px] text-emerald-100/55">
        <span className="cmd-kicker">Reporting chain</span>
        <span className="mt-1 block">
          CLAN field capture → DAO review and consolidation → CAC county verification → Ministry / national aggregation.
        </span>
      </div>
    </MinistryPageShell>
  );
}
