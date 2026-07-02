"use client";

import Link from "next/link";

import OperationalActivityRail from "@/components/ais/OperationalActivityRail";
import OperationalQueuesPanel from "@/components/ais/OperationalQueuesPanel";
import AiOperationalIntelligenceRail from "@/components/ai/AiOperationalIntelligenceRail";
import {
  AlertCard,
  DashboardPanel,
  KpiCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Timeline,
} from "@/components/enterprise";
import NationalOperationalIntelStrip from "@/components/operations/NationalOperationalIntelStrip";
import OperationalWorkflowPipeline from "@/components/operations/OperationalWorkflowPipeline";
import { OpsStatusBadge } from "@/components/pilot/pilot-ui";
import { dataQualityAlerts, nationalHeroMetrics, postHarvestLossAlerts } from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { ministryWarehouseToSignalRow } from "@/lib/data/ministry-data-service";

const FEED = [
  { id: "1", title: "Anomaly detected — grain storage moisture", meta: "WH-02 · critical", time: "12m ago", tone: "danger" as const },
  { id: "2", title: "Subsidy disbursement delay — Bong", meta: "DAO escalation", time: "45m ago", tone: "warning" as const },
  { id: "3", title: "Offline sync — 1,200 field agents", meta: "Queue cleared", time: "1h ago", tone: "success" as const },
];

/** Operational intelligence center — distinct presentation from executive command center. */
export default function NationalOperationsIntelligence() {
  const hero = nationalHeroMetrics;
  const activeAlerts =
    postHarvestLossAlerts.filter((a) => a.lossPct > 10).length + dataQualityAlerts.length;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        kicker="Live intelligence"
        title="National operations"
        description="Mission control terminal for verification pipelines, warehouse network posture, regional performance, and live operational feed."
        actions={
          <Link
            href="/executive-briefing"
            className="inline-flex h-10 items-center rounded-xl bg-forest-800 px-4 text-[13px] font-medium text-white hover:bg-forest-900"
          >
            Cabinet brief
          </Link>
        }
      />

      <AlertCard tone="info" title="Executive summary">
        {hero.countiesActivePilot} pilot counties reporting · {hero.countiesReporting} consolidated this cycle ·{" "}
        {activeAlerts} active coordination signals. Warehouse utilization and DAO verification cadence drive national posture.
      </AlertCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active programmes" value="14" delta="+2.4%" deltaTone="up" hint="National scope" />
        <KpiCard label="Total throughput" value="1.2M MT" delta="-0.8%" deltaTone="down" hint="Season aggregate" />
        <KpiCard label="Pending verifications" value={`${hero.offlinePendingSync + 42}`} hint="Queue + field" />
        <KpiCard label="Active alerts" value={String(activeAlerts)} hint="Escalations & quality" />
      </div>

      <NationalOperationalIntelStrip />
      <OperationalWorkflowPipeline />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6 min-w-0">
          <DashboardPanel>
            <SectionHeader
              kicker="Verification"
              title="Verification pipeline"
              subtitle="Field capture → QC audit → bureau review → cabinet"
            />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { stage: "Field capture", n: 428 },
                { stage: "QC audit", n: 382, tag: "Bottleneck" },
                { stage: "Bureau review", n: 124 },
                { stage: "Cabinet", n: 20 },
              ].map((s) => (
                <div
                  key={s.stage}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-center"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{s.stage}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-900">{s.n}</p>
                  {s.tag ? (
                    <StatusBadge tone="warning" className="mt-2">
                      {s.tag}
                    </StatusBadge>
                  ) : null}
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader kicker="Live feed" title="Operational activity" />
            <Timeline items={FEED} className="mt-4" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/alerts" className="text-[13px] font-medium text-forest-700">
                View escalations →
              </Link>
              <Link href="/activity" className="text-[13px] font-medium text-slate-600">
                Activity center →
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <SectionHeader
              kicker="Warehouse network"
              title="National inventory posture"
              action={
                <Link href="/logistics" className="text-[13px] font-medium text-forest-700">
                  Warehouse command →
                </Link>
              }
            />
            <div className="mt-4 overflow-x-auto">
              <table className="enterprise-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>County</th>
                    <th>Seed (t)</th>
                    <th>Fertilizer (t)</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {MINISTRY_WAREHOUSES.slice(0, 8).map((mw) => {
                    const w = ministryWarehouseToSignalRow(mw);
                    return (
                      <tr key={mw.ministryCode}>
                        <td>
                          <span className="font-mono text-[10px] text-forest-700">{mw.ministryCode}</span>
                          <span className="block font-medium">{mw.name}</span>
                        </td>
                        <td>{w.county}</td>
                        <td className="tabular-nums">{w.riceSeedTons}</td>
                        <td className="tabular-nums">{w.fertilizerTons}</td>
                        <td>
                          <OpsStatusBadge status={w.stockRisk} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-5 min-w-0 xl:sticky xl:top-6 self-start">
          <AiOperationalIntelligenceRail />
          <OperationalActivityRail />
          <OperationalQueuesPanel />
        </div>
      </div>
    </div>
  );
}
