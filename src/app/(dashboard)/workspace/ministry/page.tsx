import Link from "next/link";
import { redirect } from "next/navigation";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { Panel, QueueRow, StatTile } from "@/components/workspace/ui";
import {
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  nationalHeroMetrics,
} from "@/lib/demo/agriculture-pilot-data";
import { assertPilotWorkspaceAccess } from "@/lib/auth/workspace-access";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

export default async function MinistryWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  const effective = profile ?? buildDemoProfileForAuthUser(user);
  const gate = assertPilotWorkspaceAccess(effective.role, "ministry");
  if (!gate.ok) redirect(gate.redirectTo);

  const nf = (n: number) => Intl.NumberFormat().format(n);
  const hero = nationalHeroMetrics;
  const pipeline = farmerRegistrationPipeline;
  const fi = foodSecurityIndicators;

  return (
    <MinistryPageShell
      title="National command"
      kicker="National Operations · Ministry of Agriculture"
      description="National status across the 15 counties — operational posture, reporting health, and risk signals."
      actions={<SyncStatusIndicator />}
    >
      {/* National status strip — seeded pilot metrics */}
      <div className="gov-kicker gov-kicker-gold">National status</div>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
        <StatTile href="/farmers" label="Registered farmers" value={nf(hero.registeredFarmers)} hint={`${nf(pipeline.verified)} verified`} />
        <StatTile href="/national-heat-map" label="Counties reporting" value={`${hero.countiesReporting}/15`} hint="national coverage" />
        <StatTile href="/inventory" label="Input coverage" value={`${hero.inputInventoryCoveragePct}%`} hint="allocation reach" />
        <StatTile href="/food-security" label="Food risk index" value={String(fi.nationalRiskScore)} hint="composite ministry index" />
        <StatTile href="/verification-queue" label="Pending verification" value={nf(pipeline.pendingVerification)} hint="awaiting CAC decision" />
        <StatTile href="/field-agents" label="Active field officers" value={nf(hero.activeFieldOfficers)} hint={`${hero.activeCountyAgOfficers} county coordinators`} />
        <StatTile href="/compliance/anomalies" label="Data quality" value={`${hero.dataQualityScore}%`} hint="integrity score" />
        <StatTile href="/field/sync-queue" label="Offline pending" value={nf(hero.offlinePendingSync)} hint="awaiting reconcile" />
      </div>

      {/* Command + county map */}
      <div className="gov-kicker gov-kicker-gold mt-6">Map &amp; command</div>
      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          href="/command-center"
          className="group gov-card gov-card-hover flex flex-col justify-between p-5 lg:col-span-1"
        >
          <div>
            <div className="gov-kicker gov-kicker-gold">National command center</div>
            <div className="mt-2 font-serif-display text-[22px] leading-tight text-slate-900">
              National operational posture
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              Live aggregation across programmes, counties, and the reporting pipeline.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[rgb(var(--ministry-gold-strong))]">
            Open command center <span className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </Link>

        {/* Map-first county status entry — emerald-accented light card */}
        <Link
          href="/national-heat-map"
          className="group relative overflow-hidden gov-card gov-card-hover lg:col-span-2"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,23,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div className="relative flex h-full min-h-[180px] flex-col justify-between p-5">
            <div>
              <div className="gov-kicker gov-kicker-gold">County map & status</div>
              <div className="mt-2 font-serif-display text-[24px] leading-tight text-slate-900">
                National heat map
              </div>
              <p className="mt-2 max-w-md text-[12px] leading-relaxed text-slate-600">
                County-level intelligence and signals across the country.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
              View county map <span className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Required action · risk · recent activity */}
      <div className="gov-kicker gov-kicker-gold mt-6">Required action &amp; signals</div>
      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Required action" hint="Queues awaiting a national decision">
          <div className="space-y-0.5">
            <QueueRow href="/verification-queue" title="Verification queue" meta={`${Intl.NumberFormat().format(pipeline.pendingVerification)} pending CAC review`} tone="alert" badge="Act" />
            <QueueRow href="/registration-approvals" title="Registration approvals" meta={`${Intl.NumberFormat().format(pipeline.flagged)} flagged registrations`} tone="escalation" />
            <QueueRow href="/field/sync-queue" title="Offline reconcile" meta={`${hero.offlinePendingSync} records awaiting sync`} />
          </div>
        </Panel>

        <Panel title="Risk signals" hint="What needs national attention">
          <div className="space-y-0.5">
            <QueueRow href="/alerts" title="Escalations & incidents" meta="Unresolved anomalies requiring oversight" tone="alert" />
            <QueueRow href="/food-security" title="Food security" meta={`Risk index ${fi.nationalRiskScore} · early-warning`} tone="escalation" />
            <QueueRow href="/compliance/anomalies" title="Compliance anomalies" meta="Distribution and data integrity" tone="escalation" />
          </div>
        </Panel>

        <Panel title="Reporting & recent activity" hint="Pipeline, analytics, and oversight">
          <div className="space-y-0.5">
            <QueueRow href="/reports" title="Reporting & analytics" meta="Ministry reporting center and exports" tone="ok" />
            <QueueRow href="/reporting/workspace" title="Reporting operations center" meta="DAO & CAC consolidation surfaces" />
            <QueueRow href="/activity" title="Audit & activity center" meta="Recent system actions timeline" />
            <QueueRow href="/compliance/audit-log" title="Audit log" meta="Immutable trail for oversight" />
          </div>
        </Panel>
      </div>
    </MinistryPageShell>
  );
}
