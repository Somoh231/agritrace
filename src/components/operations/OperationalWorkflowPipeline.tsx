"use client";

import Link from "next/link";

import { farmerRegistrationPipeline } from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_INVENTORY_MOVEMENTS } from "@/lib/data/ministry-canonical-data";

/**
 * Read-only illustration of how operational artefacts flow through the ministry stack.
 * Queue counts blend pilot demo constants with canonical ledger depth — no auth/RLS impact.
 */
export default function OperationalWorkflowPipeline() {
  const p = farmerRegistrationPipeline;
  const corridorDepth = MINISTRY_INVENTORY_MOVEMENTS.length;

  const stages = [
    {
      label: "Field agent",
      detail: "Capture & GPS",
      queue: p.pendingVerification + p.flagged,
      hint: "Pending + flagged registry touches",
      href: "/field-inspections",
    },
    {
      label: "District officer",
      detail: "QA & DAO packet",
      queue: p.pendingVerification,
      hint: "Verification queue pressure",
      href: "/verification-queue",
    },
    {
      label: "County officer",
      detail: "Consolidate & attest",
      queue: Math.max(2, Math.round(p.pendingVerification / 4)),
      hint: "County attest backlog (illustrative)",
      href: "/county-operations",
    },
    {
      label: "Warehouse",
      detail: "Receipt & issue",
      queue: corridorDepth,
      hint: "Active corridor legs in ministry ledger",
      href: "/inventory/transfers",
    },
    {
      label: "National ops",
      detail: "Reconcile",
      queue: 3,
      hint: "Open reconciliation threads (demo)",
      href: "/inventory",
    },
    {
      label: "Ministerial",
      detail: "Brief & policy",
      queue: 1,
      hint: "Executive briefing cycle",
      href: "/executive-briefing",
    },
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 px-5 py-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Operational workflow</div>
          <h2 className="mt-1 font-display text-[16px] font-semibold text-white">How responsibilities chain across the ministry stack</h2>
          <p className="mt-1 max-w-[880px] text-[11px] leading-relaxed text-slate-500">
            Field capture escalates through district QA and county attestation before warehouse logistics and national reconcile feed ministerial
            reporting. Queue figures are indicative operational pressure, not personnel counts.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-stretch gap-2 lg:flex-nowrap lg:overflow-x-auto lg:pb-1">
        {stages.map((s, i) => (
          <div key={s.label} className="flex min-w-[140px] flex-1 items-stretch gap-2">
            <div className="flex flex-1 flex-col rounded-lg border border-white/[0.08] bg-black/35 px-3 py-2.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{s.detail}</div>
              <div className="mt-0.5 font-display text-[13px] font-semibold text-slate-100">{s.label}</div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[20px] font-semibold tabular-nums text-emerald-400">{s.queue}</span>
                <span className="text-[9px] leading-tight text-slate-600">{s.hint}</span>
              </div>
              <Link href={s.href} className="mt-2 text-[10px] font-medium text-emerald-500/90 hover:text-emerald-400">
                Open workspace →
              </Link>
            </div>
            {i < stages.length - 1 ? (
              <div className="hidden shrink-0 items-center text-slate-600 lg:flex" aria-hidden>
                <span className="font-mono text-[11px]">→</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
