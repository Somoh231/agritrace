"use client";

import * as React from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import LiberiaCountyMap from "@/components/ais/LiberiaCountyMap";
import AiOperationalIntelligenceRail from "@/components/ai/AiOperationalIntelligenceRail";
import OperationalActivityRail from "@/components/ais/OperationalActivityRail";
import OperationalQueuesPanel from "@/components/ais/OperationalQueuesPanel";
import { useNationalAISLive } from "@/components/ais/useNationalAISLive";
import { OpsStatusBadge } from "@/components/pilot/pilot-ui";
import ProgressBar from "@/components/shared/ProgressBar";
import {
  dataQualityAlerts,
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  inputDistributionProgress,
  nationalHeroMetrics,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import { ministryWarehouseToSignalRow } from "@/lib/data/ministry-data-service";
import { PILOT_COUNTIES } from "@/lib/utils/pilot-config";
import { safePct } from "@/lib/utils/rice";

function targetActualPct(actualMt: number, targetMt: number) {
  return safePct(actualMt * 1000, Math.max(1, targetMt * 1000));
}

function ragFromStatus(s: "healthy" | "warning" | "critical") {
  if (s === "healthy") return "text-emerald-300 border-emerald-500/35 bg-emerald-500/10";
  if (s === "warning") return "text-amber-200 border-amber-500/35 bg-amber-500/10";
  return "text-rose-200 border-rose-500/35 bg-rose-500/10";
}

function countySyntheticCompliance(c: { status: string; lossPct: number }) {
  let score = 88;
  if (c.status === "warning") score = 68;
  if (c.status === "critical") score = 44;
  score -= Math.min(15, Math.round(c.lossPct / 3));
  return Math.max(32, Math.min(96, score));
}

export default function MinistryCommandCenter() {
  const live = useNationalAISLive();
  const hero = nationalHeroMetrics;
  const fi = foodSecurityIndicators;
  const p = farmerRegistrationPipeline;

  const prodMt = live.productionMt;
  const targetMt = live.targetMt;
  const productionProgress = targetActualPct(prodMt, targetMt);
  const lossRate = live.lossRatePct;
  const countiesRanked = live.countiesRanked.slice(0, 15);

  const riskByCounty = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of countiesRanked) {
      m[c.county] = c.status === "critical" ? 78 : c.status === "warning" ? 52 : 28;
    }
    return m;
  }, [countiesRanked]);

  const daoComplianceAvg = React.useMemo(() => {
    if (!countiesRanked.length) return 0;
    const sum = countiesRanked.reduce((s, c) => s + countySyntheticCompliance(c), 0);
    return Math.round(sum / countiesRanked.length);
  }, [countiesRanked]);

  const activeAlerts =
    postHarvestLossAlerts.filter((a) => a.lossPct > 10).length + dataQualityAlerts.length;

  return (
    <div className="space-y-6 pb-10">
      {/* National hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-[#07140d] via-[#0f2918] to-[#0c1f3a] px-6 py-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(52,211,153,0.5), transparent 45%), radial-gradient(circle at 80% 30%, rgba(251,191,36,0.25), transparent 40%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[980px] space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-emerald-200/80">
              Ministry Agricultural Intelligence System · Liberia
            </div>
            <h1 className="font-display text-[clamp(1.55rem,3vw,2.25rem)] font-semibold tracking-tight leading-tight">
              National Agricultural Intelligence System
            </h1>
            <p className="text-[13px] leading-relaxed text-emerald-50/90">
              Ministry-owned operational layer for farmer registry, inputs logistics, production intelligence, food security posture,
              county reporting, and DAO coordination — built as sovereign national infrastructure.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] text-emerald-100/90">
                Season {live.season}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] text-emerald-100/90">
                Pilot counties · {PILOT_COUNTIES.join(" · ")}
              </span>
              <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-50">
                {live.usingFallbackSignals ? "Multi-source intelligence blend" : "Primary ministry operational tables"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] text-emerald-50/90">
                Data freshness · rolling 24h reconcile
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur-md">
            <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-100/75">National posture</div>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusBadge status={fi.nationalRiskScore > 58 ? "warning" : "healthy"} />
              <span className="text-[12px] text-emerald-50/95">
                Food risk index {fi.nationalRiskScore} · {activeAlerts} active coordination signals
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {[
            { label: "Registered farmers", value: Intl.NumberFormat().format(live.farmersCount) },
            {
              label: "Domestic rice (est.)",
              value: `${prodMt.toFixed(0)} t`,
              hint: `${productionProgress.toFixed(1)}% of ${targetMt.toFixed(0)} t national target`,
            },
            { label: "Import dependency", value: `${hero.importDependencyPct}%`, hint: "National supply lens" },
            { label: "Warehouse coverage", value: `${hero.inputInventoryCoveragePct}%`, hint: "Inputs reach / allocation" },
            { label: "DAO reporting compliance", value: `${daoComplianceAvg}%`, hint: "Synthetic cadence index" },
            { label: "Subsidy utilization", value: `${hero.inputInventoryCoveragePct}%`, hint: "Programme absorption" },
            { label: "Food security risk", value: `${fi.nationalRiskScore}`, hint: "Composite ministry index" },
            { label: "Active alerts", value: `${activeAlerts}`, hint: "Escalations & quality signals" },
            { label: "County reporting", value: `${hero.countiesReporting}/${hero.countiesActivePilot}`, hint: "Pilot cadence" },
            { label: "DAO roster pulse", value: `${hero.activeFieldOfficers}`, hint: "Active district officers" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-3 shadow-inner backdrop-blur-sm transition hover:bg-white/[0.07]"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200/55">{m.label}</div>
              <div className="mt-1.5 font-display text-lg font-semibold tabular-nums text-white">{m.value}</div>
              {m.hint ? <div className="mt-1 text-[10px] text-emerald-100/65">{m.hint}</div> : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="space-y-6 min-w-0">
          <LiberiaCountyMap className="[&_svg]:min-h-[340px] lg:[&_svg]:min-h-[420px]" counties={countiesRanked} riskByCounty={riskByCounty} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/90 to-emerald-950/30 p-5 text-white backdrop-blur-md">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/65">Farmer registration pipeline</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] text-emerald-100/60">Verified</div>
                  <div className="font-display text-xl font-semibold">{Intl.NumberFormat().format(p.verified)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] text-emerald-100/60">Pending</div>
                  <div className="font-display text-xl font-semibold">{Intl.NumberFormat().format(p.pendingVerification)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] text-emerald-100/60">Geo completion</div>
                  <div className="font-display text-xl font-semibold">{p.geoTaggedPct}%</div>
                </div>
                <div className="rounded-lg border border-rose-500/25 bg-rose-950/25 px-3 py-2">
                  <div className="text-[10px] text-rose-100/70">Flagged</div>
                  <div className="font-display text-xl font-semibold">{Intl.NumberFormat().format(p.flagged)}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/farmers" className="inline-flex text-[12px] font-medium text-emerald-200 underline-offset-4 hover:underline">
                  Farmer registry →
                </Link>
                <Link href="/national-heat-map" className="inline-flex text-[12px] font-medium text-emerald-200/90 underline-offset-4 hover:underline">
                  National heat map workspace →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-white/[0.03] p-5 backdrop-blur-sm text-slate-100">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Production intelligence</div>
              <div className="mt-2 font-display text-[17px] font-semibold text-white">County attainment overview</div>
              <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                Production trajectory integrates pilot ministry metrics and seasonal rice records when synchronized.
              </p>
              <div className="mt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={countiesRanked.slice(0, 8).map((c) => ({
                      county: c.county.slice(0, 6),
                      t: Math.round(c.productionMt),
                    }))}
                  >
                    <XAxis dataKey="county" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={36} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                    <Bar dataKey="t" fill="#34d399" radius={[4, 4, 0, 0]} opacity={0.92} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Link href="/production/county" className="mt-3 inline-flex text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                County dashboards →
              </Link>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-700/60 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">County performance</div>
                <h2 className="mt-1 font-display text-[17px] font-semibold text-white">Production · compliance · DAO responsiveness</h2>
              </div>
              <Link href="/production/county" className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                County intelligence →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {countiesRanked.slice(0, 9).map((c) => {
                const compliance = countySyntheticCompliance(c);
                const daoPulse = c.status === "healthy" ? "high" : c.status === "warning" ? "medium" : "escalated";
                const subsidy = c.status === "critical" ? "behind" : c.status === "warning" ? "monitor" : "on track";
                const inv = c.lossPct > 12 ? "stress" : "stable";
                const food = c.status === "critical" ? "elevated" : "controlled";
                return (
                  <div
                    key={c.county}
                    className={`rounded-xl border px-4 py-3 ${ragFromStatus(c.status)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[14px] font-semibold">{c.county}</span>
                      <OpsStatusBadge status={c.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] opacity-95">
                      <span>Production</span>
                      <span className="text-right tabular-nums">{c.productionMt.toFixed(1)} t</span>
                      <span>Reporting</span>
                      <span className="text-right">{compliance}%</span>
                      <span>DAO pulse</span>
                      <span className="text-right capitalize">{daoPulse}</span>
                      <span>Subsidy</span>
                      <span className="text-right capitalize">{subsidy}</span>
                      <span>Inventory</span>
                      <span className="text-right capitalize">{inv}</span>
                      <span>Food risk</span>
                      <span className="text-right capitalize">{food}</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        valuePct={targetActualPct(c.productionMt, c.targetMt)}
                        tone={c.status === "critical" ? "red" : c.status === "warning" ? "amber" : "green"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </section>

          <section className="rounded-2xl border border-slate-700/60 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Inputs & warehouses</div>
                <h2 className="mt-1 font-display text-[17px] font-semibold text-white">National inventory posture</h2>
              </div>
              <Link href="/inventory" className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                National logistics workspace →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="text-[12px] font-medium text-slate-200">Fertilizer programme</div>
                <ProgressBar
                  valuePct={safePct(
                    inputDistributionProgress.fertilizerDistributedMt * 1000,
                    inputDistributionProgress.fertilizerAllocatedMt * 1000,
                  )}
                  tone="green"
                />
                <div className="mt-1 font-mono text-[11px] text-slate-400">
                  {inputDistributionProgress.fertilizerDistributedMt.toLocaleString()} /{" "}
                  {inputDistributionProgress.fertilizerAllocatedMt.toLocaleString()} t
                </div>
              </div>
              <div>
                <div className="text-[12px] font-medium text-slate-200">Rice seed programme</div>
                <ProgressBar
                  valuePct={safePct(
                    inputDistributionProgress.seedDistributedMt * 1000,
                    inputDistributionProgress.seedAllocatedMt * 1000,
                  )}
                  tone="green"
                />
                <div className="mt-1 font-mono text-[11px] text-slate-400">
                  {inputDistributionProgress.seedDistributedMt.toLocaleString()} /{" "}
                  {inputDistributionProgress.seedAllocatedMt.toLocaleString()} t
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-slate-700 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">County</th>
                    <th className="py-2 pr-3">Seed (t)</th>
                    <th className="py-2 pr-3">Fertilizer (t)</th>
                    <th className="py-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {MINISTRY_WAREHOUSES.slice(0, 10).map((mw) => {
                    const w = ministryWarehouseToSignalRow(mw);
                    return (
                      <tr key={mw.ministryCode} className="border-b border-slate-800/80">
                        <td className="py-2 pr-3 font-medium">
                          <Link
                            href={`/inventory/warehouse/${encodeURIComponent(mw.ministryCode)}`}
                            className="hover:text-emerald-300"
                          >
                            <span className="font-mono text-[10px] text-emerald-200/80">{mw.ministryCode}</span>
                            <span className="block text-[12px] text-white">{mw.name}</span>
                          </Link>
                        </td>
                        <td className="py-2 pr-3">{w.county}</td>
                        <td className="py-2 pr-3 tabular-nums">{w.riceSeedTons}</td>
                        <td className="py-2 pr-3 tabular-nums">{w.fertilizerTons}</td>
                        <td className="py-2">
                          <OpsStatusBadge status={w.stockRisk} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700/60 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Food security intelligence</div>
                <h2 className="mt-1 font-display text-[17px] font-semibold text-white">Demand · domestic supply · gap analysis</h2>
              </div>
              <Link href="/food-security" className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                Intelligence dashboard →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                <div className="text-[11px] text-slate-400">Indicative rice demand</div>
                <div className="mt-1 font-display text-2xl font-semibold text-white">{Intl.NumberFormat().format(fi.riceDemandMt)} t</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                <div className="text-[11px] text-slate-400">Domestic production (est.)</div>
                <div className="mt-1 font-display text-2xl font-semibold text-emerald-200">{Intl.NumberFormat().format(fi.domesticProductionMt)} t</div>
              </div>
              <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3">
                <div className="text-[11px] text-amber-100/80">Import dependency lens</div>
                <div className="mt-1 font-display text-2xl font-semibold text-amber-100">{hero.importDependencyPct}%</div>
                <div className="mt-1 text-[11px] text-amber-100/70">{fi.importDependencyTrend}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-[12px] text-slate-300">
                <span className="font-medium text-white">Post-harvest loss rate · national</span>
                <span className="ml-2 font-display text-xl tabular-nums text-emerald-200">{lossRate.toFixed(1)}%</span>
                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{fi.countyForecastNote}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-[12px] text-slate-300">
                <span className="font-medium text-white">Operational loss posture</span>
                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  District Agriculture Officers synchronize field verification with warehouse releases; anomalies route to compliance queue.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-slate-100">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Briefing readiness</div>
              <div className="mt-2 font-display text-[15px] font-semibold text-white">Cabinet & donor packs</div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Consolidated PDF exports with subsidy traceability and warehouse disposition tables.
              </p>
              <Link href="/reports/pdf" className="mt-3 inline-flex text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                Open exports →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-slate-100">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Next operational moves</div>
              <div className="mt-2 font-display text-[15px] font-semibold text-white">Queues & approvals</div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
                <li>Clear DAO overdue submissions in verification queue</li>
                <li>Approve county replenishment where utilization exceeds threshold</li>
              </ul>
              <Link href="/verification-queue" className="mt-3 inline-flex text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                Verification queue →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-slate-100">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Compliance snapshot</div>
              <div className="mt-2 font-display text-[15px] font-semibold text-white">Audit posture</div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Immutable audit log streams with procurement checkpoints and anomaly routing.
              </p>
              <Link href="/compliance/audit-log" className="mt-3 inline-flex text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                Audit log →
              </Link>
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              href="/executive-briefing"
              className="inline-flex h-11 items-center rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-5 text-[13px] font-medium text-emerald-50 hover:bg-emerald-900/50"
            >
              National overview
            </Link>
            <Link
              href="/reports/pdf"
              className="inline-flex h-11 items-center rounded-xl border border-white/15 bg-white/[0.06] px-5 text-[13px] font-medium text-white hover:bg-white/10"
            >
              Ministry exports
            </Link>
            <Link
              href="/subsidies/verification"
              className="inline-flex h-11 items-center rounded-xl border border-white/10 px-5 text-[13px] text-emerald-100/90 hover:bg-white/[0.05]"
            >
              Subsidy verification
            </Link>
          </section>
        </div>

        <div className="space-y-5 min-w-0 xl:sticky xl:top-24 self-start">
          <AiOperationalIntelligenceRail />
          <OperationalActivityRail />
          <OperationalQueuesPanel />
        </div>
      </div>
    </div>
  );
}
