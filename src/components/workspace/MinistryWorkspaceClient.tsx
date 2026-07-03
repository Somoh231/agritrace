"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Map,
  Shield,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  KpiCard,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  Timeline,
} from "@/components/enterprise";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import WorkspaceQueuePanel from "@/components/workspace/WorkspaceQueuePanel";
import { QueueRow, QueuePrimaryLink } from "@/components/enterprise";

export type MinistryWorkspaceMetrics = {
  registeredFarmers: number;
  verifiedFarmers: number;
  countiesReporting: number;
  inputInventoryCoveragePct: number;
  nationalRiskScore: number;
  pendingVerification: number;
  activeFieldOfficers: number;
  activeCountyAgOfficers: number;
  dataQualityScore: number;
  offlinePendingSync: number;
  flaggedRegistrations: number;
};

const nf = (n: number) => Intl.NumberFormat().format(n);

const RECENT_ACTIVITY = [
  { id: "1", title: "CAC-approved batch synced", meta: "Nimba · 42 submissions", time: "12m ago", tone: "success" as const },
  { id: "2", title: "Warehouse capacity alert", meta: "Bong WH-02 at 95%", time: "45m ago", tone: "warning" as const },
  { id: "3", title: "Offline reconcile complete", meta: "1,200 field agents", time: "1h ago", tone: "default" as const },
];

export default function MinistryWorkspaceClient({ metrics }: { metrics: MinistryWorkspaceMetrics }) {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="National operations · Ministry of Agriculture"
        title="National command workspace"
        description="National posture across 15 counties — operational health, CAC-approved queues, escalations, and cabinet-ready summaries."
        actions={<SyncStatusIndicator />}
      />

      <SectionHeader kicker="National posture" title="Executive summary" subtitle="Live pilot metrics across programmes and reporting health" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/farmers" className="block">
          <KpiCard label="Registered farmers" value={nf(metrics.registeredFarmers)} hint={`${nf(metrics.verifiedFarmers)} verified`} />
        </Link>
        <Link href="/national-heat-map" className="block">
          <KpiCard label="Counties reporting" value={`${metrics.countiesReporting}/15`} hint="National coverage" />
        </Link>
        <Link href="/inventory" className="block">
          <KpiCard label="Input coverage" value={`${metrics.inputInventoryCoveragePct}%`} hint="Allocation reach" />
        </Link>
        <Link href="/food-security" className="block">
          <KpiCard label="Food risk index" value={String(metrics.nationalRiskScore)} hint="Composite ministry index" deltaTone="down" />
        </Link>
        <Link href="/verification-queue" className="block">
          <KpiCard
            label="Pending verification"
            value={nf(metrics.pendingVerification)}
            hint="Awaiting CAC decision"
          />
        </Link>
        <Link href="/field-agents" className="block">
          <KpiCard
            label="Active field officers"
            value={nf(metrics.activeFieldOfficers)}
            hint={`${metrics.activeCountyAgOfficers} county coordinators`}
          />
        </Link>
        <Link href="/compliance/anomalies" className="block">
          <KpiCard label="Data quality" value={`${metrics.dataQualityScore}%`} hint="Integrity score" deltaTone="up" />
        </Link>
        <Link href="/field/sync-queue" className="block">
          <KpiCard label="Offline pending" value={nf(metrics.offlinePendingSync)} hint="Awaiting reconcile" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QuickActionCard
          href="/command-center"
          icon={Shield}
          title="National command center"
          description="Live aggregation across programmes, counties, and the reporting pipeline."
          className="lg:min-h-[160px]"
        />
        <QuickActionCard
          href="/national-heat-map"
          icon={Map}
          title="National heat map"
          description="County-level intelligence and operational signals across the country."
          className="lg:col-span-2 lg:min-h-[160px]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WorkspaceQueuePanel
          kicker="Required action"
          title="CAC-approved queues"
          subtitle="Queues awaiting a national decision"
          action={<QueuePrimaryLink href="/verification-queue">Open queue</QueuePrimaryLink>}
        >
          <QueueRow
            href="/verification-queue"
            title="Verification queue"
            meta={`${nf(metrics.pendingVerification)} pending CAC review`}
            tone="alert"
            badge="Act"
          />
          <QueueRow
            href="/registration-approvals"
            title="Registration approvals"
            meta={`${nf(metrics.flaggedRegistrations)} flagged registrations`}
            tone="escalation"
          />
          <QueueRow
            href="/field/sync-queue"
            title="Offline reconcile"
            meta={`${metrics.offlinePendingSync} records awaiting sync`}
          />
        </WorkspaceQueuePanel>

        <WorkspaceQueuePanel kicker="Risk signals" title="Operational alerts" subtitle="What needs national attention">
          <QueueRow
            href="/alerts"
            title="Escalations & incidents"
            meta="Unresolved anomalies requiring oversight"
            tone="alert"
          />
          <QueueRow
            href="/food-security"
            title="Food security"
            meta={`Risk index ${metrics.nationalRiskScore} · early-warning`}
            tone="escalation"
          />
          <QueueRow
            href="/compliance/anomalies"
            title="Compliance anomalies"
            meta="Distribution and data integrity"
            tone="escalation"
          />
        </WorkspaceQueuePanel>

        <WorkspaceQueuePanel
          kicker="Reporting"
          title="Cabinet-ready summaries"
          subtitle="Pipeline, analytics, and oversight"
        >
          <QueueRow href="/reports" title="Reporting & analytics" meta="Ministry reporting center and exports" tone="ok" />
          <QueueRow
            href="/reporting/workspace"
            title="Reporting operations center"
            meta="DAO & CAC consolidation surfaces"
          />
          <QueueRow href="/activity" title="Audit & activity center" meta="Recent system actions timeline" />
          <QueueRow href="/compliance/audit-log" title="Audit log" meta="Immutable trail for oversight" />
        </WorkspaceQueuePanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <DashboardPanel>
          <SectionHeader
            kicker="Cabinet brief"
            title="Executive briefing engine"
            subtitle="Draft national posture for cabinet review"
            action={
              <Link href="/executive-briefing" className="inline-flex h-9 items-center rounded-lg btn-gold px-4 text-[12px] font-semibold">
                Generate brief
              </Link>
            }
          />
          <AlertCard tone="success" className="mt-4">
            <strong className="font-semibold">Intelligence insight (draft).</strong> County reporting cadence remains stable across pilot counties. Prioritize
            warehouse capacity in Bong and accelerate offline reconcile for northeastern field hubs before the next cabinet cycle.
          </AlertCard>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/executive-briefing" className="inline-flex h-9 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
              Cabinet brief
            </Link>
            <Link href="/reports/export" className="inline-flex h-9 items-center rounded-lg btn-gov-outline px-4 text-[12px] font-medium">
              Export PDF
            </Link>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Activity" title="Recent national activity" action={<BarChart3 className="h-4 w-4 text-slate-400" aria-hidden />} />
          <Timeline items={RECENT_ACTIVITY} className="mt-4" />
          <Link href="/activity" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-forest-700 hover:text-forest-600">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Open activity center →
          </Link>
        </DashboardPanel>
      </div>

      <AlertCard tone="warning" title="National escalation posture" action={<QueuePrimaryLink href="/alerts">Review escalations</QueuePrimaryLink>}>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {nf(metrics.pendingVerification)} items await CAC verification · monitor county escalations before cabinet reporting.
        </span>
      </AlertCard>
    </div>
  );
}
