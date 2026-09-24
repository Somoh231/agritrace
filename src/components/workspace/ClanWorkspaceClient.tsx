"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  RefreshCw,
  Satellite,
  UserPlus,
} from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceBadge,
  DataSourceNotice,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { fieldReports } from "@/lib/demo/agriculture-pilot-data";
import { demoSource, liveSource, offlineSource, resolveDisplaySource } from "@/lib/data/data-source";
import { getPendingCount } from "@/lib/offline/sync-queue";
import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

const SAMPLE_TASKS = [
  { id: "1", title: "Land boundary mapping — Parcel 882", meta: "Gbarnga · 09:15", tone: "warning" as const, badge: "In progress" },
  { id: "2", title: "Farmer registration — Kollie family", meta: "Bong · 10:40", tone: "neutral" as const, badge: "Pending" },
  { id: "3", title: "Inspection follow-up — WH-04", meta: "Completed · 08:02", tone: "success" as const, badge: "Verified" },
];

const SAMPLE_RECENT = [
  { id: "a", title: "Boundary polygon captured", meta: "4 corners · ~2.1 ha", time: "11:02" },
  { id: "b", title: "Crop health photo attached", meta: "Rice plot · sector NW", time: "10:48" },
  { id: "c", title: "Farmer ID verified offline", meta: "Queued for DAO review", time: "09:30" },
];

const SAMPLE_PROGRESS = [
  { label: "Soil health analysis", pct: 78 },
  { label: "Subsidy auditing", pct: 42 },
  { label: "Warehouse validation", pct: 100 },
];

// Task assignment and capture history are not yet backed by live tables; show
// them only in an explicitly illustrative training environment.
const TASKS = ILLUSTRATIVE_DATA_ENABLED ? SAMPLE_TASKS : [];
const RECENT = ILLUSTRATIVE_DATA_ENABLED ? SAMPLE_RECENT : [];
const PROGRESS = ILLUSTRATIVE_DATA_ENABLED ? SAMPLE_PROGRESS : [];

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">{children}</p>;
}

export default function ClanWorkspaceClient() {
  const [pending, setPending] = React.useState(0);
  const [online, setOnline] = React.useState<boolean | null>(null);

  const pageSource = resolveDisplaySource([
    demoSource("Field task list and recent activity samples"),
    pending > 0 ? offlineSource(`${pending} records in IndexedDB sync queue`) : liveSource("No pending offline captures"),
  ]);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    void getPendingCount().then(setPending);
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Field operations"
        title="CLAN field workspace"
        description="Field capture, farm registration, GPS boundaries, and offline-first reporting. Submissions flow to the District Agriculture Officer (DAO) for district review."
        actions={
          <>
            <DataSourceBadge source={pageSource} />
            <InstallAppButton label="Install App" />
            <SyncStatusIndicator />
          </>
        }
      />

      <DataSourceNotice source={pageSource} />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12px] text-slate-700">
        <span className="inline-flex items-center gap-1.5">
          <Satellite className="h-3.5 w-3.5 text-forest-700" aria-hidden />
          GPS accuracy is measured when you capture a boundary
        </span>
        <span className="text-slate-300" aria-hidden>|</span>
        <span>
          Network · {online === null ? "Checking…" : online ? "Online" : "Offline — drafts saved"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard
          href="/field/boundary-capture"
          icon={MapPin}
          title="Capture boundary"
          description="Walk farm corners with GPS. Outline saves locally when offline."
        />
        <QuickActionCard
          href="/farmers"
          icon={UserPlus}
          title="Register farmer"
          description="National registry capture with district assignment and traceability."
        />
        <QuickActionCard
          href="/field/mobile"
          icon={ClipboardList}
          title="Submit field report"
          description="Daily logs, crop health, and operational notes for DAO consolidation."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <DashboardPanel>
            <SectionHeader kicker="Today&apos;s work" title="Assigned field tasks" />
            {TASKS.length === 0 ? (
              <EmptyLine>No tasks are assigned to you. New registrations and captures start from the actions above.</EmptyLine>
            ) : null}
            <ul className="mt-4 space-y-2">
              {TASKS.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900">{t.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-600">{t.meta}</p>
                  </div>
                  <StatusBadge
                    tone={t.badge === "Verified" ? "success" : t.badge === "In progress" ? "syncing" : "warning"}
                  >
                    {t.badge}
                  </StatusBadge>
                </li>
              ))}
            </ul>
            <Link href="/field/inspections" className="mt-4 inline-flex text-[13px] font-medium text-forest-700 hover:text-forest-600">
              Open inspection queue →
            </Link>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader kicker="Workflow" title="Active workflow progress" />
            {PROGRESS.length === 0 ? <EmptyLine>No active workflow campaigns are recorded for your area.</EmptyLine> : null}
            <div className="mt-4 space-y-4">
              {PROGRESS.map((w) => (
                <div key={w.label}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="font-medium text-slate-800">{w.label}</span>
                    <span className="font-mono text-slate-500">{w.pct === 100 ? "Done" : `${w.pct}%`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-forest-600 transition-all"
                      style={{ width: `${w.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader kicker="Activity" title="Recent field reports" />
            {fieldReports.length === 0 ? <EmptyLine>No field reports recorded yet.</EmptyLine> : null}
            <ul className="mt-3 space-y-2 text-[13px] text-slate-700">
              {fieldReports.slice(0, 4).map((r) => (
                <li key={r.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                  <span className="line-clamp-2">{r.summary}</span>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">{r.county}</span>
                </li>
              ))}
            </ul>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel className="border-amber-200/80 bg-amber-50/30">
            <SectionHeader
              kicker="Offline queue"
              title={`${pending} items pending`}
              subtitle="Data safely stored on device until connectivity returns."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {pending > 0 ? (
                <StatusBadge tone="warning">Sync required</StatusBadge>
              ) : (
                <StatusBadge tone="success">Up to date</StatusBadge>
              )}
            </div>
            <Link
              href="/field/sync-queue"
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 text-[14px] font-medium text-white hover:bg-ink-800"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              View offline queue
            </Link>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader kicker="Captures" title="Recent captures" />
            {RECENT.length === 0 ? (
              <EmptyLine>No captures on this device yet.</EmptyLine>
            ) : (
              <Timeline items={RECENT} className="mt-3" />
            )}
          </DashboardPanel>

          <AlertCard tone="success" title="Field guidelines">
            Maintain GPS accuracy under 10m before boundary capture. Drafts sync automatically when online. Use high-contrast mode in direct sunlight if needed.
          </AlertCard>
        </div>
      </div>

      <DashboardPanel className="bg-gradient-to-r from-forest-800 to-forest-900 border-forest-900 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/80">Offline field use</p>
            <p className="mt-1 text-[15px] font-semibold">Install Agrivault Data for field reporting and GPS capture</p>
          </div>
          <InstallAppButton variant="primary" label="Install for offline use" className="!bg-amber-400 !text-ink-900 hover:!bg-amber-300" />
        </div>
      </DashboardPanel>
    </div>
  );
}
