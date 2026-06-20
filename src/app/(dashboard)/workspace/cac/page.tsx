import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { Panel, QueueRow } from "@/components/workspace/ui";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

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
      title="County verification desk"
      kicker="County Operations · County Agriculture Coordinator"
      description="Verify district submissions, run the county approval queue, and manage escalations toward the Ministry."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <InstallAppButton label="Install App" />
          <div className="gov-card px-3 py-1.5">
            <SyncStatusIndicator />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="County approval queue"
            hint="DAO submissions awaiting county verification"
            action={
              <Link
                href="/verification-queue"
                className="h-8 rounded-lg bg-emerald-600 px-3 text-[12px] font-semibold text-white ring-1 ring-[rgb(var(--ministry-gold))]/30 hover:bg-emerald-500 inline-flex items-center"
              >
                Open queue
              </Link>
            }
          >
            <div className="space-y-0.5">
              <QueueRow href="/verification-queue" title="Pending county approvals" meta="Approve, reject, escalate, or return" tone="escalation" />
              <QueueRow href="/registration-approvals" title="Registration sign-off" meta="Supervisory review for the county" />
              <QueueRow href="/compliance" title="Compliance reviews" meta="Audits and anomaly tooling" />
            </div>
          </Panel>

          <Panel title="DAO submissions" hint="District consolidation feeding the county">
            <div className="space-y-0.5">
              <QueueRow href="/reporting/workspace?tab=cac" title="CAC reporting hub" meta="County consolidation & ministry handoff" />
              <QueueRow href="/county-dashboard" title="County command center" meta="District posture, maps, and exports" />
              <QueueRow href="/executive-briefing" title="Executive briefing" meta="Cross-cutting county summaries" />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="District performance" hint="How districts are tracking">
            <div className="space-y-0.5">
              <QueueRow href="/county-dashboard" title="District scorecards" meta="Cadence and coverage by district" tone="ok" />
              <QueueRow href="/food-security" title="County food security" meta="Early-warning signals" />
            </div>
          </Panel>

          <Panel title="Escalations" hint="Routed to Ministry where required">
            <div className="space-y-0.5">
              <QueueRow href="/alerts" title="County escalations" meta="Incidents and anomaly routing" tone="alert" />
            </div>
          </Panel>
        </div>
      </div>
    </MinistryPageShell>
  );
}
