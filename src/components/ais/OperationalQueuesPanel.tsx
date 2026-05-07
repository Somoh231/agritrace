"use client";

import * as React from "react";
import Link from "next/link";

import { dataQualityAlerts } from "@/lib/demo/agriculture-pilot-data";
import { fetchOperationalFeedItems } from "@/lib/data/ministry-data-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type QueueStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "escalated"
  | "completed";

export type OpsQueueRow = {
  id: string;
  queue: string;
  status: QueueStatus;
  owner: string;
  county: string;
  district: string;
  timestamp: string;
  priority: "P1" | "P2" | "P3";
  summary: string;
};

function toneForPriority(p: OpsQueueRow["priority"]) {
  if (p === "P1") return "border-rose-500/30 bg-rose-950/35 text-rose-50";
  if (p === "P2") return "border-amber-500/30 bg-amber-950/30 text-amber-50";
  return "border-slate-600/40 bg-slate-950/45 text-slate-100";
}

function toneForStatus(s: QueueStatus) {
  switch (s) {
    case "approved":
    case "completed":
      return "text-emerald-300";
    case "rejected":
      return "text-rose-300";
    case "escalated":
      return "text-amber-200";
    default:
      return "text-slate-300";
  }
}

export default function OperationalQueuesPanel({ className }: { className?: string }) {
  const [rows, setRows] = React.useState<OpsQueueRow[]>([]);

  React.useEffect(() => {
    void (async () => {
      const synthetic: OpsQueueRow[] = dataQualityAlerts.slice(0, 3).map((a, i) => ({
        id: `dq-${a.id}`,
        queue: "Data quality review",
        status: "under_review" as const,
        owner: "County reconciliation desk",
        county: a.county ?? "National",
        district: "—",
        timestamp: new Date(Date.now() - (40 + i * 50) * 60_000).toISOString(),
        priority: i === 0 ? "P1" : "P2",
        summary: a.title,
      }));

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("pilot_operational_events")
          .select("event_code,occurred_at,severity,county,district,event_type,message,status")
          .eq("status", "Open")
          .order("occurred_at", { ascending: false })
          .limit(8);

        const fromDb: OpsQueueRow[] = ((data ?? []) as Record<string, unknown>[]).map((r, i) => {
          const stRaw = String(r.status ?? "Open").toLowerCase();
          let status: QueueStatus = "submitted";
          if (stRaw.includes("escal")) status = "escalated";
          else if (stRaw.includes("resolv") || stRaw.includes("complete")) status = "completed";
          return {
          id: String(r.event_code ?? `evt-${i}`),
          queue: "Operational escalation",
          status,
          owner: "National coordination",
          county: String(r.county ?? "—"),
          district: String(r.district ?? "—"),
          timestamp: String(r.occurred_at ?? new Date().toISOString()),
          priority: String(r.severity ?? "").toUpperCase() === "HIGH" ? "P1" : "P2",
          summary: `${String(r.event_type ?? "Event")} · ${String(r.message ?? "").slice(0, 120)}`,
        };
        });

        const feed = await fetchOperationalFeedItems(4);
        const approvalHints: OpsQueueRow[] = feed.map((f, i) => ({
          id: `act-${f.id}-${i}`,
          queue: "Approvals & coordination",
          status: "under_review",
          owner: "Executive cadence",
          county: "Pilot counties",
          district: "—",
          timestamp: f.at,
          priority: f.tone === "rose" ? "P1" : "P3",
          summary: f.title,
        }));

        setRows([...fromDb, ...approvalHints.slice(0, 2), ...synthetic].slice(0, 12));
      } catch {
        setRows(synthetic);
      }
    })();
  }, []);

  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/65">Operational queues</div>
        <div className="mt-1 font-display text-[15px] font-semibold text-white">Items requiring ministry action</div>
        <ul className="mt-4 space-y-2 max-h-[min(42vh,420px)] overflow-y-auto pr-1">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-xl border px-3 py-2.5 ${toneForPriority(r.priority)}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold leading-snug">{r.queue}</div>
                  <div className="mt-0.5 text-[11px] opacity-90 leading-snug">{r.summary}</div>
                  <div className="mt-1 font-mono text-[10px] opacity-75">
                    {r.county}
                    {r.district !== "—" ? ` · ${r.district}` : ""} · {r.owner}
                  </div>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <div className="font-mono text-[10px]">{r.priority}</div>
                  <div className={`font-mono text-[10px] capitalize ${toneForStatus(r.status)}`}>{r.status.replace("_", " ")}</div>
                  <time className="block font-mono text-[9px] opacity-75" dateTime={r.timestamp}>
                    {new Date(r.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </time>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-[10px] text-white hover:bg-white/10"
                  onClick={() => window.dispatchEvent(new CustomEvent("agritrace-queue-open", { detail: r.id }))}
                >
                  Open
                </button>
                <Link href="/verification-queue" className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-emerald-100/90 hover:bg-white/[0.05]">
                  Verification →
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/registration-approvals" className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200">
            Registration approvals
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/inventory/transfers" className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200">
            Transfer queue
          </Link>
        </div>
      </div>
    </div>
  );
}
