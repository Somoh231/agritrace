import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

const TILE_CLASS =
  "rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700 transition";

export default function ClanWorkspacePage() {
  return (
    <MinistryPageShell
      title="CLAN workspace"
      description="Clan Agriculture Crops Technicians — field capture, farm registration, GPS boundaries, observations, and offline-first reporting. Submissions flow to the DAO for district review."
      actions={<SyncStatusIndicator />}
    >
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-[12px] text-slate-300">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/90">Reporting chain</span>
        <p className="mt-1 leading-relaxed">
          CLAN field capture → DAO review and consolidation → CAC county verification → Ministry national aggregation.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/field/mobile" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field activity & checklists</div>
          <p className="mt-2 text-slate-400">Mobile-first capture with offline queue.</p>
        </Link>
        <Link href="/field" className={TILE_CLASS}>
          <div className="font-semibold text-white">Field home</div>
          <p className="mt-2 text-slate-400">Farm registration and pilot field tools.</p>
        </Link>
        <Link href="/field/boundary-capture" className={TILE_CLASS}>
          <div className="font-semibold text-white">GPS boundary capture</div>
          <p className="mt-2 text-slate-400">Walk corners, approximate farm outline, queue when offline.</p>
        </Link>
        <Link href="/field/inspections" className={TILE_CLASS}>
          <div className="font-semibold text-white">Inspection visits</div>
          <p className="mt-2 text-slate-400">Geo-stamped visits and outcomes.</p>
        </Link>
        <Link href="/field/pest-reports" className={TILE_CLASS}>
          <div className="font-semibold text-white">Pest & disease</div>
          <p className="mt-2 text-slate-400">Structured field alerts.</p>
        </Link>
        <Link href="/field/sync-queue" className={TILE_CLASS}>
          <div className="font-semibold text-white">Offline queue</div>
          <p className="mt-2 text-slate-400">Pending sync and reconciliation.</p>
        </Link>
      </div>
    </MinistryPageShell>
  );
}
