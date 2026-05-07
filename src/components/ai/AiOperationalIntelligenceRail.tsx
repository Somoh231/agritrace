"use client";

import * as React from "react";
import Link from "next/link";

import { buildAiOperationalInsights, type AiInsight } from "@/lib/ai/operational-intelligence";
import { listTransferOrders } from "@/lib/logistics/transfer-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function badge(sev: AiInsight["severity"]) {
  return sev === "critical"
    ? "border-rose-800/50 bg-rose-950/30 text-rose-100"
    : sev === "warning"
      ? "border-amber-800/45 bg-amber-950/25 text-amber-50"
      : "border-slate-700/70 bg-slate-950/30 text-slate-200";
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
  );
}

export default function AiOperationalIntelligenceRail() {
  const [transfers, setTransfers] = React.useState<TransferOrderView[]>([]);
  const [lowSku, setLowSku] = React.useState<number | null>(null);
  const [expiry, setExpiry] = React.useState<number | null>(null);
  const [distCount, setDistCount] = React.useState<number | null>(null);
  const [dao30d, setDao30d] = React.useState<number | null>(null);

  React.useEffect(() => {
    void listTransferOrders().then(setTransfers);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const now = Date.now();
        const horizon = 90 * 24 * 3600 * 1000;

        const [stock, dist, reports] = await Promise.all([
          supabase.from("warehouse_stock").select("quantity, expiry_date").limit(800),
          supabase.from("distribution_logs").select("id", { count: "exact", head: true }),
          supabase.from("field_reports").select("submitted_at").order("submitted_at", { ascending: false }).limit(250),
        ]);

        if (cancelled) return;

        if (stock.data?.length) {
          let low = 0;
          let exp = 0;
          for (const r of stock.data as Record<string, unknown>[]) {
            const q = Number(r.quantity ?? 0);
            if (q > 0 && q < 500) low++;
            if (r.expiry_date) {
              const t = new Date(String(r.expiry_date)).getTime();
              if (!Number.isNaN(t) && t - now < horizon && t >= now) exp++;
            }
          }
          setLowSku(low);
          setExpiry(exp);
        } else {
          setLowSku(null);
          setExpiry(null);
        }

        setDistCount(dist.count ?? null);

        if (reports.data?.length) {
          const since = now - 30 * 86400000;
          const n = (reports.data as Record<string, unknown>[]).filter((r) => {
            const t = new Date(String(r.submitted_at ?? "")).getTime();
            return Number.isFinite(t) && t >= since;
          }).length;
          setDao30d(n);
        } else {
          setDao30d(null);
        }
      } catch {
        if (!cancelled) {
          setLowSku(null);
          setExpiry(null);
          setDistCount(null);
          setDao30d(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const model = React.useMemo(
    () =>
      buildAiOperationalInsights({
        transfers,
        lowStockSkuApprox: lowSku,
        expiryRiskApprox: expiry,
        distributionCount: distCount,
        daoReports30d: dao30d,
      }),
    [transfers, lowSku, expiry, distCount, dao30d],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/70 to-black/40 p-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/75">AI operational intelligence</div>
          <div className="mt-1 font-display text-[15px] font-semibold text-white">Insights · anomalies · actions</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill label="Proactive" />
          <Pill label="Read-model" />
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {model.anomalies.slice(0, 2).map((a) => (
          <div key={a.id} className={`rounded-xl border px-3 py-2 ${badge(a.severity)}`}>
            <div className="text-[12px] font-medium text-white">{a.title}</div>
            <div className="mt-1 text-[11px] opacity-90">{a.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">Recommended actions</div>
        <ul className="mt-2 space-y-2">
          {model.recommendedActions.slice(0, 3).map((x) => (
            <li key={x.id} className={`rounded-lg border px-3 py-2 ${badge(x.severity)}`}>
              <div className="text-[12px] font-medium text-white">{x.title}</div>
              <ul className="mt-2 list-inside list-disc text-[11px] opacity-95">
                {x.recommendedActions.slice(0, 3).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">Intervention priorities</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {model.interventionPriorities.slice(0, 6).map((p) => (
            <span
              key={p.county}
              className={`rounded-full border px-2.5 py-1 text-[10px] ${
                p.score >= 78
                  ? "border-rose-900/50 bg-rose-950/25 text-rose-100"
                  : p.score >= 62
                    ? "border-amber-900/50 bg-amber-950/20 text-amber-100"
                    : "border-slate-700/70 bg-slate-950/20 text-slate-200"
              }`}
              title={`${p.reason} · ${p.score}/100`}
            >
              <span className="font-mono">{p.county}</span> <span className="opacity-80">{p.score}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
        <Link href="/gis-intelligence" className="text-emerald-400 hover:text-emerald-300">
          Open GIS triage →
        </Link>
        <Link href="/inventory" className="text-emerald-400 hover:text-emerald-300">
          Inventory command →
        </Link>
        <Link href="/executive-briefing" className="text-emerald-400 hover:text-emerald-300">
          Executive briefing →
        </Link>
      </div>
    </section>
  );
}

