"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCheck, MapPin, Users, Warehouse } from "lucide-react";

import CaoActivityTimeline from "@/components/cao/CaoActivityTimeline";
import CaoApprovalQueues from "@/components/cao/CaoApprovalQueues";
import CaoCountyOperationsMap from "@/components/cao/CaoCountyOperationsMap";
import CaoDaoOversightGrid from "@/components/cao/CaoDaoOversightGrid";
import CaoDistrictPerformance from "@/components/cao/CaoDistrictPerformance";
import CaoKpiStrip from "@/components/cao/CaoKpiStrip";
import CaoReportingSection from "@/components/cao/CaoReportingSection";
import CountyIntelligenceAnalytics from "@/components/intelligence/CountyIntelligenceAnalytics";
import {
  AlertCard,
  DashboardPanel,
  DataSourceNotice,
  PageHeader,
  QuickActionCard,
  SectionHeader,
} from "@/components/enterprise";
import WorkflowReviewPanel from "@/components/workflow/WorkflowReviewPanel";
import { workflowStageForRole } from "@/lib/workflow/roles";
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
import { demoSource, resolveDisplaySource, type DataSourceMeta } from "@/lib/data/data-source";
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
  const [pageSource, setPageSource] = React.useState<DataSourceMeta | null>(null);
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
      setDaoRows(dao.data);
      setWarehouseRows(wh.data);
      setPageSource(resolveDisplaySource([dao.source, wh.source]));
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

  React.useEffect(() => {
    if (warehouseRows.length === 0 && scopedWarehouses.length > 0) {
      setPageSource((prev) => resolveDisplaySource([prev ?? demoSource(), demoSource("warehouses empty → demoWarehouses")]));
    }
  }, [warehouseRows.length, scopedWarehouses.length]);

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
    void fetchOperationalFeedItems(48).then((result) => {
      const items = result.data;
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
      <div className="space-y-6 pb-12">
        <PageHeader
          kicker="County Agriculture Coordinator · CAC command"
          title={assignmentGap ? "County workspace" : `${county ?? "County"} command center`}
          description={
            assignmentGap
              ? "Your profile has no county assignment. Contact the ministry administrator to bind jurisdiction."
              : `County Agriculture Coordinator (CAC) oversight for ${fullName}. CLAN → DAO → CAC → Ministry reporting chain; scope below is ${county ?? "your county"}. National ministry roles retain read-through without expanding edit authority.`
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/district-dashboard" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
                DAO operations hub
              </Link>
              <Link href="/farmers" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
                Farmer registry
              </Link>
              <Link href="/inventory/transfers" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
                Warehouse transfers
              </Link>
            </div>
          }
        />
        {pageSource ? <DataSourceNotice source={pageSource} className="mt-1" /> : null}

        {assignmentGap ? (
          <AlertCard tone="warning" title="County assignment required">
            County scope is required for KPI filtering and DAO grids. National analytics remain available from the ministry command center.
          </AlertCard>
        ) : null}

        {!assignmentGap && county ? (
          <AlertCard tone="info" title="Scope lock">
            County = <span className="font-mono font-medium">{county}</span> · districts and DAO rows derive from pilot_dao_officers / canonical fallback · warehouses filtered by county allocation signals.
          </AlertCard>
        ) : null}

        {actionBanner ? (
          <AlertCard tone="info" title="CAC action logged" action={<button type="button" className="text-[12px] font-medium underline" onClick={() => setActionBanner(null)}>Clear</button>}>
            {actionBanner}
          </AlertCard>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard href="/verification-queue" icon={ClipboardCheck} title="Verification desk" description="Approve, reject, and escalate county submissions." />
            <QuickActionCard href="/map" icon={MapPin} title="County map" description="Operational GIS for production and warehouse posture." />
            <QuickActionCard href="/farmers" icon={Users} title="Farmer registry" description="County-scoped identity and traceability records." />
            <QuickActionCard href="/operations/warehouses" icon={Warehouse} title="Warehouse oversight" description="Custody posture and replenishment signals." />
          </div>
        ) : null}

        {!assignmentGap ? <CountyIntelligenceAnalytics county={county} /> : null}

        {!assignmentGap ? (
          <DashboardPanel>
            <SectionHeader kicker="Required action" title="CAC operational reporting" subtitle="County-level MoA survey templates — drafts persist on device; pending work uses the operational reporting queue when offline." />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_operational_summary")}
                className="min-h-[100px] rounded-xl border border-forest-200 bg-forest-50/80 px-4 py-3 text-left transition hover:border-forest-300 hover:shadow-sm"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-forest-700">CAC desk</div>
                <div className="mt-2 text-[15px] font-semibold text-ink-900">County operational summary</div>
                <div className="mt-1 text-[12px] text-slate-600">Roll-up signals · DAO alignment · traceability notes</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_verification")}
                className="min-h-[100px] rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-left transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-700">CAC desk</div>
                <div className="mt-2 text-[15px] font-semibold text-ink-900">County verification</div>
                <div className="mt-1 text-[12px] text-slate-600">Evidence status · hierarchical review · registry cross-check</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_county_escalation")}
                className="min-h-[100px] rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-left transition hover:border-rose-300 hover:shadow-sm"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-700">CAC desk</div>
                <div className="mt-2 text-[15px] font-semibold text-ink-900">County escalation</div>
                <div className="mt-1 text-[12px] text-slate-600">Risk routing · ministry handoff · operational notes</div>
              </button>
              <button
                type="button"
                onClick={() => setMoaKind("cac_reporting_compliance")}
                className="min-h-[100px] rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left transition hover:border-amber-300 hover:shadow-sm"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800">CAC desk</div>
                <div className="mt-2 text-[15px] font-semibold text-ink-900">Reporting compliance</div>
                <div className="mt-1 text-[12px] text-slate-600">Enumerator coverage · submission hygiene · audit trail</div>
              </button>
            </div>
            {moaDeskReadOnly ? (
              <p className="mt-3 text-[12px] text-amber-800">This profile cannot queue CAC submissions — open forms in read-only review mode.</p>
            ) : null}
          </DashboardPanel>
        ) : null}

        {!assignmentGap ? (
          <>
            <DashboardPanel padding="none">
              <div className="border-b border-slate-100 px-5 py-4">
                <SectionHeader kicker="Queue" title="County approval workflow" subtitle="Persistent workflow engine · audited decisions" />
              </div>
              <div className="p-4">
                <WorkflowReviewPanel
                  stage={workflowStageForRole(role)}
                  readOnly={!approvalsInteractive}
                  canCreate={approvalsInteractive}
                  title="County approval workflow (persistent)"
                />
              </div>
            </DashboardPanel>

            <CaoApprovalQueues county={county} readOnly={!approvalsInteractive} />

            <DashboardPanel padding="none">
              <div className="border-b border-slate-100 px-5 py-4">
                <SectionHeader kicker="Review desk" title="DAO oversight grid" subtitle="County-scoped district officers · sync and risk posture" />
              </div>
              <CaoDaoOversightGrid
                rows={daoRows}
                districtFilter={districtFilter}
                syncFilter={syncFilter}
                onDistrictFilterChange={setDistrictFilter}
                onSyncFilterChange={setSyncFilter}
              />
            </DashboardPanel>

            <DashboardPanel>
              <SectionHeader kicker="GIS" title="District maps, performance, and reporting archives" />
              <div className="mt-4 space-y-8">
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
            </DashboardPanel>
          </>
        ) : null}
      </div>

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
