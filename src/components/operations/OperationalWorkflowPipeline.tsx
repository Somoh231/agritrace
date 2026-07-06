"use client";

import Link from "next/link";

import { DashboardPanel, DataSourceNotice, SectionHeader, StatusBadge } from "@/components/enterprise";
import { farmerRegistrationPipeline } from "@/lib/demo/agriculture-pilot-data";
import { MINISTRY_INVENTORY_MOVEMENTS } from "@/lib/data/ministry-canonical-data";
import { demoSource, pilotSource, resolveDisplaySource } from "@/lib/data/data-source";

/**
 * Read-only illustration of how operational artefacts flow through the ministry stack.
 * Queue counts blend pilot demo constants with canonical ledger depth — no auth/RLS impact.
 */
export default function OperationalWorkflowPipeline() {
  const p = farmerRegistrationPipeline;
  const corridorDepth = MINISTRY_INVENTORY_MOVEMENTS.length;
  const pipelineSource = resolveDisplaySource([
    demoSource("farmerRegistrationPipeline queue counts"),
    pilotSource("MINISTRY_INVENTORY_MOVEMENTS corridor depth"),
  ]);

  const stages = [
    {
      label: "CLAN field capture",
      detail: "Clan Agriculture Crops Technician",
      queue: p.pendingVerification + p.flagged,
      hint: "Pending + flagged registry touches",
      href: "/field/mobile",
      tone: "info" as const,
    },
    {
      label: "DAO district review",
      detail: "District Agriculture Officer",
      queue: p.pendingVerification,
      hint: "Verification queue pressure",
      href: "/verification-queue",
      tone: "warning" as const,
    },
    {
      label: "CAC county verification",
      detail: "County Agriculture Coordinator",
      queue: Math.max(2, Math.round(p.pendingVerification / 4)),
      hint: "County attest backlog (illustrative)",
      href: "/county-dashboard",
      tone: "info" as const,
    },
    {
      label: "Warehouse receipt & issue",
      detail: "Chain of custody",
      queue: corridorDepth,
      hint: "Active corridor legs in ministry ledger",
      href: "/transfers",
      tone: "neutral" as const,
    },
    {
      label: "Ministry / national",
      detail: "Reconcile & brief",
      queue: 4,
      hint: "National reconcile + executive briefing (demo)",
      href: "/command-center",
      tone: "success" as const,
    },
  ] as const;

  return (
    <DashboardPanel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          kicker="Operational workflow"
          title="Ministry responsibility chain"
          subtitle="Field capture escalates through DAO district review and CAC county verification before warehouse logistics and national reconcile feed ministerial reporting."
        />
        <DataSourceNotice source={pipelineSource} />
      </div>
      <div className="mt-5 flex flex-wrap items-stretch gap-3 lg:flex-nowrap lg:overflow-x-auto lg:pb-1">
        {stages.map((s, i) => (
          <div key={s.label} className="flex min-w-[160px] flex-1 items-stretch gap-2">
            <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-forest-200 hover:shadow-md">
              <p className="ent-label">{s.detail}</p>
              <p className="mt-1 text-[14px] font-semibold text-ink-900 leading-snug">{s.label}</p>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-semibold tabular-nums text-forest-800">{s.queue}</span>
                {s.queue > 0 ?
                  <StatusBadge tone={s.tone} className="shrink-0">
                    Active
                  </StatusBadge>
                : <span className="text-[11px] text-slate-400">Clear</span>}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{s.hint}</p>
              <Link href={s.href} className="mt-3 text-[12px] font-medium text-forest-700 hover:text-forest-800">
                Open workspace →
              </Link>
            </div>
            {i < stages.length - 1 ?
              <div className="hidden shrink-0 items-center text-slate-300 lg:flex" aria-hidden>
                <span className="font-mono text-[14px]">→</span>
              </div>
            : null}
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
