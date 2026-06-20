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

export default async function DaoWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  const effective = profile ?? buildDemoProfileForAuthUser(user);
  const gate = assertPilotWorkspaceAccess(effective.role, "dao");
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <MinistryPageShell
      title="District review desk"
      kicker="District Operations · District Agriculture Officer"
      description="Review CLAN field submissions, clear the district queue, and consolidate before county sign-off."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <InstallAppButton label="Install App" />
          <div className="gov-card px-3 py-1.5">
            <SyncStatusIndicator />
          </div>
        </div>
      }
    >
      {/* Review-queue-centered: dominant queue column + supporting context rail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="Pending DAO review"
            hint="CLAN submissions awaiting your district decision"
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
              <QueueRow href="/verification-queue" title="Field captures to verify" meta="Approve, reject, or request corrections" tone="escalation" />
              <QueueRow href="/field/inspections" title="Inspection follow-ups" meta="Visits needing district outcome" />
              <QueueRow href="/registration-approvals" title="Registration approvals" meta="Flagged registrations needing sign-off" />
            </div>
          </Panel>

          <Panel title="Submitted reports" hint="Recently consolidated district reporting">
            <div className="space-y-0.5">
              <QueueRow href="/reporting/workspace?tab=dao" title="DAO reporting hub" meta="District summaries and capture surfaces" />
              <QueueRow href="/reporting/workspace?tab=submitted" title="Recently submitted" meta="Artefacts sent up the chain" tone="ok" />
              <QueueRow href="/district-dashboard" title="District command" meta="Registry, inspections, and operational view" />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Field officer activity" hint="CLAN capture cadence & coverage">
            <div className="space-y-0.5">
              <QueueRow href="/field-agents" title="CLAN / field monitoring" meta="Who is active and where" />
              <QueueRow href="/operations/warehouses" title="Warehouse coordination" meta="Custody posture in the district" />
            </div>
          </Panel>

          <Panel title="Exceptions & escalations" hint="Items needing attention">
            <div className="space-y-0.5">
              <QueueRow href="/alerts" title="Open escalations" meta="Anomalies routed for resolution" tone="alert" />
              <QueueRow href="/compliance/anomalies" title="Compliance anomalies" meta="Distribution & data checks" tone="escalation" />
            </div>
          </Panel>
        </div>
      </div>
    </MinistryPageShell>
  );
}
