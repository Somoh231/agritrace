import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

const TILE_CLASS =
  "rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700 transition";

export default function MinistryWorkspacePage() {
  return (
    <MinistryPageShell
      title="Ministry workspace"
      description="National operations — aggregation across counties, food security visibility, operational dashboards, audit and export posture, and escalation resolution."
      actions={<SyncStatusIndicator />}
    >
      <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 px-4 py-3 text-[12px] text-slate-300">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky-300/90">Reporting chain</span>
        <p className="mt-1 leading-relaxed">
          CLAN → DAO → CAC → <span className="text-white">Ministry / national intelligence</span> with full audit visibility for authorised ministry and auditor roles.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/command-center" className={TILE_CLASS}>
          <div className="font-semibold text-white">Command center</div>
          <p className="mt-2 text-slate-400">National operational posture.</p>
        </Link>
        <Link href="/national-operations" className={TILE_CLASS}>
          <div className="font-semibold text-white">National operations</div>
          <p className="mt-2 text-slate-400">Cross-programme operational view.</p>
        </Link>
        <Link href="/national-heat-map" className={TILE_CLASS}>
          <div className="font-semibold text-white">National heat map</div>
          <p className="mt-2 text-slate-400">County intelligence and signals.</p>
        </Link>
        <Link href="/food-security" className={TILE_CLASS}>
          <div className="font-semibold text-white">Food security</div>
          <p className="mt-2 text-slate-400">National visibility on food security indicators.</p>
        </Link>
        <Link href="/reports" className={TILE_CLASS}>
          <div className="font-semibold text-white">Reporting & analytics</div>
          <p className="mt-2 text-slate-400">Ministry reporting center and exports.</p>
        </Link>
        <Link href="/compliance/audit-log" className={TILE_CLASS}>
          <div className="font-semibold text-white">Audit log</div>
          <p className="mt-2 text-slate-400">Immutable trail for ministry and auditor oversight.</p>
        </Link>
      </div>
    </MinistryPageShell>
  );
}
