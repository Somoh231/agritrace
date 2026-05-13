"use client";

import * as React from "react";

import {
  dataQualityAlerts,
  inventoryTransfers,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";
import { fetchOperationalFeedItems, type MinistryFeedItem } from "@/lib/data/ministry-data-service";

export type FeedItem = MinistryFeedItem;

function toneClasses(tone: FeedItem["tone"]) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/25 bg-emerald-950/35 text-emerald-50";
    case "amber":
      return "border-amber-500/25 bg-amber-950/30 text-amber-50";
    case "rose":
      return "border-rose-500/25 bg-rose-950/35 text-rose-50";
    default:
      return "border-slate-500/25 bg-slate-950/40 text-slate-100";
  }
}

export default function OperationalActivityRail({ className }: { className?: string }) {
  const [pilotFeed, setPilotFeed] = React.useState<FeedItem[]>([]);

  React.useEffect(() => {
    void fetchOperationalFeedItems(18).then(setPilotFeed);
  }, []);

  const items = React.useMemo((): FeedItem[] => {
    const now = Date.now();
    const ago = (m: number) => new Date(now - m * 60_000).toISOString();
    const loss = postHarvestLossAlerts.slice(0, 2).map((a, i) => ({
      id: `loss-${a.id}`,
      at: ago(18 + i * 9),
      tone: "rose" as const,
      title: `Pest / loss signal · ${a.county}`,
      detail: `${a.lossPct}% trajectory · ${a.driver}`,
    }));
    const dq = dataQualityAlerts.slice(0, 2).map((a, i) => ({
      id: `dq-${a.id}`,
      at: ago(42 + i * 14),
      tone: "amber" as const,
      title: a.title,
      detail: a.county ? `${a.county} · reconciliation queue` : "National reconciliation queue",
    }));
    const mov = inventoryTransfers.slice(0, 3).map((t, i) => ({
      id: `mov-${t.id}`,
      at: ago(8 + i * 6),
      tone: "emerald" as const,
      title: `Warehouse movement · ${t.commodity}`,
      detail: `${t.qtyTons} t · ${t.from} → ${t.to} · ${t.status}`,
    }));
    const dao = [
      {
        id: "dao-1",
        at: ago(25),
        tone: "slate" as const,
        title: "DAO situational report filed",
        detail: "Bong · District agronomy unit · weekly IRR crop sheet",
      },
      {
        id: "dao-2",
        at: ago(55),
        tone: "slate" as const,
        title: "County reporting cadence · overdue district",
        detail: "Margibi · follow-up issued to supervising CAC",
      },
      {
        id: "sub-1",
        at: ago(33),
        tone: "emerald" as const,
        title: "Subsidy beneficiary verified",
        detail: "Seed allocation batch SR-2026-04 · ministry voucher ledger",
      },
    ];
    return [...pilotFeed, ...loss, ...dq, ...mov, ...dao].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 14);
  }, [pilotFeed]);

  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/65">Live operational feed</div>
        <div className="mt-1 font-display text-[15px] font-semibold text-white">National activity rail</div>
        <ul className="mt-4 space-y-2.5 max-h-[min(62vh,560px)] overflow-y-auto pr-1">
          {items.map((it) => (
            <li key={it.id} className={`rounded-xl border px-3 py-2.5 ${toneClasses(it.tone)}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-semibold leading-snug">{it.title}</span>
                <time className="shrink-0 font-mono text-[10px] opacity-80" dateTime={it.at}>
                  {new Date(it.at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="mt-1 text-[11px] opacity-90 leading-relaxed">{it.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
