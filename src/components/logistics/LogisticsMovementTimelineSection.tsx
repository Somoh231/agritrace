"use client";

import * as React from "react";

import { EmptyState, SectionHeader } from "@/components/enterprise";
import { fetchNationalMovementTimeline } from "@/lib/logistics/movement-timeline";
import type { MovementTimelineRow } from "@/lib/logistics/types";

export default function LogisticsMovementTimelineSection({ limit = 60 }: { limit?: number }) {
  const [rows, setRows] = React.useState<MovementTimelineRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const data = await fetchNationalMovementTimeline(limit);
        if (!c) {
          setRows(data);
          setError(null);
        }
      } catch (e) {
        if (!c) setError(e instanceof Error ? e.message : "Failed to load movements");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [limit]);

  return (
    <section id="logistics-movements" className="scroll-mt-24 p-5 sm:p-6">
      <SectionHeader
        kicker="Inventory movement timeline"
        title="National logistics ledger"
        subtitle="Timestamped movements from inventory_movements with operator attribution; canonical fixtures appear when the ledger is empty."
      />

      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4">
          <EmptyState title="Movement ledger unavailable" description={error} />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No movements recorded" description="Receipts, transfers, and distributions will appear here as they are posted." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="enterprise-table min-w-[960px]">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Qty</th>
                <th>Operator</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-mono text-[11px]">{r.at ? new Date(r.at).toLocaleString() : "—"}</td>
                  <td className="capitalize">{r.movementType}</td>
                  <td className="font-mono text-[11px]">{r.source}</td>
                  <td className="font-mono text-[11px]">{r.destination}</td>
                  <td className="tabular-nums">{r.quantity}</td>
                  <td>{r.operator}</td>
                  <td>{r.status}</td>
                  <td className="font-mono text-[11px] text-forest-700">{r.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
