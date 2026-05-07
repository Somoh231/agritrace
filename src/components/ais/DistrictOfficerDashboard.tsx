"use client";

import * as React from "react";
import Link from "next/link";

import DaoSubsidyDistributionForm from "@/components/operations/forms/DaoSubsidyDistributionForm";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFieldInspectionForm from "@/components/operations/forms/RecordFieldInspectionForm";
import RegisterFarmerForm from "@/components/operations/forms/RegisterFarmerForm";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import { useDaoOfflineQueue } from "@/hooks/useDaoOfflineQueue";
import type { UserRole } from "@/lib/supabase/types";

function daoReadOnly(role: UserRole): boolean {
  return role === "county_officer" || role === "ministry_officer" || role === "government_officer";
}

export default function DistrictOfficerDashboard({
  county,
  district,
  role,
  fullName,
}: {
  county: string | null;
  district: string | null;
  role: UserRole;
  fullName: string;
}) {
  const readOnly = daoReadOnly(role);
  const { queued, enqueue, clearSynced, online } = useDaoOfflineQueue();

  const [farmerOpen, setFarmerOpen] = React.useState(false);
  const [inspectOpen, setInspectOpen] = React.useState(false);
  const [subsidyOpen, setSubsidyOpen] = React.useState(false);

  React.useEffect(() => {
    const onOnline = () => {};
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <>
      <MinistryPageShell
        title="District operations hub"
        description={`District Agriculture Officer (DAO) workspace · ${fullName}${county ? ` · ${county}` : ""}${district ? ` · ${district}` : ""}. Mobile-first capture with offline queue until connectivity restores.`}
        actions={
          <Link href="/field/sync-queue" className="h-10 inline-flex items-center rounded-lg border border-slate-600 px-4 text-[13px] text-slate-100 hover:bg-slate-800">
            Sync queue detail
          </Link>
        }
      >
        {readOnly ? (
          <div className="mb-5 rounded-xl border border-sky-500/35 bg-sky-950/30 px-4 py-3 text-[13px] text-sky-50">
            Oversight mode — captures are read-only. DAO officers use this hub for registrations, inspections, and subsidy postings.
          </div>
        ) : null}

        <div className="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] ${
              online ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100" : "border-amber-500/40 bg-amber-950/35 text-amber-50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            {online ? "Online" : "Offline"}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Unsynced forms · <span className="text-white">{queued.length}</span>
          </span>
          {!online && queued.length ? (
            <span className="text-[11px] text-amber-200/90">Submissions will flush automatically when the network returns.</span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setFarmerOpen(true)}
            className="rounded-xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950/80 to-slate-950 px-4 py-5 text-left shadow-lg hover:border-emerald-600/50 transition"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Registry</div>
            <div className="mt-2 font-display text-[16px] font-semibold text-white">Farmer registration</div>
            <div className="mt-1 text-[12px] text-emerald-100/75">National ID · cooperative · GPS · draft / sync</div>
          </button>
          <button
            type="button"
            onClick={() => setInspectOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-5 text-left hover:border-slate-500 transition"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Field</div>
            <div className="mt-2 font-display text-[16px] font-semibold text-white">Inspection visit</div>
            <div className="mt-1 text-[12px] text-slate-400">Condition · pests · inputs · evidence refs</div>
          </button>
          <button
            type="button"
            onClick={() => setSubsidyOpen(true)}
            className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-5 text-left hover:border-amber-700/50 transition"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Programmes</div>
            <div className="mt-2 font-display text-[16px] font-semibold text-white">Subsidy distribution</div>
            <div className="mt-1 text-[12px] text-amber-100/75">Warehouse source · quantities · verification</div>
          </button>
        </div>

        {queued.length ? (
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Pending sync queue</div>
            <ul className="mt-3 divide-y divide-slate-800">
              {queued.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[12px] text-slate-300">
                  <span className="font-mono text-emerald-200/80">{q.kind}</span>
                  <span className="text-slate-500">{new Date(q.createdAt).toLocaleString()}</span>
                  <button
                    type="button"
                    className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                    onClick={() => clearSynced(q.id)}
                  >
                    Discard
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </MinistryPageShell>

      <OperationDrawer open={farmerOpen} onClose={() => setFarmerOpen(false)} title="Farmer registration" widthClassName="max-w-lg">
        <RegisterFarmerForm
          countyDefault={county ?? undefined}
          districtDefault={district ?? undefined}
          readOnly={readOnly}
          onQueueForSync={
            readOnly
              ? undefined
              : (snap) =>
                  enqueue({
                    kind: "farmer_registration",
                    payload: snap,
                  })
          }
          onCancel={() => setFarmerOpen(false)}
          onSuccess={() => setFarmerOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={inspectOpen} onClose={() => setInspectOpen(false)} title="Field inspection" widthClassName="max-w-lg">
        <RecordFieldInspectionForm
          readOnly={readOnly}
          onQueueForSync={
            readOnly
              ? undefined
              : (snap) =>
                  enqueue({
                    kind: "field_inspection",
                    payload: snap,
                  })
          }
          onCancel={() => setInspectOpen(false)}
          onSuccess={() => setInspectOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={subsidyOpen} onClose={() => setSubsidyOpen(false)} title="Subsidy distribution" widthClassName="max-w-lg">
        <DaoSubsidyDistributionForm
          countyHint={county}
          districtHint={district}
          readOnly={readOnly}
          onCancel={() => setSubsidyOpen(false)}
          onSuccess={() => setSubsidyOpen(false)}
        />
      </OperationDrawer>
    </>
  );
}
