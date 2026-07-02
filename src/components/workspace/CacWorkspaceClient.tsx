"use client";

import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  AlertCard,
  PageHeader,
  QuickActionCard,
} from "@/components/enterprise";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import WorkspaceQueuePanel from "@/components/workspace/WorkspaceQueuePanel";
import WorkspaceQueueRow, { WorkspacePrimaryLink } from "@/components/workspace/WorkspaceQueueRow";
import WorkflowReviewPanel from "@/components/workflow/WorkflowReviewPanel";
import { workflowStageForRole } from "@/lib/workflow/roles";
import type { UserRole } from "@/lib/supabase/types";

export default function CacWorkspaceClient({ role }: { role: UserRole }) {
  const stage = workflowStageForRole(role);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="County operations · County Agriculture Coordinator"
        title="County verification desk"
        description="Verify district submissions, run the county approval queue, manage escalations, and prepare sign-off for Ministry review."
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
          title="County approval queue"
          description="Approve, reject, escalate, or return DAO-consolidated submissions."
        />
        <QuickActionCard
          href="/county-dashboard"
          icon={BarChart3}
          title="County command center"
          description="District posture, maps, scorecards, and county exports."
        />
        <QuickActionCard
          href="/reporting/workspace?tab=cac"
          icon={FileText}
          title="CAC reporting hub"
          description="County consolidation and Ministry handoff surfaces."
        />
        <QuickActionCard
          href="/executive-briefing"
          icon={ShieldCheck}
          title="Executive briefing"
          description="Cross-cutting county summaries and cabinet-ready context."
        />
      </div>

      <AlertCard tone="info" title="Sign-off readiness">
        County verification confirms DAO-reviewed artefacts meet national standards. Escalate unresolved anomalies to Ministry before final approval.
      </AlertCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <WorkspaceQueuePanel
            kicker="Primary queue"
            title="County approval queue"
            subtitle="DAO submissions awaiting county verification"
            action={<WorkspacePrimaryLink href="/verification-queue">Open queue</WorkspacePrimaryLink>}
          >
            <WorkspaceQueueRow
              href="/verification-queue"
              title="Pending county approvals"
              meta="Approve, reject, escalate, or return"
              tone="escalation"
            />
            <WorkspaceQueueRow
              href="/registration-approvals"
              title="Registration sign-off"
              meta="Supervisory review for the county"
            />
            <WorkspaceQueueRow href="/compliance" title="Compliance reviews" meta="Audits and anomaly tooling" />
          </WorkspaceQueuePanel>

          <WorkspaceQueuePanel
            kicker="District intake"
            title="DAO submissions"
            subtitle="District consolidation feeding the county"
          >
            <WorkspaceQueueRow
              href="/reporting/workspace?tab=cac"
              title="CAC reporting hub"
              meta="County consolidation & ministry handoff"
            />
            <WorkspaceQueueRow
              href="/county-dashboard"
              title="County command center"
              meta="District posture, maps, and exports"
            />
            <WorkspaceQueueRow
              href="/executive-briefing"
              title="Executive briefing"
              meta="Cross-cutting county summaries"
            />
          </WorkspaceQueuePanel>

          <WorkflowReviewPanel stage={stage} canCreate title="County verification workflow" />
        </div>

        <div className="space-y-6">
          <WorkspaceQueuePanel
            kicker="Performance"
            title="District performance"
            subtitle="How districts are tracking within the county"
          >
            <WorkspaceQueueRow
              href="/county-dashboard"
              title="District scorecards"
              meta="Cadence and coverage by district"
              tone="ok"
            />
            <WorkspaceQueueRow href="/food-security" title="County food security" meta="Early-warning signals" />
          </WorkspaceQueuePanel>

          <WorkspaceQueuePanel
            kicker="Escalations"
            title="Ministry routing"
            subtitle="Incidents requiring national oversight"
          >
            <WorkspaceQueueRow
              href="/alerts"
              title="County escalations"
              meta="Incidents and anomaly routing"
              tone="alert"
            />
          </WorkspaceQueuePanel>

          <AlertCard tone="warning" title="Escalation guidance" action={<WorkspacePrimaryLink href="/alerts">View escalations</WorkspacePrimaryLink>}>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Route unresolved county-level risks to Ministry before cabinet reporting cycles.
            </span>
          </AlertCard>
        </div>
      </div>
    </div>
  );
}
