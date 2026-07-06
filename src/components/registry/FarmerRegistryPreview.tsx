"use client";

import { AlertCard, EnterpriseDetailTile, StatusBadge } from "@/components/enterprise";
import type { FarmerRegistryDemoRow } from "@/lib/demo/agriculture-pilot-data";
import { verificationStatusTone } from "@/components/registry/registry-utils";

export default function FarmerRegistryPreview({
  row,
  onClose,
}: {
  row: FarmerRegistryDemoRow;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5 text-[13px] text-ink-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Registry preview · pilot row</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">{row.fullName}</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500">{row.registryPublicId ?? row.id}</p>
        </div>
        <button type="button" onClick={onClose} className="btn-gov-outline h-9 rounded-lg px-3 text-[12px]">
          Close
        </button>
      </div>

      <AlertCard tone="warning" title="Illustrative registry row">
        Connect Supabase for full operational profile, visits, subsidy history, and ministry farmer ID linkage.
      </AlertCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <EnterpriseDetailTile label="County / district" value={`${row.county} · ${row.district}`} />
        <EnterpriseDetailTile label="Cooperative" value={row.cooperative} />
        <EnterpriseDetailTile
          label="Verification"
          value={<StatusBadge tone={verificationStatusTone(row.verification)}>{row.verification}</StatusBadge>}
        />
        <EnterpriseDetailTile
          label="GPS / plot readiness"
          value={<StatusBadge tone={row.gpsStatus === "verified" ? "success" : row.gpsStatus === "pending" ? "warning" : "neutral"}>{row.gpsStatus}</StatusBadge>}
        />
        <EnterpriseDetailTile label="Main crop" value={row.mainCrop} />
        <EnterpriseDetailTile label="Acreage" value={`${row.acreage} ha`} />
        <EnterpriseDetailTile label="DAO assignment" value={row.daoOfficerCode ?? "Unassigned"} />
        <EnterpriseDetailTile label="Primary warehouse" value={row.primaryWarehouseCode ?? "—"} />
        <EnterpriseDetailTile label="Subsidy eligibility" value={row.subsidyEligible ? "Eligible" : "Not eligible"} />
        <EnterpriseDetailTile label="Last field activity" value={row.lastFieldVisit} />
      </div>
    </div>
  );
}
