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
  "rounded-lg border border-slate-700 bg-slate-900/50 px-3.5 py-3 text-[13px] text-slate-200 hover:border-emerald-700 transition";

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
      title="CLAN workspace"
      description="Clan Agriculture Crops Technicians (CLAN) — field capture, farm registration, GPS boundaries, observations, and offline-first reporting. Submissions flow to the District Agriculture Officer (DAO) for district review."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <InstallAppButton label="Install App" />
          <SyncStatusIndicator />
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/field/mobile" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field activity & checklists</div>
          <p className="mt-1 text-slate-400">Mobile-first capture with offline queue.</p>
        </Link>
        <Link href="/field" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field home</div>
          <p className="mt-1 text-slate-400">Farm registration and pilot field tools.</p>
        </Link>
        <Link href="/field/boundary-capture" className={TILE_CLASS}>
          <div className="font-semibold text-white">GPS boundary capture</div>
          <p className="mt-1 text-slate-400">Walk corners, approximate farm outline, queue when offline.</p>
        </Link>
        <Link href="/field/inspections" className={TILE_CLASS}>
          <div className="font-semibold text-white">Inspection visits</div>
          <p className="mt-1 text-slate-400">Geo-stamped visits and outcomes.</p>
        </Link>
        <Link href="/field/pest-reports" className={TILE_CLASS}>
          <div className="font-semibold text-white">Pest & disease</div>
          <p className="mt-1 text-slate-400">Structured field alerts.</p>
        </Link>
        <Link href="/field/sync-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">Offline queue</div>
          <p className="mt-1 text-slate-400">Pending sync and reconciliation.</p>
        </Link>
      </div>
      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3.5 py-2 text-[11px] text-slate-400">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300/90">Reporting chain</span>{" "}
        CLAN field capture → DAO review and consolidation → CAC county verification → Ministry / national aggregation.
      </div>
    </MinistryPageShell>
  );
}
