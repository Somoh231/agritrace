import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  FileBarChart,
  Map,
  ShieldAlert,
  Users,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceNotice,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Timeline,
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

function ReportingRouteCard({
  title,
  body,
  href,
  meta,
}: {
  title: string;
  body: string;
  href: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-forest-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-ink-900 truncate">{title}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{body}</p>
        </div>
        <span className="shrink-0 font-mono text-[13px] text-forest-600 transition group-hover:translate-x-0.5">→</span>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{meta}</p>
    </Link>
  );
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
    offlineSource("offlineSyncQueue counts are illustrative — use /field/sync-queue for real IndexedDB"),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <DataSourceNotice source={reportingSource} />
      <PageHeader
        kicker="Operations · DAO & CAC reporting"
        title="National reporting control center"
        description="Unified reporting workspace. Operational chain: CLAN field capture → DAO district review and consolidation → CAC county verification and approval → Ministry national aggregation and intelligence."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <InstallAppButton label="Install App" />
            <Link href="/field/sync-queue" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
              Offline queue
            </Link>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">
              <SyncStatusIndicator />
            </div>
          </div>
        }
      />

      <RegistryKpiStrip
        items={[
          {
            label: "Counties reporting",
            value: `${hero.countiesReporting}/15`,
            hint: "Pilot cadence",
            href: "/national-heat-map",
          },
          {
            label: "Active field officers",
            value: nf(hero.activeFieldOfficers),
            hint: `${hero.activeCountyAgOfficers} county coordinators`,
            href: "/field-agents",
          },
          {
            label: "Pending verification",
            value: nf(pipeline.pendingVerification),
            hint: "Awaiting CAC decision",
            href: "/verification-queue",
          },
          {
            label: "Active alerts",
            value: String(activeAlerts),
            hint: "Escalations & quality signals",
            href: "/alerts",
            deltaTone: activeAlerts > 0 ? "down" : "up",
          },
        ]}
      />

      <AlertCard tone="info" title="Operational posture">
        Offline-first capture is supported. Workflow decisions and audits remain authoritative and traceable across counties.
      </AlertCard>

      <DashboardPanel>
        <SectionHeader kicker="Queue" title="Offline field operations" subtitle="Install, sync queue, and GPS readiness for DAO capture teams" />
        <div className="mt-4">
          <OfflineFieldOperationsCard />
        </div>
      </DashboardPanel>

      <DashboardPanel>
        <SectionHeader kicker="Status" title="Reporting pipeline tabs" subtitle={tabMeta.hint} />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {REPORTING_TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                href={`/reporting/workspace?tab=${t.id}`}
                className={[
                  "inline-flex h-9 items-center rounded-lg border px-3 text-[12px] transition",
                  active
                    ? "border-forest-300 bg-forest-50 font-medium text-forest-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-forest-200",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <QuickActionCard
          href="/verification-queue"
          icon={ClipboardList}
          title="Verification desk"
          description="Approve, reject, escalate, and assign investigations across the unified queue."
        />
        <QuickActionCard
          href="/reports/export"
          icon={FileBarChart}
          title="Export center"
          description="Download reporting packages and data extracts for ministry cycles."
        />
        <QuickActionCard
          href="/food-security"
          icon={ShieldAlert}
          title="Food security intelligence"
          description="Early-warning signals and county vulnerability derived from field reporting."
        />
      </div>

      <div className="space-y-5">
        {sections.map((sec) => (
          <DashboardPanel key={sec.label}>
            <SectionHeader kicker="Required action" title={sec.label} />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sec.items.map((item) => (
                <ReportingRouteCard key={item.href} {...item} />
              ))}
            </div>
          </DashboardPanel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader kicker="Recent activity" title="Latest field submissions" subtitle="Illustrative pilot cadence from DAO capture channels" />
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

        <DashboardPanel>
          <SectionHeader kicker="Risk" title="Data quality & sync posture" subtitle="Signals requiring county or ministry attention" />
          <div className="mt-4 space-y-2">
            {dataQualityAlerts.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{a.title}</p>
                  {a.county ? <p className="mt-0.5 text-[11px] text-slate-500">{a.county}</p> : null}
                </div>
                <StatusBadge tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "success"}>
                  {a.severity}
                </StatusBadge>
              </div>
            ))}
            <AlertCard tone="warning" title="Offline drafts in queue">
              {draftRecords} records across {offlineSyncQueue.length} devices awaiting sync reconciliation.
            </AlertCard>
          </div>
        </DashboardPanel>
      </div>

      {tab === "dao" || tab === "cac" ? (
        <DashboardPanel>
          <SectionHeader kicker="Queue" title="Quick routing" subtitle="High-frequency reporting destinations for this role" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard href="/farmers" icon={Users} title="Farmer registry" description="Capture and update farmer identity records." />
            <QuickActionCard href="/field/inspections" icon={ClipboardList} title="Inspections" description="Geo-stamped field inspection visits." />
            <QuickActionCard href="/map" icon={Map} title="Operational map" description="County and corridor geospatial workspace." />
            <QuickActionCard href="/alerts" icon={AlertTriangle} title="Escalations" description="Route unresolved anomalies to ministry desks." />
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
