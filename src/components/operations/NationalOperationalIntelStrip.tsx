"use client";

import * as React from "react";
import Link from "next/link";

import { useNationalAISLive } from "@/components/ais/useNationalAISLive";
import {
  farmerRegistrationPipeline,
  foodSecurityIndicators,
  nationalHeroMetrics,
} from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import {
  fetchOperationalFeedItems,
  type MinistryFeedItem,
} from "@/lib/data/ministry-data-service";
import { buildNationalOperationalNarratives } from "@/lib/ops/national-operational-narratives";
import { safePct } from "@/lib/utils/rice";

function narrativeToneCls(tone: "emerald" | "amber" | "rose" | "slate") {
  if (tone === "emerald") return "border-emerald-500/25 bg-emerald-950/20";
  if (tone === "amber") return "border-amber-500/30 bg-amber-950/20";
  if (tone === "rose") return "border-rose-500/30 bg-rose-950/25";
  return "border-slate-700 bg-slate-950/40";
}

function feedToneCls(t: MinistryFeedItem["tone"]) {
  if (t === "rose") return "text-rose-200";
  if (t === "amber") return "text-amber-200";
  if (t === "emerald") return "text-emerald-200";
  return "text-slate-300";
}

export default function NationalOperationalIntelStrip() {
  const live = useNationalAISLive();
  const fi = foodSecurityIndicators;
  const p = farmerRegistrationPipeline;

  const [feed, setFeed] = React.useState<MinistryFeedItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchOperationalFeedItems(8).then((items) => {
      if (!cancelled) setFeed(items);
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

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-emerald-950/20 px-4 py-4 md:px-5 md:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/70">Operational intelligence</div>
          <h2 className="mt-1 font-display text-[16px] font-semibold text-white">National situation — narratives, not noise</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400 max-w-[920px]">
            Synthesized from pilot operational tables and canonical ministry signals. When live data is thin, fixtures preserve a believable national story for planning and briefings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/executive-briefing"
            className="h-9 inline-flex items-center rounded-lg border border-emerald-500/35 bg-emerald-950/40 px-3 text-[12px] font-medium text-emerald-100 hover:bg-emerald-900/50"
          >
            Executive briefing
          </Link>
          <Link href="/gis-intelligence" className="h-9 inline-flex items-center rounded-lg border border-slate-600 bg-slate-900 px-3 text-[12px] text-slate-200 hover:bg-slate-800">
            GIS workspace
          </Link>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {narratives.map((n) => (
          <article
            key={n.id}
            className={`rounded-xl border px-3 py-2.5 ${narrativeToneCls(n.tone)}`}
          >
            <div className="font-display text-[13px] font-semibold leading-snug text-white">{n.headline}</div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{n.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-black/25">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Live operational feed</div>
          <span className="font-mono text-[10px] text-slate-600">pilot_operational_events</span>
        </div>
        <ul className="max-h-[200px] overflow-y-auto divide-y divide-slate-800/80">
          {feed.length ? (
            feed.map((f) => (
              <li key={f.id} className="px-3 py-2 text-[11px] leading-snug">
                <span className={`font-medium ${feedToneCls(f.tone)}`}>{f.title}</span>
                <span className="text-slate-500"> · </span>
                <span className="text-slate-400">{f.detail}</span>
                <span className="block font-mono text-[10px] text-slate-600 mt-0.5">{new Date(f.at).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-[12px] text-slate-500">Loading operational events…</li>
          )}
        </ul>
      </div>
    </section>
  );
}
