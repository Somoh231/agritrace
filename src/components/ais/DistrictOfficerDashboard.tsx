"use client";

import * as React from "react";
import Link from "next/link";

import DaoOfflineQueuePanel from "@/components/dao/DaoOfflineQueuePanel";
import DaoTodaysTasksPanel from "@/components/dao/DaoTodaysTasksPanel";
import DaoGpsEvidenceForm from "@/components/operations/forms/DaoGpsEvidenceForm";
import DaoPestDiseaseReportForm from "@/components/operations/forms/DaoPestDiseaseReportForm";
import DaoProductionEstimateForm from "@/components/operations/forms/DaoProductionEstimateForm";
import DaoSubsidyDistributionForm from "@/components/operations/forms/DaoSubsidyDistributionForm";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFieldInspectionForm from "@/components/operations/forms/RecordFieldInspectionForm";
import RegisterFarmerForm from "@/components/operations/forms/RegisterFarmerForm";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import { useDaoWorkflowQueue } from "@/hooks/useDaoWorkflowQueue";
import type { DaoWorkflowFormBindings, DaoWorkflowKind } from "@/lib/dao/dao-workflow-types";
import { daoReviewReadOnly } from "@/lib/auth/operational-roles";
import type { UserRole } from "@/lib/supabase/types";

function daoWorkflowBindings(
  wf: ReturnType<typeof useDaoWorkflowQueue>,
  kind: DaoWorkflowKind,
  readOnly: boolean,
): DaoWorkflowFormBindings | undefined {
  if (readOnly) return undefined;
  return {
    enabled: true,
    saveDraft: (s) => wf.saveDraft(kind, s),
    queuePending: (s) => wf.queuePending(kind, s),
    onSubmitFailure: (s, m) => wf.onRemoteFailure(kind, s, m),
    markSynced: (b) => wf.markSubmitted(kind, b),
  };
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
  const readOnly = daoReviewReadOnly(role);
  const wf = useDaoWorkflowQueue();
  const [online, setOnline] = React.useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  const [farmerOpen, setFarmerOpen] = React.useState(false);
  const [inspectOpen, setInspectOpen] = React.useState(false);
  const [pestOpen, setPestOpen] = React.useState(false);
  const [productionOpen, setProductionOpen] = React.useState(false);
  const [subsidyOpen, setSubsidyOpen] = React.useState(false);
  const [gpsOpen, setGpsOpen] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const wfFarmer = daoWorkflowBindings(wf, "register_farmer", readOnly);
  const wfInspect = daoWorkflowBindings(wf, "farm_inspection", readOnly);
  const wfPest = daoWorkflowBindings(wf, "pest_disease_report", readOnly);
  const wfProduction = daoWorkflowBindings(wf, "production_estimate", readOnly);
  const wfSubsidy = daoWorkflowBindings(wf, "subsidy_delivery_verify", readOnly);
  const wfGps = daoWorkflowBindings(wf, "gps_field_evidence", readOnly);

  const queuedPending = wf.counts.pending_sync + wf.counts.failed;

  const Tile = ({
    accent,
    kicker,
    title,
    body,
    onClick,
  }: {
    accent: "emerald" | "slate" | "amber" | "rose" | "sky";
    kicker: string;
    title: string;
    body: string;
    onClick: () => void;
  }) => {
    const ring =
      accent === "emerald"
        ? "border-emerald-800/50 from-emerald-950/80 hover:border-emerald-600/50"
        : accent === "amber"
          ? "border-amber-900/40 from-amber-950/25 hover:border-amber-700/50"
          : accent === "rose"
            ? "border-rose-900/40 from-rose-950/25 hover:border-rose-700/50"
            : accent === "sky"
              ? "border-sky-900/40 from-sky-950/25 hover:border-sky-700/50"
              : "border-slate-700 hover:border-slate-500";
    const kickerCls =
      accent === "emerald"
        ? "text-emerald-200/70"
        : accent === "amber"
          ? "text-amber-200/70"
          : accent === "rose"
            ? "text-rose-200/75"
            : accent === "sky"
              ? "text-sky-200/75"
              : "text-slate-400";
    const bodyCls =
      accent === "emerald" ? "text-emerald-100/75" : accent === "amber" ? "text-amber-100/75" : accent === "sky" ? "text-sky-100/75" : "text-slate-400";

    return (
      <button
        type="button"
        onClick={onClick}
        className={`min-h-[112px] rounded-xl border bg-gradient-to-br to-slate-950 px-4 py-4 text-left shadow-lg transition sm:min-h-[120px] ${ring}`}
      >
        <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${kickerCls}`}>{kicker}</div>
        <div className="mt-2 font-display text-[15px] font-semibold leading-snug text-white sm:text-[16px]">{title}</div>
        <div className={`mt-1 text-[12px] leading-relaxed ${bodyCls}`}>{body}</div>
      </button>
    );
  };

  return (
    <>
      <MinistryPageShell
        title="District operations hub"
        description={`District Agriculture Officer (DAO) workspace · ${fullName}${county ? ` · ${county}` : ""}${district ? ` · ${district}` : ""}. Capture workflows on mobile; submissions sync to Supabase when available or land in the DAO offline queue.`}
        actions={
          <Link href="#dao-offline-queue" className="h-10 inline-flex items-center rounded-lg border border-slate-600 px-4 text-[13px] text-slate-100 hover:bg-slate-800">
            Jump to offline queue
          </Link>
        }
      >
        <div className="space-y-6 pb-10">
          {readOnly ? (
            <div className="rounded-xl border border-sky-500/35 bg-sky-950/30 px-4 py-3 text-[13px] text-sky-50">
              Oversight mode — DAO captures are read-only. DAO officers use this hub for registrations, inspections, programme verification, and evidence capture.
            </div>
          ) : null}

          <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] ${
                online ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100" : "border-amber-500/40 bg-amber-950/35 text-amber-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              {online ? "Online" : "Offline"}
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="rounded-md border border-slate-700 px-2 py-0.5 font-mono text-slate-200">
                Draft · <span className="text-white">{wf.counts.draft}</span>
              </span>
              <span className="rounded-md border border-amber-800/50 px-2 py-0.5 font-mono text-amber-100/95">
                Pending · <span className="text-white">{wf.counts.pending_sync}</span>
              </span>
              <span className="rounded-md border border-emerald-800/45 px-2 py-0.5 font-mono text-emerald-100/90">
                Submitted · <span className="text-white">{wf.counts.submitted}</span>
              </span>
              <span className="rounded-md border border-rose-800/45 px-2 py-0.5 font-mono text-rose-100/90">
                Failed · <span className="text-white">{wf.counts.failed}</span>
              </span>
            </div>
            {!online && queuedPending ? (
              <span className="text-[11px] text-amber-200/90">DAO queue holds {queuedPending} item(s) until connectivity returns — open Offline queue to retry.</span>
            ) : null}
          </div>

          <DaoTodaysTasksPanel county={county} district={district} />

          <div>
            <h2 className="mb-3 font-display text-[14px] font-semibold text-white">DAO workflows</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Tile kicker="Registry" title="Register farmer" body="Household ID · cooperative · GPS · ministry registry" accent="emerald" onClick={() => setFarmerOpen(true)} />
              <Tile kicker="Visit" title="Farm inspection" body="Condition · inputs · verification outcome · DAO notes" accent="slate" onClick={() => setInspectOpen(true)} />
              <Tile kicker="Alerts" title="Pest / disease report" body="County alert · severity · evidence refs · field_reports" accent="rose" onClick={() => setPestOpen(true)} />
              <Tile kicker="Season" title="Production estimate" body="Farmer · season · expected yield · rice records" accent="sky" onClick={() => setProductionOpen(true)} />
              <Tile kicker="Programmes" title="Verify subsidy delivery" body="Warehouse · SKU · quantities · distribution_logs" accent="amber" onClick={() => setSubsidyOpen(true)} />
              <Tile kicker="Evidence" title="GPS point / field evidence" body="Plot checkpoint · accuracy · geo_locations" accent="emerald" onClick={() => setGpsOpen(true)} />
            </div>
          </div>

          <DaoOfflineQueuePanel
            items={wf.items}
            counts={wf.counts}
            flushing={wf.flushing}
            onFlushPending={() => void wf.flushPending()}
            onRetryOne={(row) => void wf.retryOne(row)}
            onRemove={(id) => void wf.remove(id)}
          />
        </div>
      </MinistryPageShell>

      <OperationDrawer open={farmerOpen} onClose={() => setFarmerOpen(false)} title="Register farmer" widthClassName="max-w-3xl w-full">
        <RegisterFarmerForm
          countyDefault={county ?? undefined}
          districtDefault={district ?? undefined}
          readOnly={readOnly}
          daoWorkflow={wfFarmer}
          onCancel={() => setFarmerOpen(false)}
          onSuccess={() => setFarmerOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={inspectOpen} onClose={() => setInspectOpen(false)} title="Farm inspection (DAO visit)" widthClassName="max-w-3xl w-full">
        <RecordFieldInspectionForm readOnly={readOnly} daoWorkflow={wfInspect} onCancel={() => setInspectOpen(false)} onSuccess={() => setInspectOpen(false)} />
      </OperationDrawer>

      <OperationDrawer open={pestOpen} onClose={() => setPestOpen(false)} title="Pest / disease report" widthClassName="max-w-lg">
        <DaoPestDiseaseReportForm
          countyDefault={county}
          districtDefault={district}
          readOnly={readOnly}
          daoWorkflow={wfPest}
          onCancel={() => setPestOpen(false)}
          onSuccess={() => setPestOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={productionOpen} onClose={() => setProductionOpen(false)} title="Production estimate" widthClassName="max-w-lg">
        <DaoProductionEstimateForm
          countyDefault={county}
          districtDefault={district}
          readOnly={readOnly}
          daoWorkflow={wfProduction}
          onCancel={() => setProductionOpen(false)}
          onSuccess={() => setProductionOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={subsidyOpen} onClose={() => setSubsidyOpen(false)} title="Verify subsidy delivery" widthClassName="max-w-lg">
        <DaoSubsidyDistributionForm
          countyHint={county}
          districtHint={district}
          readOnly={readOnly}
          daoWorkflow={wfSubsidy}
          onCancel={() => setSubsidyOpen(false)}
          onSuccess={() => setSubsidyOpen(false)}
        />
      </OperationDrawer>

      <OperationDrawer open={gpsOpen} onClose={() => setGpsOpen(false)} title="GPS point / field evidence" widthClassName="max-w-lg">
        <DaoGpsEvidenceForm readOnly={readOnly} daoWorkflow={wfGps} onCancel={() => setGpsOpen(false)} onSuccess={() => setGpsOpen(false)} />
      </OperationDrawer>
    </>
  );
}
