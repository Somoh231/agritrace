"use client";

import * as React from "react";
import Link from "next/link";

import DaoOfflineQueuePanel from "@/components/dao/DaoOfflineQueuePanel";
import DaoTodaysTasksPanel from "@/components/dao/DaoTodaysTasksPanel";
import {
  AlertCard,
  DashboardPanel,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import { RegistryKpiStrip } from "@/components/registry";
import DaoGpsEvidenceForm from "@/components/operations/forms/DaoGpsEvidenceForm";
import DaoPestDiseaseReportForm from "@/components/operations/forms/DaoPestDiseaseReportForm";
import DaoProductionEstimateForm from "@/components/operations/forms/DaoProductionEstimateForm";
import DaoSubsidyDistributionForm from "@/components/operations/forms/DaoSubsidyDistributionForm";
import OperationDrawer from "@/components/operations/OperationDrawer";
import RecordFieldInspectionForm from "@/components/operations/forms/RecordFieldInspectionForm";
import RegisterFarmerForm from "@/components/operations/forms/RegisterFarmerForm";
import MoaOperationalSurveyForm, { titleForMoaOperationalSurveyKind } from "@/components/reporting/MoaOperationalSurveyForm";
import WorkflowReviewPanel from "@/components/workflow/WorkflowReviewPanel";
import { workflowStageForRole } from "@/lib/workflow/roles";
import { useDaoWorkflowQueue } from "@/hooks/useDaoWorkflowQueue";
import type { DaoWorkflowFormBindings, DaoWorkflowKind } from "@/lib/dao/dao-workflow-types";
import { daoReviewReadOnly, isClanFieldRole, isDaoDistrictRole } from "@/lib/auth/operational-roles";
import type { MoaOperationalSurveyKind } from "@/lib/reporting/moa-operational-payload";
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
  const [moaKind, setMoaKind] = React.useState<MoaOperationalSurveyKind | null>(null);

  const officerRoleLabel = React.useMemo(() => {
    if (isClanFieldRole(role)) return "Clan Agriculture Crops Technician (CLAN)";
    if (isDaoDistrictRole(role)) return "District Agriculture Officer (DAO)";
    return "Field operations";
  }, [role]);

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
  const wfMoa = React.useMemo(() => (moaKind ? daoWorkflowBindings(wf, moaKind, readOnly) : undefined), [wf, moaKind, readOnly]);

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
        ? "border-forest-200 bg-forest-50/80 hover:border-forest-300"
        : accent === "amber"
          ? "border-amber-200 bg-amber-50/80 hover:border-amber-300"
          : accent === "rose"
            ? "border-rose-200 bg-rose-50/80 hover:border-rose-300"
            : accent === "sky"
              ? "border-sky-200 bg-sky-50/80 hover:border-sky-300"
              : "border-slate-200 bg-white hover:border-slate-300";
    const kickerCls =
      accent === "emerald"
        ? "text-forest-700"
        : accent === "amber"
          ? "text-amber-800"
          : accent === "rose"
            ? "text-rose-700"
            : accent === "sky"
              ? "text-sky-700"
              : "text-slate-500";

    return (
      <button
        type="button"
        onClick={onClick}
        className={`min-h-[112px] rounded-xl border px-4 py-4 text-left shadow-sm transition sm:min-h-[120px] ${ring}`}
      >
        <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${kickerCls}`}>{kicker}</div>
        <div className="mt-2 text-[15px] font-semibold leading-snug text-ink-900 sm:text-[16px]">{title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-slate-600">{body}</div>
      </button>
    );
  };

  return (
    <>
      <div className="space-y-6 pb-10">
        <PageHeader
          kicker="District operations · CLAN → DAO"
          title="District operations hub"
          description={`Field command for ${fullName}${county ? ` · ${county}` : ""}${district ? ` · ${district}` : ""}. Field reporting syncs to Supabase when online; otherwise submissions stay in the operational reporting queue on this device.`}
          actions={
            <Link href="#dao-offline-queue" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
              Jump to offline queue
            </Link>
          }
        />

        {readOnly ? (
          <AlertCard tone="info" title="Oversight mode">
            DAO captures are read-only. DAO officers use this hub for registrations, inspections, programme verification, and evidence capture.
          </AlertCard>
        ) : null}

        <RegistryKpiStrip
          items={[
            { label: "Connectivity", value: online ? "Online" : "Offline", hint: "Device posture", deltaTone: online ? "up" : "down" },
            { label: "Drafts", value: String(wf.counts.draft), hint: "Local saves" },
            { label: "Pending sync", value: String(wf.counts.pending_sync), hint: "Queue backlog", deltaTone: wf.counts.pending_sync > 0 ? "down" : "up" },
            { label: "Submitted", value: String(wf.counts.submitted), hint: "Synced records", deltaTone: "up" },
          ]}
        />

        <DashboardPanel>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <StatusBadge tone={online ? "success" : "warning"}>{online ? "Online" : "Offline"}</StatusBadge>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono">
                Draft · <span className="font-semibold text-ink-900">{wf.counts.draft}</span>
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-amber-900">
                Pending sync · <span className="font-semibold">{wf.counts.pending_sync}</span>
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-emerald-900">
                Submitted · <span className="font-semibold">{wf.counts.submitted}</span>
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-rose-900">
                Sync failed · <span className="font-semibold">{wf.counts.failed}</span>
              </span>
            </div>
            {!online && queuedPending ? (
              <p className="text-[12px] text-amber-800">
                Operational reporting queue holds {queuedPending} item(s) until connectivity returns.
              </p>
            ) : null}
          </div>
        </DashboardPanel>

        <DaoTodaysTasksPanel county={county} district={district} />

        <DashboardPanel padding="none">
          <div className="border-b border-slate-100 px-5 py-4">
            <SectionHeader kicker="Queue" title="District review workflow" subtitle="Persistent approval engine" />
          </div>
          <div className="p-4">
            <WorkflowReviewPanel
              stage={workflowStageForRole(role)}
              readOnly={readOnly}
              canCreate={!readOnly}
              title="District review workflow (persistent)"
            />
          </div>
        </DashboardPanel>

        <div id="dao-offline-queue">
          <DaoOfflineQueuePanel
            items={wf.items}
            counts={wf.counts}
            flushing={wf.flushing}
            onFlushPending={() => void wf.flushPending()}
            onRetryOne={(row) => void wf.retryOne(row)}
            onRemove={(id) => void wf.remove(id)}
          />
        </div>

        <DashboardPanel>
          <SectionHeader kicker="Required action" title="DAO field workflows" subtitle="Registry, inspections, programmes, and GPS evidence" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Tile kicker="Registry" title="Register farmer" body="Household ID · cooperative · GPS · ministry registry" accent="emerald" onClick={() => setFarmerOpen(true)} />
            <Tile kicker="Visit" title="Farm inspection" body="Condition · inputs · verification outcome · DAO notes" accent="slate" onClick={() => setInspectOpen(true)} />
            <Tile kicker="Alerts" title="Pest / disease report" body="County alert · severity · evidence refs · field_reports" accent="rose" onClick={() => setPestOpen(true)} />
            <Tile kicker="Season" title="Production estimate" body="Farmer · season · expected yield · rice records" accent="sky" onClick={() => setProductionOpen(true)} />
            <Tile kicker="Programmes" title="Verify subsidy delivery" body="Warehouse · SKU · quantities · distribution_logs" accent="amber" onClick={() => setSubsidyOpen(true)} />
            <Tile kicker="Evidence" title="GPS point / field evidence" body="Plot checkpoint · accuracy · geo_locations" accent="emerald" onClick={() => setGpsOpen(true)} />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Reporting" title="MoA operational surveys" subtitle="Structured enumerator and DAO desk reports aligned to ministry codes" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Tile kicker="CLAN" title="Crop monitoring" body="Growth stage · stress · GPS/photo evidence · farmer registry ID" accent="emerald" onClick={() => setMoaKind("clan_crop_monitoring")} />
            <Tile kicker="CLAN" title="Field activity report" body="Activities · inputs · operational notes · traceability envelope" accent="slate" onClick={() => setMoaKind("clan_field_activity_report")} />
            <Tile kicker="DAO desk" title="District summary" body="District operational rollup · county/district scope" accent="sky" onClick={() => setMoaKind("dao_district_summary")} />
            <Tile kicker="DAO desk" title="Operational review" body="Monitoring narrative · DAO verification pathway" accent="sky" onClick={() => setMoaKind("dao_operational_review")} />
            <Tile kicker="DAO desk" title="Verification review" body="Evidence checks · escalation hooks" accent="amber" onClick={() => setMoaKind("dao_verification_review")} />
            <Tile kicker="DAO desk" title="District escalation" body="Risk signal · CAC handoff · operational notes" accent="rose" onClick={() => setMoaKind("dao_district_escalation")} />
          </div>
        </DashboardPanel>
      </div>

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

      <OperationDrawer
        open={moaKind !== null}
        onClose={() => setMoaKind(null)}
        title={moaKind ? titleForMoaOperationalSurveyKind(moaKind) : "MoA operational survey"}
        widthClassName="max-w-3xl w-full"
      >
        {moaKind ? (
          <MoaOperationalSurveyForm
            kind={moaKind}
            countyDefault={county}
            districtDefault={district}
            officerName={fullName}
            officerRoleLabel={officerRoleLabel}
            readOnly={readOnly}
            daoWorkflow={wfMoa}
            onCancel={() => setMoaKind(null)}
            onSuccess={() => setMoaKind(null)}
          />
        ) : null}
      </OperationDrawer>
    </>
  );
}
