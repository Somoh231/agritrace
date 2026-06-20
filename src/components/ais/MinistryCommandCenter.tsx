"use client";

import * as React from "react";
import Link from "next/link";

import { useNationalAISLive } from "@/components/ais/useNationalAISLive";
import {
  dataQualityAlerts,
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  inputDistributionProgress,
  nationalHeroMetrics,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";
import { safePct } from "@/lib/utils/rice";

const nf = (n: number) => Intl.NumberFormat().format(Math.round(n));

type SignOff = "Signed" | "Reviewing" | "Pending";

function signOffMeta(s: SignOff): { dot: string; text: string } {
  if (s === "Signed") return { dot: "bg-emerald-500", text: "text-emerald-700" };
  if (s === "Reviewing") return { dot: "bg-sky-500", text: "text-sky-700" };
  return { dot: "bg-amber-500", text: "text-amber-700" };
}

/** A miniature horizontal progress bar used inside the county rollup. */
function MiniBar({ pct, tone }: { pct: number; tone: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-1.5 w-16 rounded-full bg-slate-200">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(4, pct))}%` }} />
    </div>
  );
}

export default function MinistryCommandCenter() {
  const live = useNationalAISLive();
  const hero = nationalHeroMetrics;
  const fi = foodSecurityIndicators;
  const p = farmerRegistrationPipeline;

  const prodMt = live.productionMt;
  const targetMt = live.targetMt;
  const productionProgress = safePct(prodMt * 1000, Math.max(1, targetMt * 1000));
  const lossRate = live.lossRatePct;
  const countiesRanked = live.countiesRanked;

  const activeAlerts =
    postHarvestLossAlerts.filter((a) => a.lossPct > 10).length + dataQualityAlerts.length;

  const countyRows = React.useMemo(() => {
    return countiesRanked.slice(0, 9).map((c) => {
      const farmers = Math.max(900, Math.round(c.productionMt * 0.058));
      const verifiedPct =
        c.status === "critical"
          ? 62 + (c.county.length % 9)
          : c.status === "warning"
            ? 75 + (c.county.length % 6)
            : 87 + (c.county.length % 6);
      const signoff: SignOff = c.status === "critical" ? "Pending" : c.status === "warning" ? "Reviewing" : "Signed";
      return {
        county: c.county,
        productionMt: c.productionMt,
        farmers,
        verifiedPct: Math.min(96, verifiedPct),
        lossPct: c.lossPct,
        signoff,
      };
    });
  }, [countiesRanked]);

  const countiesAwaiting = countyRows.filter((r) => r.signoff !== "Signed").length;
  const maxProd = Math.max(1, ...countyRows.map((r) => r.productionMt));

  const kpis = [
    {
      label: "Rice production YTD",
      value: `${nf(prodMt)} MT`,
      trend: "↓ 12.4% YoY",
      hint: `${productionProgress.toFixed(0)}% of ${nf(targetMt)} MT season target`,
    },
    {
      label: "Import dependence",
      value: `${hero.importDependencyPct}%`,
      trend: "↓ 6 pts",
      hint: "National priority · from 82% (2022)",
    },
    {
      label: "Farmers registered",
      value: nf(live.farmersCount),
      trend: `↑ ${nf(p.pendingVerification)} mo`,
      hint: `${nf(p.verified)} verified · ${p.geoTaggedPct}% geo-boundaried`,
    },
    {
      label: "Post-harvest loss",
      value: `${lossRate.toFixed(1)}%`,
      trend: "↓ 1.8 pts",
      hint: "Target < 10% by 2027",
    },
  ];

  const seedPct = safePct(
    inputDistributionProgress.seedDistributedMt * 1000,
    inputDistributionProgress.seedAllocatedMt * 1000,
  );
  const fertPct = safePct(
    inputDistributionProgress.fertilizerDistributedMt * 1000,
    inputDistributionProgress.fertilizerAllocatedMt * 1000,
  );

  const programmes = [
    {
      label: "Voucher subsidies",
      value: "$3.84M",
      hint: "24,108 of 31,000 redeemed",
      pct: safePct(24108, 31000),
      tone: "ok" as const,
    },
    {
      label: "Certified seed",
      value: `${nf(inputDistributionProgress.seedDistributedMt)} MT`,
      hint: `NERICA-4 · ${seedPct.toFixed(0)}% of plan`,
      pct: seedPct,
      tone: "ok" as const,
    },
    {
      label: "Fertilizer dispatched",
      value: `${nf(inputDistributionProgress.fertilizerDistributedMt)} MT`,
      hint: "across 90 districts",
      pct: fertPct,
      tone: "ok" as const,
    },
    {
      label: "Plots EUDR-checked",
      value: nf(31890),
      hint: "97.6% deforestation-clear",
      pct: 97.6,
      tone: "warn" as const,
    },
  ];

  const chain = [
    {
      n: 1,
      stage: "CLAN",
      tier: "Field",
      who: "Clan Technicians",
      badge: "Offline",
      value: nf(hero.offlinePendingSync || 1840),
      valueLabel: "captures queued",
      meta: `${hero.activeFieldOfficers} techs`,
      accent: "text-[rgb(var(--ministry-gold-strong))]",
    },
    {
      n: 2,
      stage: "DAO",
      tier: "District · 90",
      who: "District Officers",
      value: nf(p.pendingVerification),
      valueLabel: "awaiting review",
      meta: "90 districts",
      accent: "text-emerald-700",
    },
    {
      n: 3,
      stage: "CAC",
      tier: "County · 15",
      who: "County Coordinators",
      value: String(countiesAwaiting * 12 + 14),
      valueLabel: "awaiting sign-off",
      meta: "15 counties",
      accent: "text-sky-700",
    },
    {
      n: 4,
      stage: "MoA",
      tier: "National",
      who: "Ministry / National",
      value: String(activeAlerts),
      valueLabel: "open escalations",
      meta: "1 national",
      accent: "text-slate-800",
    },
  ];

  return (
    <div className="space-y-7 pb-12">
      {/* Hero */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-5">
        <div className="min-w-0">
          <div className="gov-kicker gov-kicker-gold">Reporting Chain · Ministry of Agriculture</div>
          <h1 className="mt-2 font-serif-display text-[30px] md:text-[40px] leading-[1.05] text-slate-900">
            Command Center · National
          </h1>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-slate-600">
            Rice-first national picture, consolidated up the CLAN → DAO → CAC → Ministry chain. Season {live.season} ·
            food risk index {fi.nationalRiskScore}.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="btn-gov-outline h-9 px-3 rounded-lg text-[12px]">Season {live.season}</span>
          <Link href="/executive-briefing" className="btn-gold h-9 px-3.5 rounded-lg text-[12px]">
            Cabinet Brief
          </Link>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="gov-card px-5 py-5">
            <div className="gov-kicker">{k.label}</div>
            <div className="mt-3 font-serif-display text-[34px] leading-none tabular-nums text-slate-900">{k.value}</div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="font-mono text-[11px] font-medium text-emerald-700">{k.trend}</span>
            </div>
            <div className="mt-1.5 text-[11.5px] leading-snug text-slate-500">{k.hint}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-7 min-w-0">
          {/* National reporting chain */}
          <section className="gov-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <div className="font-serif-display text-[18px] text-slate-900">National reporting chain · live consolidation</div>
                <div className="mt-0.5 text-[12px] text-slate-500">
                  Capture flows up · verification signs off down · offline-first at the field tier
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Syncing · live
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {chain.map((c) => (
                <div key={c.stage} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 font-mono text-[10px] font-semibold text-white">
                      {c.n}
                    </span>
                    {c.badge ? (
                      <span className="rounded border border-[rgb(var(--ministry-gold-strong))]/40 bg-[rgb(var(--ministry-gold))]/15 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wide text-[rgb(var(--ministry-gold-strong))]">
                        {c.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 font-serif-display text-[15px] text-slate-900">{c.stage}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{c.tier}</div>
                  <div className="mt-3 font-serif-display text-[22px] leading-none tabular-nums text-slate-900">{c.value}</div>
                  <div className="text-[11px] text-slate-500">{c.valueLabel}</div>
                  <div className="mt-1.5 font-mono text-[10px] text-slate-400">{c.meta}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Programmes */}
          <section>
            <div className="gov-kicker">Programmes · {live.season} Season</div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {programmes.map((pr) => (
                <div key={pr.label} className="gov-card px-4 py-4">
                  <div className="gov-kicker">{pr.label}</div>
                  <div className="mt-2.5 font-serif-display text-[26px] leading-none tabular-nums text-slate-900">{pr.value}</div>
                  <div className="mt-1.5 text-[11px] leading-snug text-slate-500">{pr.hint}</div>
                  <div className="mt-3">
                    <MiniBar pct={pr.pct} tone={pr.tone === "warn" ? "warn" : "ok"} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* County rollup table */}
          <section className="gov-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="font-serif-display text-[18px] text-slate-900">County rollup · production &amp; verification posture</div>
                <div className="mt-0.5 text-[12px] text-slate-500">Capture → verification → county sign-off</div>
              </div>
              <Link
                href="/national-heat-map"
                className="btn-gov-outline h-8 px-3 rounded-lg text-[12px]"
              >
                Heat map ↗
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">County</th>
                    <th className="px-3 py-2.5 text-right">Production</th>
                    <th className="px-3 py-2.5 text-right">Farmers</th>
                    <th className="px-3 py-2.5">Verified</th>
                    <th className="px-3 py-2.5 text-right">Loss</th>
                    <th className="px-5 py-2.5">Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {countyRows.map((r) => {
                    const so = signOffMeta(r.signoff);
                    const vTone = r.verifiedPct >= 85 ? "ok" : r.verifiedPct >= 75 ? "warn" : "bad";
                    return (
                      <tr key={r.county} className="text-[13px] text-slate-700 hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{r.county}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{nf(r.productionMt)} MT</td>
                        <td className="px-3 py-3 text-right tabular-nums">{nf(r.farmers)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <MiniBar pct={r.verifiedPct} tone={vTone} />
                            <span className="font-mono text-[11px] tabular-nums text-slate-600">{r.verifiedPct}%</span>
                          </div>
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums ${r.lossPct > 15 ? "text-rose-600 font-medium" : ""}`}>
                          {r.lossPct.toFixed(1)}%
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${so.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${so.dot}`} aria-hidden />
                            {r.signoff}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick links */}
          <section className="flex flex-wrap gap-2.5">
            <Link href="/farmers" className="btn-gov-outline h-10 px-4 rounded-lg text-[13px]">
              Farmer registry
            </Link>
            <Link href="/inventory" className="btn-gov-outline h-10 px-4 rounded-lg text-[13px]">
              Warehouses & logistics
            </Link>
            <Link href="/verification-queue" className="btn-gov-outline h-10 px-4 rounded-lg text-[13px]">
              Verification queue
            </Link>
            <Link href="/reports" className="btn-gov-outline h-10 px-4 rounded-lg text-[13px]">
              Reports & cabinet brief
            </Link>
          </section>
        </div>

        {/* Right contextual panel */}
        <aside className="space-y-5 min-w-0 xl:sticky xl:top-6 self-start">
          <section className="gov-card overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3.5">
              <div className="font-serif-display text-[15px] text-slate-900">County heat · production</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Top producing counties this season</div>
            </div>
            <div className="space-y-3 p-4">
              {countyRows.slice(0, 6).map((r) => (
                <div key={r.county}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-slate-800">{r.county}</span>
                    <span className="font-mono tabular-nums text-slate-500">{nf(r.productionMt)} MT</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      style={{ width: `${safePct(r.productionMt, maxProd)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="gov-card px-4 py-4">
            <div className="gov-kicker gov-kicker-gold">National posture</div>
            <div className="mt-3 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Counties reporting</span>
                <span className="font-mono tabular-nums text-slate-900">{hero.countiesReporting}/15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Counties awaiting sign-off</span>
                <span className="font-mono tabular-nums text-slate-900">{countiesAwaiting}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Active coordination signals</span>
                <span className="font-mono tabular-nums text-slate-900">{activeAlerts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Data quality</span>
                <span className="font-mono tabular-nums text-slate-900">{hero.dataQualityScore}%</span>
              </div>
            </div>
            <Link
              href="/food-security"
              className="mt-4 inline-flex text-[12px] font-medium text-[rgb(var(--ministry-gold-strong))] hover:underline"
            >
              Food security intelligence →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
