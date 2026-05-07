"use client";

import * as React from "react";
import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
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

function BriefingMetric({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "gold" | "slate" | "rose";
}) {
  const bar =
    accent === "gold"
      ? "border-l-[3px] border-l-amber-400/90"
      : accent === "slate"
        ? "border-l-[3px] border-l-slate-500"
        : accent === "rose"
          ? "border-l-[3px] border-l-rose-500/90"
          : "border-l-[3px] border-l-emerald-500/80";
  return (
    <div className={`rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-sm ${bar}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function IntelSection({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-slate-950/80 to-black/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-500/85">{kicker}</div>
      <h2 className="mt-1 font-display text-[15px] font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
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
    <div className="rounded-lg border border-slate-800 bg-slate-950/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-900/50"
      >
        <span className="text-[13px] font-medium text-white">{title}</span>
        <span className="font-mono text-[10px] text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="border-t border-slate-800 px-3 py-3">
          <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-400">
            {body}
          </pre>
          <button
            type="button"
            onClick={onCopy}
            className="mt-2 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-900"
          >
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
      /* fallback: print */
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  const shell = (children: React.ReactNode) =>
    presentation ? (
      <div className="briefing-print-root briefing-presentation fixed inset-0 z-[120] overflow-auto bg-[#030806] px-4 py-8 md:px-10">
        <div className="briefing-no-print mx-auto mb-6 flex max-w-6xl justify-end gap-2">
          <button
            type="button"
            onClick={() => setPresentation(false)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-[12px] text-white hover:bg-slate-900"
          >
            Exit presentation
          </button>
        </div>
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    ) : (
      <MinistryPageShell
        title="Executive intelligence briefing"
        description="Briefing-ready national posture for the Minister, Deputy Minister, and senior leadership — synthesized from registry, logistics, DAO compliance, and pilot analytical signals."
        actions={
          <div className="briefing-no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPresentation(true)}
              className="h-10 rounded-lg bg-amber-600/90 px-4 text-[12px] font-medium text-black hover:bg-amber-500"
            >
              Presentation mode
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
            >
              Ministry print view
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={() => void exportPdf()}
              className="h-10 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-4 text-[12px] text-emerald-100 hover:bg-emerald-950/60 disabled:opacity-50"
            >
              {pdfBusy ? "PDF…" : "PDF export"}
            </button>
            <button
              type="button"
              onClick={() => downloadText("donor-briefing.txt", exportDonorTxt(snap))}
              className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
            >
              Donor export
            </button>
            <button
              type="button"
              onClick={() => downloadText("ministry-briefing-full.txt", exportMinistryPrintPlaintext(snap))}
              className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
            >
              Full text bundle
            </button>
          </div>
        }
      >
        <div className="briefing-print-root space-y-8 pb-14">{children}</div>
      </MinistryPageShell>
    );

  const inner = (
    <>
      <div className="briefing-no-print rounded-xl border border-emerald-900/30 bg-gradient-to-br from-emerald-950/50 via-slate-950/70 to-[#050810] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400/80">National command intelligence</div>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">{snap.nationalProduction.headline}</p>
            <p className="mt-2 text-[12px] text-slate-500">
              Food security posture: <span className="text-slate-200">{snap.foodSecurity.postureLabel}</span>
              {snap.foodSecurity.nationalRiskScoreLive != null ?
                ` · Live risk score ${snap.foodSecurity.nationalRiskScoreLive}`
              : null}
              {live.countiesOnboarded != null ? ` · ${live.countiesOnboarded} counties onboarded (live)` : null}
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[min(100%,440px)]">
            <BriefingMetric
              label="Production index"
              value={snap.nationalProduction.productionIndexAvg.toFixed(1)}
              hint="Pilot weighted avg"
              accent="gold"
            />
            <BriefingMetric
              label="Subsidy utilization"
              value={`${snap.subsidyUtilization.utilizationPct}%`}
              accent="emerald"
            />
            <BriefingMetric
              label="Warehouse footprint"
              value={`${snap.warehouseCoverage.facilityCount}`}
              hint={`${snap.warehouseCoverage.countiesCovered} counties`}
              accent="slate"
            />
            <BriefingMetric
              label="Open escalations"
              value={String(snap.incidents.filter((i) => i.status === "Open" || i.status === "Escalated").length)}
              accent="rose"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IntelSection
          kicker="Risk & ranking"
          title="Food security & county ranking"
          subtitle="County ordering by production index; intervention priority blends risk, DAO score, and productivity."
        >
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-slate-800 bg-black/30 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">County</th>
                  <th className="px-3 py-2">Index</th>
                  <th className="px-3 py-2">Food risk</th>
                  <th className="px-3 py-2">DAO</th>
                </tr>
              </thead>
              <tbody>
                {snap.countyRanking.map((c) => (
                  <tr key={c.county} className="border-b border-slate-800/80 text-slate-300">
                    <td className="px-3 py-2 font-medium text-white">{c.county}</td>
                    <td className="px-3 py-2 tabular-nums">{c.productionIndex}</td>
                    <td className="px-3 py-2">{c.foodRisk}</td>
                    <td className="px-3 py-2 tabular-nums">{c.daoCompliance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IntelSection>

        <IntelSection
          kicker="Economy of inputs"
          title="Subsidy utilization & warehouse coverage"
          subtitle="Modeled envelope vs verified beneficiary allocations; warehouse stress and donor-flagged resupply nodes."
        >
          <p className="text-[13px] leading-relaxed text-slate-400">{snap.subsidyUtilization.narrative}</p>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-400">
            <li>
              Average utilization <span className="text-white">{snap.warehouseCoverage.avgUtilizationPct}%</span> · sites ≥90%:{" "}
              <span className="text-amber-200/90">{snap.warehouseCoverage.overCapacityCount}</span>
            </li>
            <li>
              Donor resupply flags: <span className="text-white">{snap.warehouseCoverage.donorFlagSites}</span> facilities
            </li>
            <li className="pt-2">
              <Link href="/inventory" className="text-emerald-400 hover:text-emerald-300">
                Open inventory command →
              </Link>
            </li>
          </ul>
        </IntelSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <IntelSection kicker="Operations" title="Incidents & pests" subtitle="Live pilot ledger — custody escalations surface here first.">
          <ul className="space-y-2">
            {snap.incidents.slice(0, 6).map((e) => (
              <li key={e.code} className="rounded-lg border border-slate-800/90 bg-slate-950/40 px-3 py-2 text-[12px] text-slate-400">
                <span className="font-mono text-[10px] text-slate-600">{e.code}</span>
                <div className="mt-0.5 text-white">
                  [{e.severity}] {e.eventType}
                </div>
                <div className="mt-1">{e.message}</div>
                <div className="mt-1 font-mono text-[10px] text-slate-600">{e.county}</div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-rose-400/90">Pest outbreaks</div>
            <ul className="mt-2 space-y-2">
              {snap.pestOutbreaks.length ?
                snap.pestOutbreaks.map((p) => (
                  <li key={p.code} className="text-[12px] text-slate-400">
                    <span className="text-white">{p.county}</span> · {p.message}{" "}
                    <span className="font-mono text-[10px] text-slate-600">({p.status})</span>
                  </li>
                ))
              : <li className="text-[12px] text-slate-600">No pest flags in current pilot slice.</li>}
            </ul>
          </div>
        </IntelSection>

        <IntelSection kicker="Partners" title="Donor programme status" subtitle="Programme lines reconciled to warehouse custody and beneficiary uptake.">
          <ul className="space-y-3">
            {snap.donorProgrammes.map((d) => (
              <li key={d.programme} className="rounded-lg border border-amber-900/25 bg-amber-950/10 px-3 py-2">
                <div className="text-[13px] font-medium text-amber-50">{d.programme}</div>
                <div className="mt-1 text-[11px] text-amber-200/70">{d.status}</div>
                <div className="mt-1 text-[11px] text-slate-500">{d.coverage}</div>
                <div className="mt-1 text-[11px] text-slate-500">{d.notes}</div>
              </li>
            ))}
          </ul>
        </IntelSection>

        <IntelSection
          kicker="Briefing panels"
          title="Leadership signals"
          subtitle="DAO cadence, inventory friction, corridor delays, and forward production outlook."
        >
          <div className="space-y-4 text-[12px] text-slate-400">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">DAO reporting compliance</div>
              <p className="mt-1 text-slate-300">
                Average {snap.daoCompliance.avgPct}% · {snap.daoCompliance.submissionsCycle}
              </p>
              {snap.daoCompliance.warningOfficers.length ?
                <ul className="mt-2 list-inside list-disc text-amber-200/80">
                  {snap.daoCompliance.warningOfficers.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              : null}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">Inventory risks</div>
              <ul className="mt-2 space-y-1">
                {snap.inventoryRisks.slice(0, 5).map((r) => (
                  <li key={`${r.sku}-${r.warehouse}`}>
                    {r.warehouse} · {r.sku}: {r.issue}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">Shipment delays / custody</div>
              <ul className="mt-2 space-y-1">
                {snap.shipmentDelays.slice(0, 6).map((s) => (
                  <li key={s.transferCode}>
                    <span className="font-mono text-emerald-400/90">{s.transferCode}</span> {s.status} · {s.sku}
                  </li>
                ))}
              </ul>
              <Link href="/inventory/transfers" className="mt-2 inline-block text-emerald-400 hover:text-emerald-300">
                Transfer workflow →
              </Link>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">Production forecasts</div>
              <ul className="mt-2 space-y-1 text-slate-300">
                {snap.productionForecasts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </IntelSection>
      </div>

      <IntelSection
        kicker="Auto-generated"
        title="Briefing documents"
        subtitle="Weekly minister brief, cabinet summary, donor narrative, and county escalation matrix — copy into official channels."
      >
        <div className="briefing-no-print grid gap-2 md:grid-cols-2">
          <BriefDocCard title="Weekly briefing" body={weekly} onCopy={() => void navigator.clipboard.writeText(weekly)} />
          <BriefDocCard title="Cabinet summary" body={cabinet} onCopy={() => void navigator.clipboard.writeText(cabinet)} />
          <BriefDocCard title="Donor briefing" body={donor} onCopy={() => void navigator.clipboard.writeText(donor)} />
          <BriefDocCard title="County escalation summary" body={escalation} onCopy={() => void navigator.clipboard.writeText(escalation)} />
        </div>
        <div className="briefing-no-print mt-4 rounded-lg border border-slate-800 bg-black/20 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">Key changes this week</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-slate-400">
            {snap.keyChangesThisWeek.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
        <div className="briefing-no-print mt-4 rounded-lg border border-slate-800 bg-black/20 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-600">Counties needing intervention</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {snap.countiesNeedingIntervention.map((c) => (
              <span key={c} className="rounded-md border border-rose-900/40 bg-rose-950/25 px-2 py-1 text-[11px] text-rose-100">
                {c}
              </span>
            ))}
          </div>
        </div>
      </IntelSection>

      <p className="text-center font-mono text-[10px] text-slate-600">
        Confidential · Government custody · {snap.generatedAtIso.slice(0, 10)}
      </p>
    </>
  );

  return shell(inner);
}
