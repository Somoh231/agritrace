"use client";

import * as React from "react";

import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import { fetchOperationalFeedItems, normalizeCountyKey, type MinistryFeedItem } from "@/lib/data/ministry-data-service";

function toneBorder(t: MinistryFeedItem["tone"]): string {
  switch (t) {
    case "emerald":
      return "border-emerald-800/45 bg-emerald-950/20";
    case "amber":
      return "border-amber-800/45 bg-amber-950/20";
    case "rose":
      return "border-rose-800/45 bg-rose-950/20";
    default:
      return "border-slate-800 bg-slate-900/40";
  }
}

export default function CaoActivityTimeline({ county, daoRows }: { county: string | null; daoRows: DaoOversightRow[] }) {
  const [feed, setFeed] = React.useState<MinistryFeedItem[]>([]);

  React.useEffect(() => {
    void fetchOperationalFeedItems(36).then(setFeed);
  }, []);

  const nk = normalizeCountyKey(county);

  const scopedFeed = React.useMemo(() => {
    return feed.filter((f) => {
      const hay = `${f.title} ${f.detail}`.toLowerCase();
      if (!nk) return true;
      return hay.includes(nk) || hay.includes((county ?? "").trim().toLowerCase());
    });
  }, [feed, nk, county]);

  const synthetic = React.useMemo((): MinistryFeedItem[] => {
    const label = county ?? "County";
    const top = daoRows[0];
    const verifPct =
      daoRows.length > 0 ? Math.round(daoRows.reduce((s, r) => s + r.gpsVerificationRate, 0) / daoRows.length) : 82;
    const regs = daoRows.reduce((s, r) => s + Math.min(24, Math.round(r.reportsSubmitted / 4)), 0);

    const lines: MinistryFeedItem[] = [
      {
        id: "syn-regs",
        at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        tone: "emerald",
        title: top ? `${top.daoId} submitted ${regs || 12} registrations (rollup)` : `${label} DAO registrations batch landed`,
        detail: "Queued for CAC approval · GIS consistency pending.",
      },
      {
        id: "syn-wh",
        at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        tone: "amber",
        title: `${label} warehouse stock dipped below CAC safety curve`,
        detail: "WH superintendent flagged NPK corridor · replenishment ticket eligible.",
      },
      {
        id: "syn-pest",
        at: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
        tone: "rose",
        title: "Pest alert escalated from high-risk district cluster",
        detail: "DAO rapid alert synced · ministry situational desk CC'd.",
      },
      {
        id: "syn-subsidy",
        at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
        tone: "emerald",
        title: `County subsidy verification attainment ~${verifPct}%`,
        detail: "Rolling GPS-backed verification vs programme SLA.",
      },
    ];
    return lines;
  }, [county, daoRows]);

  const merged = React.useMemo(() => {
    return [...synthetic, ...scopedFeed].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 22);
  }, [synthetic, scopedFeed]);

  return (
    <section className="rounded-xl border border-slate-700/85 bg-slate-950/45 p-4 sm:p-5">
      <h2 className="font-display text-[15px] font-semibold text-white">Activity timeline</h2>
      <p className="mt-1 text-[12px] text-slate-400">County-filtered operational feed blended with CAC rehearsal cadence statements.</p>
      <ul className="mt-4 space-y-3">
        {merged.map((item) => (
          <li key={item.id} className={`rounded-lg border px-4 py-3 ${toneBorder(item.tone)}`}>
            <div className="text-[11px] font-mono text-slate-500">{new Date(item.at).toLocaleString()}</div>
            <div className="mt-1 text-[13px] font-medium text-white">{item.title}</div>
            <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{item.detail}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
