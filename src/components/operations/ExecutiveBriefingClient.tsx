"use client";

import * as React from "react";
import Link from "next/link";

import {
  AlertCard,
  DashboardPanel,
  EnterpriseDataGrid,
  KpiCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import {
  buildExecutiveBriefingSnapshot,
  exportDonorTxt,
  exportMinistryPrintPlaintext,
  generateCabinetSummaryText,
  generateCountyEscalationText,
  generateDonorBriefingText,
  generateWeeklyBriefingText,
  type LiveExecutiveSignals,
} from "@/lib/briefing/executive-intelligence";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, text: string) {
  downloadBlob(filename, new Blob([text], { type: "text/plain;charset=utf-8" }));
}

function BriefDocCard({
  title,
  body,
  onCopy,
}: {
  title: string;
  body: string;
  onCopy: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-200 rounded-xl"
      >
        <span className="text-[14px] font-medium text-ink-900">{title}</span>
        <span className="font-mono text-[11px] text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-600">
            {body}
          </pre>
          <button type="button" onClick={onCopy} className="btn-gov-outline mt-3 h-9 rounded-lg px-3 text-[12px]">
            Copy to clipboard
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ExecutiveBriefingClient() {
  const [presentation, setPresentation] = React.useState(false);
  const [live, setLive] = React.useState<Partial<LiveExecutiveSignals>>({});
  const [pdfBusy, setPdfBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [fc, cc, rice, fs] = await Promise.all([
          supabase.from("farmers").select("id", { count: "exact", head: true }),
          supabase.from("counties").select("id", { count: "exact", head: true }),
          supabase.from("rice_production_records").select("actual_yield_kg"),
          supabase.from("food_security_indicators").select("national_risk_score").limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        const kg = ((rice.data ?? []) as { actual_yield_kg?: number }[]).reduce((s, r) => s + Number(r.actual_yield_kg ?? 0), 0);
        setLive({
          farmersCount: fc.count ?? null,
          countiesOnboarded: cc.count ?? null,
          riceKgBooked: kg > 0 ? kg : null,
          nationalRiskScore: fs.data?.national_risk_score ?? null,
        });
      } catch {
        if (!cancelled) setLive({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const snap = React.useMemo(() => buildExecutiveBriefingSnapshot(live), [live]);

  const weekly = React.useMemo(() => generateWeeklyBriefingText(snap), [snap]);
  const cabinet = React.useMemo(() => generateCabinetSummaryText(snap), [snap]);
  const donor = React.useMemo(() => generateDonorBriefingText(snap), [snap]);
  const escalation = React.useMemo(() => generateCountyEscalationText(snap), [snap]);

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      const res = await fetch("/api/reports/executive-briefing");
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      downloadBlob("agrivault-executive-briefing.pdf", blob);
    } catch {
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  const openEscalations = snap.incidents.filter((i) => i.status === "Open" || i.status === "Escalated").length;

  const countyRows = snap.countyRanking.map((c) => ({
    county: c.county,
    index: String(c.productionIndex),
    foodRisk: c.foodRisk,
    dao: `${c.daoCompliance}%`,
  }));

  const inner = (
    <div className="briefing-print-root space-y-6 pb-10">
      <DashboardPanel padding="lg" className="border-forest-200/80 bg-gradient-to-br from-white via-forest-50/30 to-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="ent-label text-forest-700">National command intelligence</p>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-700">{snap.nationalProduction.headline}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
              Food security posture:{" "}
              <span className="font-medium text-ink-900">{snap.foodSecurity.postureLabel}</span>
              {snap.foodSecurity.nationalRiskScoreLive != null ? ` · Live risk score ${snap.foodSecurity.nationalRiskScoreLive}` : null}
              {live.countiesOnboarded != null ? ` · ${live.countiesOnboarded} counties onboarded (live)` : null}
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[min(100%,480px)]">
            <KpiCard label="Production index" value={snap.nationalProduction.productionIndexAvg.toFixed(1)} hint="Pilot weighted avg" />
            <KpiCard label="Subsidy utilization" value={`${snap.subsidyUtilization.utilizationPct}%`} deltaTone="up" />
            <KpiCard
              label="Warehouse footprint"
              value={String(snap.warehouseCoverage.facilityCount)}
              hint={`${snap.warehouseCoverage.countiesCovered} counties`}
            />
            <KpiCard label="Open escalations" value={String(openEscalations)} deltaTone={openEscalations > 0 ? "down" : "neutral"} />
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader
            kicker="Risk & ranking"
            title="Food security & county ranking"
            subtitle="County ordering by production index; intervention priority blends risk, DAO score, and productivity."
          />
          <div className="mt-4">
            <EnterpriseDataGrid
              rows={countyRows}
              columns={[
                { key: "county", header: "County" },
                { key: "index", header: "Index" },
                { key: "foodRisk", header: "Food risk" },
                { key: "dao", header: "DAO compliance" },
              ]}
              dense
              pageSize={10}
              filename="county-ranking.csv"
            />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader
            kicker="Economy of inputs"
            title="Subsidy utilization & warehouse coverage"
            subtitle="Modeled envelope vs verified beneficiary allocations; warehouse stress and donor-flagged resupply nodes."
          />
          <p className="mt-4 text-[14px] leading-relaxed text-slate-600">{snap.subsidyUtilization.narrative}</p>
          <ul className="mt-4 space-y-2.5 text-[13px] text-slate-600">
            <li>
              Average utilization{" "}
              <span className="font-medium text-ink-900">{snap.warehouseCoverage.avgUtilizationPct}%</span> · sites ≥90%:{" "}
              <span className="font-medium text-amber-800">{snap.warehouseCoverage.overCapacityCount}</span>
            </li>
            <li>
              Donor resupply flags:{" "}
              <span className="font-medium text-ink-900">{snap.warehouseCoverage.donorFlagSites}</span> facilities
            </li>
          </ul>
          <Link href="/inventory" className="mt-4 inline-flex text-[13px] font-medium text-forest-700 hover:text-forest-800">
            Open inventory command →
          </Link>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel>
          <SectionHeader kicker="Operations" title="Incidents & pests" subtitle="Live pilot ledger — custody escalations surface here first." />
          <ul className="mt-4 space-y-2">
            {snap.incidents.slice(0, 6).map((e) => (
              <li key={e.code} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{e.code}</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={e.severity === "critical" || e.severity === "Critical" ? "danger" : e.severity === "warning" || e.severity === "High" ? "warning" : "info"} uppercase>
                    {e.severity}
                  </StatusBadge>
                  <span className="text-[13px] font-medium text-ink-900">{e.eventType}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{e.message}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-500">{e.county}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="ent-label">Pest outbreaks</p>
            <ul className="mt-2 space-y-2">
              {snap.pestOutbreaks.length ?
                snap.pestOutbreaks.map((p) => (
                  <li key={p.code} className="text-[13px] text-slate-600">
                    <span className="font-medium text-ink-900">{p.county}</span> · {p.message}{" "}
                    <StatusBadge tone={p.status === "Active" ? "warning" : "neutral"} className="ml-1">
                      {p.status}
                    </StatusBadge>
                  </li>
                ))
              : <li className="text-[13px] text-slate-500">No pest flags in current pilot slice.</li>}
            </ul>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader kicker="Partners" title="Donor programme status" subtitle="Programme lines reconciled to warehouse custody and beneficiary uptake." />
          <ul className="mt-4 space-y-3">
            {snap.donorProgrammes.map((d) => (
              <li key={d.programme} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-3">
                <div className="text-[14px] font-medium text-ink-900">{d.programme}</div>
                <div className="mt-1 text-[12px] text-amber-900/80">{d.status}</div>
                <div className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{d.coverage}</div>
                <div className="mt-1 text-[12px] text-slate-500">{d.notes}</div>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader
            kicker="Briefing panels"
            title="Leadership signals"
            subtitle="DAO cadence, inventory friction, corridor delays, and forward production outlook."
          />
          <div className="mt-4 space-y-5 text-[13px] text-slate-600">
            <div>
              <p className="ent-label">DAO reporting compliance</p>
              <p className="mt-2 text-slate-700">
                Average <span className="font-medium text-ink-900">{snap.daoCompliance.avgPct}%</span> · {snap.daoCompliance.submissionsCycle}
              </p>
              {snap.daoCompliance.warningOfficers.length ?
                <ul className="mt-2 list-inside list-disc text-amber-800">
                  {snap.daoCompliance.warningOfficers.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              : null}
            </div>
            <div>
              <p className="ent-label">Inventory risks</p>
              <ul className="mt-2 space-y-1.5">
                {snap.inventoryRisks.slice(0, 5).map((r) => (
                  <li key={`${r.sku}-${r.warehouse}`}>
                    {r.warehouse} · {r.sku}: {r.issue}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ent-label">Shipment delays / custody</p>
              <ul className="mt-2 space-y-1.5">
                {snap.shipmentDelays.slice(0, 6).map((s) => (
                  <li key={s.transferCode}>
                    <span className="font-mono text-forest-700">{s.transferCode}</span> {s.status} · {s.sku}
                  </li>
                ))}
              </ul>
              <Link href="/inventory/transfers" className="mt-2 inline-flex text-[13px] font-medium text-forest-700 hover:text-forest-800">
                Transfer workflow →
              </Link>
            </div>
            <div>
              <p className="ent-label">Production forecasts</p>
              <ul className="mt-2 space-y-1.5 text-slate-700">
                {snap.productionForecasts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader
          kicker="Auto-generated"
          title="Briefing documents"
          subtitle="Weekly minister brief, cabinet summary, donor narrative, and county escalation matrix — copy into official channels."
        />
        <div className="briefing-no-print mt-4 grid gap-3 md:grid-cols-2">
          <BriefDocCard title="Weekly briefing" body={weekly} onCopy={() => void navigator.clipboard.writeText(weekly)} />
          <BriefDocCard title="Cabinet summary" body={cabinet} onCopy={() => void navigator.clipboard.writeText(cabinet)} />
          <BriefDocCard title="Donor briefing" body={donor} onCopy={() => void navigator.clipboard.writeText(donor)} />
          <BriefDocCard title="County escalation summary" body={escalation} onCopy={() => void navigator.clipboard.writeText(escalation)} />
        </div>
        <div className="briefing-no-print mt-4 grid gap-4 lg:grid-cols-2">
          <AlertCard tone="info" title="Key changes this week">
            <ul className="mt-2 list-inside list-disc space-y-1 text-[13px]">
              {snap.keyChangesThisWeek.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </AlertCard>
          <AlertCard tone="warning" title="Counties needing intervention">
            <div className="mt-2 flex flex-wrap gap-2">
              {snap.countiesNeedingIntervention.map((c) => (
                <StatusBadge key={c} tone="danger">
                  {c}
                </StatusBadge>
              ))}
            </div>
          </AlertCard>
        </div>
      </DashboardPanel>

      <p className="text-center font-mono text-[11px] text-slate-500">
        Confidential · Government custody · {snap.generatedAtIso.slice(0, 10)}
      </p>
    </div>
  );

  if (presentation) {
    return (
      <div className="briefing-print-root briefing-presentation fixed inset-0 z-[120] overflow-auto enterprise-canvas px-4 py-8 md:px-10">
        <div className="briefing-no-print mx-auto mb-6 flex max-w-6xl justify-end gap-2">
          <button type="button" onClick={() => setPresentation(false)} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
            Exit presentation
          </button>
        </div>
        <div className="mx-auto max-w-6xl">{inner}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Ministry leadership"
        title="Executive intelligence briefing"
        description="Briefing-ready national posture for the Minister, Deputy Minister, and senior leadership — synthesized from registry, logistics, DAO compliance, and pilot analytical signals."
        actions={
          <div className="briefing-no-print flex flex-wrap gap-2">
            <button type="button" onClick={() => setPresentation(true)} className="btn-gold h-10 rounded-lg px-4 text-[13px]">
              Presentation mode
            </button>
            <button type="button" onClick={() => window.print()} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
              Ministry print view
            </button>
            <button type="button" disabled={pdfBusy} onClick={() => void exportPdf()} className="btn-emerald h-10 rounded-lg px-4 text-[13px] disabled:opacity-50">
              {pdfBusy ? "PDF…" : "PDF export"}
            </button>
            <button
              type="button"
              onClick={() => downloadText("donor-briefing.txt", exportDonorTxt(snap))}
              className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]"
            >
              Donor export
            </button>
            <button
              type="button"
              onClick={() => downloadText("ministry-briefing-full.txt", exportMinistryPrintPlaintext(snap))}
              className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]"
            >
              Full text bundle
            </button>
          </div>
        }
      />
      {inner}
    </div>
  );
}
