"use client";

import * as React from "react";
import Link from "next/link";

import { useNationalAISLive } from "@/components/ais/useNationalAISLive";
import { DashboardPanel, DataSourceBadge, SectionHeader, StatusBadge } from "@/components/enterprise";
import {
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  nationalHeroMetrics,
} from "@/lib/demo/agriculture-pilot-data";
import { demoSource, pilotSource, resolveDisplaySource } from "@/lib/data/data-source";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import {
  fetchOperationalFeedItems,
  type MinistryFeedItem,
} from "@/lib/data/ministry-data-service";
import { buildNationalOperationalNarratives } from "@/lib/ops/national-operational-narratives";
import { safePct } from "@/lib/utils/rice";

function narrativeTone(tone: "emerald" | "amber" | "rose" | "slate"): "success" | "warning" | "danger" | "neutral" {
  if (tone === "emerald") return "success";
  if (tone === "amber") return "warning";
  if (tone === "rose") return "danger";
  return "neutral";
}

function feedTone(t: MinistryFeedItem["tone"]): "danger" | "warning" | "success" | "neutral" {
  if (t === "rose") return "danger";
  if (t === "amber") return "warning";
  if (t === "emerald") return "success";
  return "neutral";
}

export default function NationalOperationalIntelStrip() {
  const live = useNationalAISLive();
  const fi = foodSecurityIndicators;
  const p = farmerRegistrationPipeline;

  const [feed, setFeed] = React.useState<MinistryFeedItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchOperationalFeedItems(8).then((result) => {
      if (!cancelled) setFeed(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const productionProgressPct = safePct(live.productionMt * 1000, Math.max(1, live.targetMt * 1000));

  const stressedWarehouse = React.useMemo(() => {
    const sorted = [...MINISTRY_WAREHOUSES].sort((a, b) => b.utilizationPct - a.utilizationPct);
    const w = sorted[0];
    if (!w) return null;
    return {
      code: w.ministryCode,
      name: w.name,
      county: w.county,
      utilizationPct: w.utilizationPct,
    };
  }, []);

  const narratives = React.useMemo(
    () =>
      buildNationalOperationalNarratives({
        farmersCount: live.farmersCount,
        productionMt: live.productionMt,
        targetMt: live.targetMt,
        productionProgressPct,
        nationalRiskScore: fi.nationalRiskScore,
        importDependencyPct: nationalHeroMetrics.importDependencyPct,
        pendingVerification: p.pendingVerification,
        geoTaggedPct: p.geoTaggedPct,
        lossRatePct: live.lossRatePct,
        countiesRanked: live.countiesRanked.map((c) => ({
          county: c.county,
          productionMt: c.productionMt,
          status: c.status,
          lossPct: c.lossPct,
        })),
        stressedWarehouse,
      }),
    [
      live.farmersCount,
      live.productionMt,
      live.targetMt,
      live.lossRatePct,
      live.countiesRanked,
      productionProgressPct,
      fi.nationalRiskScore,
      p.pendingVerification,
      p.geoTaggedPct,
      stressedWarehouse,
    ],
  );

  const stripSource = React.useMemo(
    () =>
      resolveDisplaySource([
        live.dataSource,
        demoSource("farmerRegistrationPipeline + foodSecurityIndicators"),
        pilotSource("MINISTRY_WAREHOUSES stress warehouse"),
      ]),
    [live.dataSource],
  );

  return (
    <DashboardPanel padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <SectionHeader
          kicker="Operational intelligence"
          title="National situation — narratives, not noise"
          subtitle="Synthesized from pilot operational tables and canonical ministry signals."
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <DataSourceBadge source={stripSource} />
          <Link href="/executive-briefing" className="btn-emerald h-9 inline-flex items-center rounded-lg px-3 text-[13px]">
            Executive briefing
          </Link>
          <Link href="/map" className="btn-gov-outline h-9 inline-flex items-center rounded-lg px-3 text-[13px]">
            Operational map
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {narratives.map((n) => (
          <article key={n.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold leading-snug text-ink-900">{n.headline}</h3>
              <StatusBadge tone={narrativeTone(n.tone)} dot>
                Signal
              </StatusBadge>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{n.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <p className="ent-label">Live operational feed</p>
          <span className="font-mono text-[10px] text-slate-500">pilot_operational_events</span>
        </div>
        <ul className="max-h-[200px] divide-y divide-slate-100 overflow-y-auto bg-white">
          {feed.length ?
            feed.map((f) => (
              <li key={f.id} className="px-4 py-2.5 text-[13px] leading-snug">
                <StatusBadge tone={feedTone(f.tone)} className="mr-2">
                  {f.title}
                </StatusBadge>
                <span className="text-slate-600">{f.detail}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-slate-500">{new Date(f.at).toLocaleString()}</span>
              </li>
            ))
          : <li className="px-4 py-6 text-[13px] text-slate-500">Loading operational events…</li>}
        </ul>
      </div>
    </DashboardPanel>
  );
}
