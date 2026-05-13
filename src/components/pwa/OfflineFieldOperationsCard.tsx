"use client";

import Link from "next/link";

import InstallAppButton from "@/components/pwa/InstallAppButton";
import OfflineReadinessPanel from "@/components/pwa/OfflineReadinessPanel";

/**
 * Reporting hub — compact offline install + queue entry points for pilot field teams.
 */
export default function OfflineFieldOperationsCard() {
  return (
    <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/25 to-slate-950/60 p-4 sm:p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/90">Offline field operations</div>
      <h2 className="mt-2 text-base font-semibold text-white sm:text-lg">Install Agrivault Data on this device</h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-300">
        Field reporting, GPS boundary capture, offline drafts, and automatic sync when connectivity returns — built for
        low-connectivity environments.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <InstallAppButton variant="primary" label="Install App" />
        <Link
          href="/field/sync-queue"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-600 bg-slate-900 px-4 text-[14px] font-medium text-slate-100 hover:bg-slate-800"
        >
          View offline queue
        </Link>
        <Link
          href="/field/boundary-capture"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-600 bg-slate-950 px-4 text-[14px] font-medium text-slate-200 hover:bg-slate-900"
        >
          Test GPS
        </Link>
      </div>
      <div className="mt-4">
        <OfflineReadinessPanel />
      </div>
    </div>
  );
}
