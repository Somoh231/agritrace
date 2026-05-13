import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

const TILE_CLASS =
  "rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700 transition";

export default function DaoWorkspacePage() {
  return (
    <MinistryPageShell
      title="DAO workspace"
      description="District Agriculture Officers — district oversight, review of CLAN submissions, district summaries, operational verification, and coordination with warehouses and programmes."
      actions={<SyncStatusIndicator />}
    >
      <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-[12px] text-slate-300">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Reporting chain</span>
        <p className="mt-1 leading-relaxed">
          CLAN capture → <span className="text-white">DAO review and consolidation</span> → CAC verification → Ministry intelligence.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/district-dashboard" className={TILE_CLASS}>
          <div className="font-semibold text-white">District command</div>
          <p className="mt-2 text-slate-400">DAO workflows, registry, inspections, and offline queue.</p>
        </Link>
        <Link href="/field-agents" className={TILE_CLASS}>
          <div className="font-semibold text-white">CLAN / field monitoring</div>
          <p className="mt-2 text-slate-400">District view of capture cadence and coverage.</p>
        </Link>
        <Link href="/verification-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">Verification & approvals</div>
          <p className="mt-2 text-slate-400">District-level review before county sign-off.</p>
        </Link>
        <Link href="/field/inspections" className={TILE_CLASS}>
          <div className="font-semibold text-white">Inspection queue</div>
          <p className="mt-2 text-slate-400">District inspection posture and follow-up.</p>
        </Link>
        <Link href="/operations/warehouses" className={TILE_CLASS}>
          <div className="font-semibold text-white">Warehouse coordination</div>
          <p className="mt-2 text-slate-400">Custody and corridor posture in the district.</p>
        </Link>
        <Link href="/reporting/workspace?tab=dao" className={TILE_CLASS}>
          <div className="font-semibold text-white">DAO reporting hub</div>
          <p className="mt-2 text-slate-400">Links to capture surfaces and district summaries.</p>
        </Link>
      </div>
    </MinistryPageShell>
  );
}
