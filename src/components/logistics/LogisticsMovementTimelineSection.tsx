"use client";

import * as React from "react";

import { fetchNationalMovementTimeline } from "@/lib/logistics/movement-timeline";
import type { MovementTimelineRow } from "@/lib/logistics/types";

export default function LogisticsMovementTimelineSection({ limit = 60 }: { limit?: number }) {
  const [rows, setRows] = React.useState<MovementTimelineRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      const data = await fetchNationalMovementTimeline(limit);
      if (!c) {
        setRows(data);
        setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [limit]);

  return (
    <section id="logistics-movements" className="scroll-mt-24 rounded-xl border border-slate-700/80 bg-slate-950/45 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Inventory movement timeline</div>
          <h2 className="font-display text-[15px] font-semibold text-white">National logistics ledger</h2>
          <p className="mt-1 max-w-2xl text-[12px] text-slate-400">
            Timestamped movements from <span className="font-mono text-slate-300">inventory_movements</span> with operator attribution; canonical fixtures
            appear when the ledger is empty.
          </p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[960px] w-full text-left text-[12px]">
          <thead className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Operator</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/90 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-slate-500">
                  Loading movements…
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/35">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400">{new Date(r.at).toLocaleString()}</td>
                  <td className="px-3 py-2 capitalize">{r.movementType}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{r.source}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{r.destination}</td>
                  <td className="px-3 py-2 tabular-nums">{r.quantity}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{r.operator}</td>
                  <td className="px-3 py-2 text-emerald-300/90">{r.status}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{r.reference}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
