import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import LiveQueueStat from "@/components/workspace/LiveQueueStat";
import { BigAction, Panel, QueueRow } from "@/components/workspace/ui";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

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
      title="Field workspace"
      kicker="Field Operations · CLAN Technician"
      description="Your field tasks for today. Everything works offline and syncs automatically when you reconnect."
      actions={<InstallAppButton label="Install App" />}
    >
      {/* Field-first: a focused single column sized for handheld use */}
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BigAction
            href="/field/boundary-capture"
            title="Capture boundary"
            subtitle="Walk the farm corners and map the plot"
            primary
          />
          <BigAction
            href="/field/mobile"
            title="Submit field report"
            subtitle="Checklists, notes, and observations"
          />
        </div>

        <LiveQueueStat href="/field/sync-queue" label="Offline queue" />

        <Panel title="Today's field work" hint="Tasks assigned to your clan area">
          <div className="space-y-0.5">
            <QueueRow href="/farmers" title="Register a farmer" meta="Add to the registry with identity + plot" />
            <QueueRow href="/field/inspections" title="Inspection visit" meta="Geo-stamped visit and outcome" />
            <QueueRow href="/field/pest-reports" title="Pest & disease report" meta="Structured phytosanitary alert" tone="escalation" />
            <QueueRow href="/field/mobile" title="Field activity checklist" meta="Mobile-first capture, offline-ready" />
          </div>
        </Panel>

        <Panel
          title="Recent submissions"
          hint="What you have captured recently"
          action={
            <div className="cmd-surface px-2 py-1">
              <SyncStatusIndicator />
            </div>
          }
        >
          <div className="space-y-0.5">
            <QueueRow href="/field/sync-queue" title="Offline queue & reconciliation" meta="Review drafts and push when online" tone="ok" />
            <QueueRow href="/activity" title="Activity history" meta="Your recent captures and updates" />
          </div>
        </Panel>

        <div className="cmd-surface px-3.5 py-2.5 text-[11px] text-emerald-100/55">
          <span className="cmd-kicker">Reporting chain</span>
          <span className="mt-1 block">
            Your captures go to the <span className="text-white">District Agriculture Officer (DAO)</span> for review, then CAC county verification and Ministry aggregation.
          </span>
        </div>
      </div>
    </MinistryPageShell>
  );
}
