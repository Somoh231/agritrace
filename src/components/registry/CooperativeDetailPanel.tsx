"use client";

import type { ReactNode } from "react";

import { StatusBadge } from "@/components/enterprise";

export default function CooperativeDetailPanel({
  row,
  onClose,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
}) {
  const license = row.license_number != null ? String(row.license_number) : null;
  const created = row.created_at != null ? String(row.created_at).slice(0, 10) : "—";

  return (
    <div className="space-y-5 text-[13px] text-slate-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Cooperative registry record</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white">{String(row.name ?? "—")}</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{String(row.id ?? "")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile label="Organization type" value={String(row.type ?? "cooperative")} />
        <InfoTile label="County" value={String(row.county ?? "—")} />
        <InfoTile label="Country" value={String(row.country ?? "Liberia")} />
        <InfoTile
          label="License status"
          value={
            license ? (
              <StatusBadge tone="success">Active · {license}</StatusBadge>
            ) : (
              <StatusBadge tone="warning">No license on file</StatusBadge>
            )
          }
        />
        <InfoTile label="Registered" value={created} />
      </div>

      <p className="rounded-lg border border-slate-800 bg-black/30 px-3 py-2 text-[12px] leading-relaxed text-slate-400">
        Read-only institutional record. New cooperatives append to the organizations table with audit log entries on create.
      </p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-slate-100">{value}</div>
    </div>
  );
}
