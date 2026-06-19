"use client";

import * as React from "react";
import Link from "next/link";

import CaoActivityTimeline from "@/components/cao/CaoActivityTimeline";
import CaoApprovalQueues from "@/components/cao/CaoApprovalQueues";
import CaoCountyOperationsMap from "@/components/cao/CaoCountyOperationsMap";
import CaoDaoOversightGrid from "@/components/cao/CaoDaoOversightGrid";
import CaoDistrictPerformance from "@/components/cao/CaoDistrictPerformance";
import CaoKpiStrip from "@/components/cao/CaoKpiStrip";
import CaoReportingSection from "@/components/cao/CaoReportingSection";
import WorkflowReviewPanel from "@/components/workflow/WorkflowReviewPanel";
import { workflowStageForRole } from "@/lib/workflow/roles";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import OperationDrawer from "@/components/operations/OperationDrawer";
import MoaOperationalSurveyForm, { titleForMoaOperationalSurveyKind } from "@/components/reporting/MoaOperationalSurveyForm";
import { useDaoWorkflowQueue } from "@/hooks/useDaoWorkflowQueue";
import type { DaoWorkflowFormBindings, DaoWorkflowKind } from "@/lib/dao/dao-workflow-types";
import type { DaoOversightRow } from "@/lib/ais/county-dao-demo";
import { buildCaoDistrictCards } from "@/lib/cao/cao-district-cards";
import { MINISTRY_COUNTY_METRICS, MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import {
  fetchCountyWarehouseSignals,
  fetchDaoOversightRows,
  fetchOperationalFeedItems,
  normalizeCountyKey,
  type MinistryFeedItem,
} from "@/lib/data/ministry-data-service";
import type { WarehouseRow } from "@/lib/demo/agriculture-pilot-data";
import { warehouses as demoWarehouses } from "@/lib/demo/agriculture-pilot-data";
import { isCountyCoordinatorRole, isMinistryNationalRole } from "@/lib/auth/operational-roles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

function normalizeCounty(c: string | null | undefined) {
  return (c ?? "").trim().toLowerCase();
}

export default function CountyOfficerDashboard({
  county,
  role,
  fullName,
}: {
  county: string | null;
  role: UserRole;
  fullName: string;
}) {
  const nc = normalizeCounty(county);
  const nk = normalizeCountyKey(county);

  const [farmersCount, setFarmersCount] = React.useState<number | null>(null);
  const [daoRows, setDaoRows] = React.useState<DaoOversightRow[]>([]);
  const [warehouseRows, setWarehouseRows] = React.useState<WarehouseRow[]>([]);
  const [districtFilter, setDistrictFilter] = React.useState("all");
  const [syncFilter, setSyncFilter] = React.useState("all");
  const [actionBanner, setActionBanner] = React.useState<string | null>(null);

  const assignmentGap = isCountyCoordinatorRole(role) && !county?.trim();

  const approvalsInteractive = isCountyCoordinatorRole(role) || role === "super_admin" || role === "admin";

  const wf = useDaoWorkflowQueue();
  const moaDeskReadOnly = !approvalsInteractive;
  const [moaKind, setMoaKind] = React.useState<MoaOperationalSurveyKind | null>(null);
  const wfMoa = React.useMemo(
    () => (moaKind ? daoWorkflowBindings(wf, moaKind, moaDeskReadOnly) : undefined),
    [wf, moaKind, moaDeskReadOnly],
  );
  const officerRoleLabel = React.useMemo(() => {
    if (isCountyCoordinatorRole(role)) return "County Agriculture Coordinator (CAC)";
    if (isMinistryNationalRole(role)) return "Ministry national reviewer";
    return "County workspace";
  }, [role]);

  React.useEffect(() => {
    void (async () => {
      const [dao, wh] = await Promise.all([fetchDaoOversightRows(county), fetchCountyWarehouseSignals(county)]);
      setDaoRows(dao);
      setWarehouseRows(wh);
    })();
  }, [county]);

  React.useEffect(() => {
    void (async () => {
      if (!county?.trim()) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const { count, error } = await supabase
          .from("farmers")
          .select("id", { count: "exact", head: true })
          .ilike("county", county.trim());
        if (!error && count != null) setFarmersCount(count);
      } catch {
        /* ignore */
      }
    })();
  }, [county]);

  React.useEffect(() => {
    const review = () => setActionBanner("CAC review signal logged — route to approval queue or DAO messaging.");
    const correction = (e: Event) =>
      setActionBanner(`Correction request drafted for ${String((e as CustomEvent).detail ?? "DAO")} — notification stub.`);
    const escalate = (e: Event) =>
      setActionBanner(`Escalation ticket stub raised for ${String((e as CustomEvent).detail ?? "DAO")} · ministry CC.`);
    window.addEventListener("agritrace-cac-dao-review", review);
    window.addEventListener("agritrace-cac-correction", correction);
    window.addEventListener("agritrace-cac-escalate", escalate);
    return () => {
      window.removeEventListener("agritrace-cac-dao-review", review);
      window.removeEventListener("agritrace-cac-correction", correction);
      window.removeEventListener("agritrace-cac-escalate", escalate);
    };
  }, []);

  const scopedWarehouses = React.useMemo(() => {
    if (warehouseRows.length) {
      if (!nc) return warehouseRows;
      return warehouseRows.filter((w) => normalizeCounty(w.county) === nc || w.county.toLowerCase().includes(nc));
    }
    if (!nc) return demoWarehouses;
    return demoWarehouses.filter((w) => normalizeCounty(w.county) === nc || w.county.toLowerCase().includes(nc));
  }, [nc, warehouseRows]);

  const countyMetric = MINISTRY_COUNTY_METRICS.find((m) => normalizeCountyKey(m.county) === nk);

  const productionEstimateMt = React.useMemo(() => {
    if (!countyMetric) return null;
    return Math.round(countyMetric.productionIndex * 620) / 1000;
  }, [countyMetric]);

  const subsidyUtilizationPct = React.useMemo(() => {
    const wh = MINISTRY_WAREHOUSES.filter((w) => !nk || normalizeCountyKey(w.county) === nk);
    if (!wh.length) return null;
    return Math.round(wh.reduce((s, w) => s + w.utilizationPct, 0) / wh.length);
  }, [nk]);

  const districtCards = React.useMemo(() => buildCaoDistrictCards(county), [county]);

  const [alertFeed, setAlertFeed] = React.useState<MinistryFeedItem[]>([]);
  React.useEffect(() => {
    void fetchOperationalFeedItems(48).then((items) => {
      const scoped = items.filter((f) => {
        if (!nk) return true;
        const hay = `${f.title} ${f.detail}`.toLowerCase();
        return hay.includes(nk) || hay.includes((county ?? "").trim().toLowerCase());
      });
      setAlertFeed(scoped);
    });
  }, [nk, county]);

  const activeAlerts = alertFeed.filter((f) => f.tone === "rose" || f.tone === "amber").length;
  const overdueDaoReports = daoRows.reduce((s, r) => s + r.overdueReports, 0);

  const unresolvedEscalations =
    daoRows.filter((r) => r.riskStatus === "high" || r.syncStatus === "at_risk").length +
    alertFeed.filter((f) => {
      const t = `${f.title} ${f.detail}`.toLowerCase();
      return t.includes("escalat") || t.includes("pest");
    }).length;

  const countyLabel = county ?? "Unassigned county";

  return (
    <>
      <MinistryPageShell
        title={assignmentGap ? "County workspace" : `${county ?? "County"} · CAC command center`}
        description={
          assignmentGap
            ? "Your profile has no county assignment. Contact the ministry administrator to bind jurisdiction."
            : `County Agriculture Coordinator (CAC) oversight for ${fullName}. CLAN → DAO → CAC → Ministry reporting chain; scope below is ${county ?? "your county"}. National ministry roles retain read-through without expanding edit authority.`
        }
        actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/district-dashboard" className="h-10 inline-flex items-center rounded-lg border border-slate-600 px-4 text-[13px] text-slate-100 hover:bg-slate-800">
            DAO operational workspace
          </Link>
          <Link href="/farmers" className="h-10 inline-flex items-center rounded-lg bg-emerald-700 px-4 text-[13px] font-medium text-white hover:bg-emerald-600">
            Farmer registry
          </Link>
          <Link href="/inventory/transfers" className="h-10 inline-flex items-center rounded-lg border border-slate-600 px-4 text-[13px] text-slate-100 hover:bg-slate-800">
            Warehouse transfers
          </Link>
        </div>
      }
    >
      <div className="space-y-8 pb-12">
        {assignmentGap ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-50">
            County scope is required for KPI filtering and DAO grids. National analytics remain available from the ministry command center.
          </div>
        ) : null}

        {!assignmentGap && county ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-[12px] text-slate-400">
            <span className="font-semibold text-slate-200">Scope lock:</span> county ={" "}
            <span className="font-mono text-emerald-300/90">{county}</span> · districts and DAO rows derive from{" "}
            <span className="font-mono text-slate-300">pilot_dao_officers</span> / canonical fallback · warehouses filtered by county allocation signals.
          </p>
        ) : null}

        {actionBanner ? (
          <div className="rounded-xl border border-sky-700/45 bg-sky-950/25 px-4 py-3 text-[13px] text-sky-50">
            {actionBanner}{" "}
            <button type="button" className="ml-2 text-sky-300 underline" onClick={() => setActionBanner(null)}>
              Clear
            </button>
          </div>
        ) : null}

        {!assignmentGap ? (
          <CaoKpiStrip
            farmersRegistered={farmersCount}
            activeDaos={daoRows.length}
            overdueReports={overdueDaoReports}
            productionEstimateMt={productionEstimateMt}
            subsidyUtilizationPct={subsidyUtilizationPct}
            warehouseCoverage={scopedWarehouses.length}
            activeAlerts={activeAlerts}
            unresolvedEscalations={unresolvedEscalations}
          />
        ) : null}

        {!assignmentGap ? (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <h2 className="mb-1 font-display text-[14px] font-semibold text-white">CAC operational reporting</h2>
            <p className="mb-3 text-[12px] leading-relaxed text-slate-400">
              County-level MoA survey templates: operational summary, verification, escalation, and reporting compliance. Drafts persist on this device; pending
              work uses the same operational reporting queue pattern as the district hub when connectivity drops.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_operational_summary")}
                className="min-h-[100px] rounded-xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/40 to-slate-950 px-4 py-3 text-left shadow-md transition hover:border-emerald-600/45"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">CAC desk</div>
                <div className="mt-2 font-display text-[15px] font-semibold text-white">County operational summary</div>
                <div className="mt-1 text-[12px] text-emerald-100/75">Roll-up signals · DAO alignment · traceability notes</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_verification")}
                className="min-h-[100px] rounded-xl border border-sky-900/40 bg-gradient-to-br from-sky-950/35 to-slate-950 px-4 py-3 text-left shadow-md transition hover:border-sky-600/45"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-200/70">CAC desk</div>
                <div className="mt-2 font-display text-[15px] font-semibold text-white">County verification</div>
                <div className="mt-1 text-[12px] text-sky-100/75">Evidence status · hierarchical review · registry cross-check</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_escalation")}
                className="min-h-[100px] rounded-xl border border-rose-900/40 bg-gradient-to-br from-rose-950/30 to-slate-950 px-4 py-3 text-left shadow-md transition hover:border-rose-600/45"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-200/70">CAC desk</div>
                <div className="mt-2 font-display text-[15px] font-semibold text-white">County escalation</div>
                <div className="mt-1 text-[12px] text-rose-100/75">Risk routing · ministry handoff · operational notes</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_reporting_compliance")}
                className="min-h-[100px] rounded-xl border border-amber-900/40 bg-gradient-to-br from-amber-950/25 to-slate-950 px-4 py-3 text-left shadow-md transition hover:border-amber-600/45"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/70">CAC desk</div>
                <div className="mt-2 font-display text-[15px] font-semibold text-white">Reporting compliance</div>
                <div className="mt-1 text-[12px] text-amber-100/75">Enumerator coverage · submission hygiene · audit trail</div>
              </button>
            </div>
            {moaDeskReadOnly ? (
              <p className="mt-3 text-[11px] text-amber-200/85">This profile cannot queue CAC submissions — open forms in read-only review mode.</p>
            ) : null}
          </div>
        ) : null}

        {!assignmentGap ? (
          <>
            <WorkflowReviewPanel
              stage={workflowStageForRole(role)}
              readOnly={!approvalsInteractive}
              canCreate={approvalsInteractive}
              title="County approval workflow (persistent)"
            />

            <CaoApprovalQueues county={county} readOnly={!approvalsInteractive} />

            <CaoDaoOversightGrid
              rows={daoRows}
              districtFilter={districtFilter}
              syncFilter={syncFilter}
              onDistrictFilterChange={setDistrictFilter}
              onSyncFilterChange={setSyncFilter}
            />

            <details className="group rounded-xl border border-slate-800/80 bg-slate-950/30 open:border-slate-700/90">
              <summary className="cursor-pointer list-none px-4 py-3 font-display text-[13px] font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="mr-2 inline-block text-slate-500 transition group-open:rotate-90">▸</span>
                District maps, performance, and reporting archives
              </summary>
              <div className="space-y-8 border-t border-slate-800/60 px-4 py-5">
                <CaoDistrictPerformance cards={districtCards} />
                <CaoCountyOperationsMap county={county} daoRows={daoRows} />
                <div className="grid gap-8 xl:grid-cols-2">
                  <CaoReportingSection
                    countyLabel={countyLabel}
                    fullName={fullName}
                    farmersRegistered={farmersCount}
                    daoRows={daoRows}
                    warehouses={scopedWarehouses}
                    districtCards={districtCards}
                    productionEstimateMt={productionEstimateMt}
                    subsidyUtilPct={subsidyUtilizationPct}
                  />
                  <CaoActivityTimeline county={county} daoRows={daoRows} />
                </div>
              </div>
            </details>
          </>
        ) : null}
      </div>
    </MinistryPageShell>

      <OperationDrawer
        open={moaKind !== null}
        onClose={() => setMoaKind(null)}
        title={moaKind ? titleForMoaOperationalSurveyKind(moaKind) : "CAC operational survey"}
        widthClassName="max-w-3xl w-full"
      >
        {moaKind ? (
          <MoaOperationalSurveyForm
            kind={moaKind}
            countyDefault={county}
            districtDefault={null}
            officerName={fullName}
            officerRoleLabel={officerRoleLabel}
            readOnly={moaDeskReadOnly}
            daoWorkflow={wfMoa}
            onCancel={() => setMoaKind(null)}
            onSuccess={() => setMoaKind(null)}
          />
        ) : null}
      </OperationDrawer>
    </>
  );
}
