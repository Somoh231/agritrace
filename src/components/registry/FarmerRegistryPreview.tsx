"use client";

import type { ReactNode } from "react";

import type { FarmerRegistryDemoRow } from "@/lib/demo/agriculture-pilot-data";

import { StatusBadge } from "@/components/enterprise";
import { verificationStatusTone } from "@/components/registry/registry-utils";

export default function FarmerRegistryPreview({
  row,
  onClose,
}: {
  row: FarmerRegistryDemoRow;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5 text-[13px] text-slate-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Registry preview · pilot row</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white">{row.fullName}</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500">{row.registryPublicId ?? row.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-[12px] text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <p className="rounded-lg border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-[12px] text-amber-100">
        Illustrative registry row — connect Supabase for full operational profile, visits, and subsidy history.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile label="County / district" value={`${row.county} · ${row.district}`} />
        <InfoTile label="Cooperative" value={row.cooperative} />
        <InfoTile label="Verification" value={<StatusBadge tone={verificationStatusTone(row.verification)}>{row.verification}</StatusBadge>} />
        <InfoTile label="GPS readiness" value={row.gpsStatus.toUpperCase()} />
        <InfoTile label="Main crop" value={row.mainCrop} />
        <InfoTile label="Acreage" value={`${row.acreage} ha`} />
        <InfoTile label="DAO officer" value={row.daoOfficerCode ?? "Unassigned"} />
        <InfoTile label="Warehouse" value={row.primaryWarehouseCode ?? "—"} />
        <InfoTile label="Subsidy eligibility" value={row.subsidyEligible ? "Eligible" : "Not eligible"} />
        <InfoTile label="Last field activity" value={row.lastFieldVisit} />
      </div>
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
