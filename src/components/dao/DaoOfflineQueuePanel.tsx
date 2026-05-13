"use client";

import * as React from "react";

import { titleForDaoWorkflowKind } from "@/hooks/useDaoWorkflowQueue";
import { pilotQueueStatusLabel } from "@/lib/dao/dao-queue-display";
import type { DaoWorkflowRecord, DaoWorkflowStatus } from "@/lib/dao/dao-workflow-types";

function statusStyles(s: DaoWorkflowStatus): string {
  switch (s) {
    case "draft":
      return "border-slate-600 bg-slate-900/80 text-slate-200";
    case "pending_sync":
      return "border-amber-600/50 bg-amber-950/35 text-amber-50";
    case "submitted":
      return "border-emerald-700/45 bg-emerald-950/30 text-emerald-50";
    case "failed":
      return "border-rose-700/50 bg-rose-950/35 text-rose-50";
    default:
      return "border-slate-700 text-slate-200";
  }
}

export default function DaoOfflineQueuePanel({
  items,
  counts,
  flushing,
  onFlushPending,
  onRetryOne,
  onRemove,
}: {
  items: DaoWorkflowRecord[];
  counts: Record<DaoWorkflowStatus, number>;
  flushing: boolean;
  onFlushPending: () => void;
  onRetryOne: (row: DaoWorkflowRecord) => void;
  onRemove: (id: string) => void;
}) {
  const [filter, setFilter] = React.useState<DaoWorkflowStatus | "all">("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => x.status === filter);
  }, [items, filter]);

  const chips: Array<{ id: DaoWorkflowStatus | "all"; label: string; n?: number }> = [
    { id: "all", label: "All", n: items.length },
    { id: "draft", label: pilotQueueStatusLabel("draft"), n: counts.draft },
    { id: "pending_sync", label: pilotQueueStatusLabel("pending_sync"), n: counts.pending_sync },
    { id: "submitted", label: pilotQueueStatusLabel("submitted"), n: counts.submitted },
    { id: "failed", label: pilotQueueStatusLabel("failed"), n: counts.failed },
  ];

  const actionable = counts.pending_sync + counts.failed > 0;

  return (
    <section id="dao-offline-queue" className="scroll-mt-24 rounded-xl border border-slate-700/90 bg-slate-950/55 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white">Operational reporting queue</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
            CLAN → DAO capture pipeline: drafts stay on this device. Pending sync and sync-failed rows retry to Supabase when you tap sync. Synced rows are
            confirmation copies after a successful push.
          </p>
        </div>
        <button
          type="button"
          disabled={!actionable || flushing}
          onClick={onFlushPending}
          className="h-10 shrink-0 rounded-lg bg-emerald-800 px-4 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {flushing ? "Syncing…" : "Retry sync (pending & failed)"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
              filter === c.id ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-100" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {c.label}
            {typeof c.n === "number" ? <span className="ml-1 font-mono text-[10px] opacity-80">{c.n}</span> : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center text-[12px] text-slate-500">Nothing in this filter.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-800/90">
          {filtered.map((row) => (
            <li key={row.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusStyles(row.status)}`}>
                    {pilotQueueStatusLabel(row.status)}
                  </span>
                  <span className="truncate font-medium text-[13px] text-slate-100">{row.title ?? titleForDaoWorkflowKind(row.kind)}</span>
                  <span className="font-mono text-[10px] text-slate-500">{titleForDaoWorkflowKind(row.kind)}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  Updated {new Date(row.updated_at).toLocaleString()}
                  {row.sync_attempts ? ` · attempts ${row.sync_attempts}` : null}
                </div>
                {row.error_message ? (
                  <div className="rounded-md border border-rose-900/50 bg-rose-950/25 px-2 py-1 text-[11px] text-rose-100/95">{row.error_message}</div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {row.status === "pending_sync" || row.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => onRetryOne(row)}
                    className="rounded-md border border-emerald-700/50 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-950/50"
                  >
                    Retry sync
                  </button>
                ) : null}
                <button type="button" onClick={() => onRemove(row.id)} className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-900">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
