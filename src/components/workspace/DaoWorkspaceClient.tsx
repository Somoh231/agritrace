"use client";

import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  MapPin,
  Users,
} from "lucide-react";

import {
  AlertCard,
  PageHeader,
  QuickActionCard,
} from "@/components/enterprise";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import LiveQueueStat from "@/components/workspace/LiveQueueStat";
import WorkspaceQueuePanel from "@/components/workspace/WorkspaceQueuePanel";
import { QueueRow, QueuePrimaryLink } from "@/components/enterprise";
import WorkflowReviewPanel from "@/components/workflow/WorkflowReviewPanel";
import { workflowStageForRole } from "@/lib/workflow/roles";
import type { UserRole } from "@/lib/supabase/types";

export default function DaoWorkspaceClient({ role }: { role: UserRole }) {
  const stage = workflowStageForRole(role);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="District operations · District Agriculture Officer"
        title="District review desk"
        description="Review CLAN field submissions, clear the district queue, request corrections, and consolidate reporting before county sign-off."
        actions={
          <>
            <InstallAppButton label="Install App" />
            <SyncStatusIndicator />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/verification-queue"
          icon={ClipboardCheck}
          title="Open review queue"
          description="Approve, reject, or request corrections on CLAN submissions."
        />
        <QuickActionCard
          href="/field/inspections"
          icon={MapPin}
          title="Inspection follow-ups"
          description="Visits needing district outcome and field verification."
        />
        <QuickActionCard
          href="/reporting/workspace?tab=dao"
          icon={FileText}
          title="DAO reporting hub"
          description="District summaries, capture surfaces, and consolidation."
        />
        <QuickActionCard
          href="/field-agents"
          icon={Users}
          title="Field officer activity"
          description="CLAN capture cadence, coverage, and active officers."
        />
      </div>

      <AlertCard tone="info" title="District review posture">
        Prioritize pending CLAN captures and inspection outcomes. Request corrections when evidence is incomplete — consolidated reports flow to the County Agriculture Coordinator (CAC) for verification.
      </AlertCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <WorkspaceQueuePanel
            kicker="Primary queue"
            title="Pending DAO review"
            subtitle="CLAN submissions awaiting your district decision"
            action={<QueuePrimaryLink href="/verification-queue">Open queue</QueuePrimaryLink>}
          >
            <QueueRow
              href="/verification-queue"
              title="Field captures to verify"
              meta="Approve, reject, or request corrections"
              tone="escalation"
            />
            <QueueRow
              href="/field/inspections"
              title="Inspection follow-ups"
              meta="Visits needing district outcome"
            />
            <QueueRow
              href="/registration-approvals"
              title="Registration approvals"
              meta="Flagged registrations needing sign-off"
            />
          </WorkspaceQueuePanel>

          <WorkspaceQueuePanel
            kicker="Reporting"
            title="Submitted reports"
            subtitle="Recently consolidated district reporting"
          >
            <QueueRow
              href="/reporting/workspace?tab=dao"
              title="DAO reporting hub"
              meta="District summaries and capture surfaces"
            />
            <QueueRow
              href="/reporting/workspace?tab=submitted"
              title="Recently submitted"
              meta="Artefacts sent up the chain"
              tone="ok"
            />
            <QueueRow href="/district-dashboard" title="District command" meta="Registry, inspections, and operational view" />
          </WorkspaceQueuePanel>

          <WorkflowReviewPanel stage={stage} canCreate title="District review workflow" />
        </div>

        <div className="space-y-6">
          <LiveQueueStat href="/field/sync-queue" label="Offline sync intake" />

          <WorkspaceQueuePanel
            kicker="Field activity"
            title="CLAN & warehouse coordination"
            subtitle="Capture cadence and custody posture in the district"
          >
            <QueueRow href="/field-agents" title="CLAN / field monitoring" meta="Who is active and where" />
            <QueueRow
              href="/operations/warehouses"
              title="Warehouse coordination"
              meta="Custody posture in the district"
            />
          </WorkspaceQueuePanel>

          <WorkspaceQueuePanel
            kicker="Exceptions"
            title="Escalations & anomalies"
            subtitle="Items needing district attention"
          >
            <QueueRow
              href="/alerts"
              title="Open escalations"
              meta="Anomalies routed for resolution"
              tone="alert"
            />
            <QueueRow
              href="/compliance/anomalies"
              title="Compliance anomalies"
              meta="Distribution & data checks"
              tone="escalation"
            />
          </WorkspaceQueuePanel>

          <AlertCard tone="warning" title="Corrections workflow" action={<QueuePrimaryLink href="/verification-queue">Review queue</QueuePrimaryLink>}>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Return incomplete submissions to CLAN with clear correction notes before county handoff.
            </span>
          </AlertCard>
        </div>
      </div>
    </div>
  );
}
