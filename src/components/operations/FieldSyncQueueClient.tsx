"use client";

import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

export default function FieldSyncQueueClient() {
  return (
    <MinistryPageShell
      title="Offline sync queue"
      description="Browser-backed offline capture replay for extension teams — inspect queue depth before pushing reconciliations."
      actions={<SyncStatusIndicator />}
    >
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-6 text-[13px] text-slate-300 leading-relaxed space-y-4">
        <p>
          IndexedDB batches reconcile through the service worker bridge. Use the field agents console for device-level diagnostics and
          forced retries.
        </p>
        <Link href="/field-agents" className="inline-flex text-emerald-400 hover:text-emerald-300 font-medium">
          Open field agents console →
        </Link>
      </div>
    </MinistryPageShell>
  );
}
