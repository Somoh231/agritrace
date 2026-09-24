"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  FileBarChart,
  FileDown,
  ShieldAlert,
  Users,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceNotice,
  EnterpriseAreaChart,
  EnterpriseBarChart,
  KpiCard,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Timeline,
  UtilizationGauge,
} from "@/components/enterprise";
import { demoSource, offlineSource, resolveDisplaySource } from "@/lib/data/data-source";
import { RegistryKpiStrip } from "@/components/registry";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import OfflineFieldOperationsCard from "@/components/pwa/OfflineFieldOperationsCard";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import {
  type ReportingTabId,
  REPORTING_TABS,
  reportingSectionsForTab,
} from "@/components/reporting/reporting-workspace-config";
import {
  dataQualityAlerts,
  farmerRegistrationPipeline,
  fieldReports,
  nationalHeroMetrics,
  offlineSyncQueue,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";
import { illustrativeCaption } from "@/lib/data/illustrative-policy";

type ReportRegistryRow = {
  id: string;
  name: string;
  status: string;
  lastGenerated: string;
  nextScheduled: string;
  owner: string;
  freshness: string;
  approval: string;
  size: string;
  queue: string;
  href: string;
};

// Reports are generated on demand from live, RLS-scoped records. There is no
// scheduler, approval workflow or export history yet, so none is shown.
const REPORT_REGISTRY: ReportRegistryRow[] = [
  {
    id: "rice_ministry",
    name: "Rice ministry summary",
    status: "On demand",
    lastGenerated: "Generated at download",
    nextScheduled: "Not scheduled",
    owner: "Ministry analytics",
    freshness: "Live at download",
    approval: "No approval workflow",
    size: "—",
    queue: "Idle",
    href: "/api/reports/rice",
  },
  {
    id: "compliance_oversight",
    name: "Compliance oversight PDF",
    status: "On demand",
    lastGenerated: "Generated at download",
    nextScheduled: "Not scheduled",
    owner: "Compliance desk",
    freshness: "Live at download",
    approval: "No approval workflow",
    size: "—",
    queue: "Idle",
    href: "/api/reports/compliance-oversight",
  },
  {
    id: "donor_programme",
    name: "Donor programme dossier",
    status: "On demand",
    lastGenerated: "Generated at download",
    nextScheduled: "Not scheduled",
    owner: "Donor relations",
    freshness: "Live at download",
    approval: "No approval workflow",
    size: "—",
    queue: "Idle",
    href: "/api/reports/donor-programme",
  },
  {
    id: "executive_briefing",
    name: "Executive briefing",
    status: "On demand",
    lastGenerated: "Generated at download",
    nextScheduled: "Not scheduled",
    owner: "Cabinet office",
    freshness: "Live at download",
    approval: "No approval workflow",
    size: "—",
    queue: "Idle",
    href: "/executive-briefing",
  },
  {
    id: "dds",
    name: "Due diligence statement",
    status: "On demand",
    lastGenerated: "Generated at download",
    nextScheduled: "Not scheduled",
    owner: "Export compliance",
    freshness: "Live at download",
    approval: "No approval workflow",
    size: "—",
    queue: "Idle",
    href: "/api/reports/dds",
  },
];

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "syncing" | "neutral" {
  if (status === "Ready" || status === "Approved") return "success";
  if (status === "Generating" || status === "In progress" || status === "Scheduled") return "syncing";
  if (status === "Stale" || status === "Pending review") return "warning";
  return "neutral";
}

export default function ReportingWorkspaceView({ tab }: { tab: ReportingTabId }) {
  const tabMeta = REPORTING_TABS.find((t) => t.id === tab) ?? REPORTING_TABS[0]!;
  const sections = reportingSectionsForTab(tab);

  const hero = nationalHeroMetrics;
  const pipeline = farmerRegistrationPipeline;
  const activeAlerts =
    postHarvestLossAlerts.filter((a) => a.lossPct > 10).length + dataQualityAlerts.length;
  const nf = (n: number) => Intl.NumberFormat().format(n);
  const draftRecords = offlineSyncQueue.reduce((s, q) => s + q.records, 0);
  const reportingSource = resolveDisplaySource([
    demoSource("fieldReports + nationalHeroMetrics + pipeline"),
    offlineSource(illustrativeCaption("Device queue — see /field/sync-queue", "offlineSyncQueue counts are illustrative — use /field/sync-queue for real IndexedDB")),
  ]);

  const submissionTrend = [
    { day: "Mon", submitted: 42, approved: 38 },
    { day: "Tue", submitted: 55, approved: 48 },
    { day: "Wed", submitted: 38, approved: 35 },
    { day: "Thu", submitted: 61, approved: 52 },
    { day: "Fri", submitted: 47, approved: 44 },
    { day: "Sat", submitted: 22, approved: 20 },
    { day: "Sun", submitted: 18, approved: 17 },
  ];

  const exportVolume = [
    { week: "W1", exports: 12 },
    { week: "W2", exports: 18 },
    { week: "W3", exports: 15 },
    { week: "W4", exports: 24 },
  ];

  const recentExports = [
    { id: "ex-1", title: "Rice ministry summary", user: "Ministry analytics", time: "2026-07-01 08:02", format: "PDF" },
    { id: "ex-2", title: "County Bong consolidation", user: "CAC Bong", time: "2026-06-30 16:12", format: "CSV" },
    { id: "ex-3", title: "Donor programme dossier", user: "Donor relations", time: "2026-06-28 11:45", format: "PDF" },
    { id: "ex-4", title: "Compliance oversight", user: "Compliance desk", time: "2026-06-28 14:32", format: "PDF" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <DataSourceNotice source={reportingSource} />
      <PageHeader
        kicker="Operations · Reporting command center"
        title="National reporting control center"
        description="Unified reporting workspace with export registry, generation queue, and operational intelligence. Chain: CLAN capture → DAO review → CAC verification → Ministry aggregation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <InstallAppButton label="Install App" variant="primary" />
            <Link href="/field/sync-queue" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[13px]">
              Offline queue
            </Link>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <SyncStatusIndicator />
            </div>
          </div>
        }
      />

      <RegistryKpiStrip
        items={[
          { label: "Counties reporting", value: `${hero.countiesReporting}/15`, hint: "Pilot cadence", href: "/national-heat-map" },
          { label: "Active field officers", value: nf(hero.activeFieldOfficers), hint: `${hero.activeCountyAgOfficers} county coordinators`, href: "/field-agents" },
          { label: "Pending verification", value: nf(pipeline.pendingVerification), hint: "Awaiting CAC decision", href: "/verification-queue" },
          { label: "Active alerts", value: String(activeAlerts), hint: "Escalations & quality signals", href: "/alerts", deltaTone: activeAlerts > 0 ? "down" : "up" },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Reports available" value={String(REPORT_REGISTRY.length)} hint="Generated on demand" />
        <KpiCard label="Data freshness" value="Live" hint="Built from current records at download" deltaTone="neutral" />
        <KpiCard label="Scheduling" value="Off" hint="No scheduled report runs configured" deltaTone="neutral" />
        <KpiCard label="Access" value="Role-scoped" hint="Exports follow your role and geography" deltaTone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel className="lg:col-span-2">
          <SectionHeader kicker="Registry" title="Report catalog & export status" subtitle="Each report is generated from live records when downloaded" />
          <div tabIndex={0} role="region" aria-label="Scrollable table" className="mt-4 overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest-600">
            <table className="enterprise-table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Status</th>
                  <th>Last generated</th>
                  <th>Next scheduled</th>
                  <th>Owner</th>
                  <th>Freshness</th>
                  <th>Approval</th>
                  <th>Size</th>
                  <th>Queue</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_REGISTRY.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-ink-900">
                      <Link href={r.href.startsWith("/api") ? "/reports/export" : r.href} className="hover:text-forest-700">
                        {r.name}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge tone={statusTone(r.status)} dot>
                        {r.status}
                      </StatusBadge>
                    </td>
                    <td className="font-mono text-[11px] text-slate-600">{r.lastGenerated}</td>
                    <td className="font-mono text-[11px] text-slate-600">{r.nextScheduled}</td>
                    <td className="text-slate-600">{r.owner}</td>
                    <td>{r.freshness}</td>
                    <td>
                      <StatusBadge tone={r.approval === "Approved" ? "success" : "warning"}>{r.approval}</StatusBadge>
                    </td>
                    <td className="font-mono text-[11px]">{r.size}</td>
                    <td>
                      <StatusBadge tone={r.queue === "Idle" ? "neutral" : "syncing"}>{r.queue}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Queue health" title="Export pipeline" subtitle="Generation progress and scheduled jobs" />
          <div className="mt-4 space-y-4">
            <UtilizationGauge value={72} label="Queue utilization" />
            <p className="text-[12px] text-slate-500">3 of 5 slots active (pilot)</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <span className="text-[13px] text-slate-700">Executive briefing</span>
                <StatusBadge tone="syncing" dot>
                  Generating
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <span className="text-[13px] text-slate-700">Donor programme dossier</span>
                <StatusBadge tone="warning">Scheduled 09:00</StatusBadge>
              </div>
            </div>
            <Link href="/reports/export" className="btn-emerald inline-flex h-10 w-full items-center justify-center rounded-lg text-[13px]">
              <FileDown className="mr-2 h-4 w-4" aria-hidden />
              Open export center
            </Link>
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Analytics" title="Daily submissions & approval velocity" subtitle="Pilot cadence from field reporting channels" />
          <div className="mt-4">
            <EnterpriseAreaChart data={submissionTrend} xKey="day" yKey="submitted" name="Submitted" height={200} />
          </div>
        </DashboardPanel>
        <DashboardPanel>
          <SectionHeader kicker="Usage" title="Report export volume" subtitle="Weekly export count across ministry roles" />
          <div className="mt-4">
            <EnterpriseBarChart
              data={exportVolume}
              xKey="week"
              series={[{ dataKey: "exports", fill: "#276634", name: "Exports" }]}
              height={200}
            />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Field ops" title="Offline field operations" subtitle="Install, sync queue, and GPS readiness for DAO capture teams" />
        <div className="mt-4">
          <OfflineFieldOperationsCard />
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <SectionHeader kicker="Pipeline" title="Reporting pipeline tabs" subtitle={tabMeta.hint} />
        <div className="mt-4 flex flex-wrap gap-2">
          {REPORTING_TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                href={`/reporting/workspace?tab=${t.id}`}
                className={[
                  "inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-200",
                  active ?
                    "border-forest-300 bg-forest-50 font-medium text-forest-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-forest-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <QuickActionCard href="/verification-queue" icon={ClipboardList} title="Verification desk" description="Approve, reject, escalate, and assign investigations across the unified queue." />
        <QuickActionCard href="/reports/export" icon={FileBarChart} title="Export center" description="Download reporting packages and data extracts for ministry cycles." />
        <QuickActionCard href="/food-security" icon={ShieldAlert} title="Food security intelligence" description="Early-warning signals and county vulnerability derived from field reporting." />
      </div>

      <div className="space-y-5">
        {sections.map((sec) => (
          <DashboardPanel key={sec.label}>
            <SectionHeader kicker="Required action" title={sec.label} />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sec.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-forest-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-ink-900 truncate">{item.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{item.body}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[13px] text-forest-600 transition group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{item.meta}</p>
                </Link>
              ))}
            </div>
          </DashboardPanel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Activity" title="Recent exports" subtitle="Download history across ministry roles" />
          <Timeline
            className="mt-4"
            items={recentExports.map((e) => ({
              id: e.id,
              title: e.title,
              meta: `${e.user} · ${e.format}`,
              time: e.time,
              tone: "default" as const,
            }))}
          />
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Activity" title="Latest field submissions" subtitle={illustrativeCaption("Recent submissions from DAO capture channels", "Illustrative pilot cadence from DAO capture channels")} />
          <Timeline
            className="mt-4"
            items={fieldReports.map((r) => ({
              id: r.id,
              title: `${r.county} · ${r.officer}`,
              meta: r.summary,
              time: r.submittedAt.slice(0, 16).replace("T", " "),
              tone: r.channel === "offline" ? "warning" : "default",
            }))}
          />
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader kicker="Risk" title="Data quality & sync posture" subtitle="Signals requiring county or ministry attention" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {dataQualityAlerts.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{a.title}</p>
                  {a.county ? <p className="mt-0.5 text-[12px] text-slate-500">{a.county}</p> : null}
                </div>
                <StatusBadge tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "success"}>
                  {a.severity}
                </StatusBadge>
              </div>
            ))}
          </div>
          <AlertCard tone="warning" title="Offline drafts in queue">
            <p className="text-[13px] leading-relaxed">
              {draftRecords} records across {offlineSyncQueue.length} devices awaiting sync reconciliation.
            </p>
            <Link href="/field/sync-queue" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-forest-700 hover:text-forest-800">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              View sync queue
            </Link>
          </AlertCard>
        </div>
      </DashboardPanel>

      {tab === "dao" || tab === "cac" ? (
        <DashboardPanel>
          <SectionHeader kicker="Queue" title="Quick routing" subtitle="High-frequency reporting destinations for this role" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard href="/farmers" icon={Users} title="Farmer registry" description="Capture and update farmer identity records." />
            <QuickActionCard href="/field/inspections" icon={ClipboardList} title="Inspections" description="Geo-stamped field inspection visits." />
            <QuickActionCard href="/map" icon={FileBarChart} title="Operational map" description="County and corridor geospatial workspace." />
            <QuickActionCard href="/alerts" icon={AlertTriangle} title="Escalations" description="Route unresolved anomalies to ministry desks." />
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
