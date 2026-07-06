"use client";

import Link from "next/link";

import InstallAppButton from "@/components/pwa/InstallAppButton";
import OfflineReadinessPanel from "@/components/pwa/OfflineReadinessPanel";
import { SectionHeader, StatusBadge } from "@/components/enterprise";

/**
 * Reporting hub — compact offline install + queue entry points for pilot field teams.
 */
export default function OfflineFieldOperationsCard() {
  return (
    <div className="space-y-4">
      <SectionHeader
        kicker="Field operations"
        title="Install AgriVault Data on this device"
        subtitle="Field reporting, GPS boundary capture, offline drafts, and automatic sync when connectivity returns — built for low-connectivity environments."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <InstallAppButton variant="primary" label="Install App" />
        <Link href="/field/sync-queue" className="btn-gov-outline inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-[13px]">
          View offline queue
        </Link>
        <Link href="/field/boundary-capture" className="btn-gov-outline inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-[13px]">
          Test GPS
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="ent-label">Device readiness</p>
          <StatusBadge tone="success" dot className="mt-2">
            PWA capable
          </StatusBadge>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="ent-label">Connection</p>
          <StatusBadge tone="info" dot className="mt-2">
            Monitor sync
          </StatusBadge>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="ent-label">Storage</p>
          <StatusBadge tone="neutral" dot className="mt-2">
            IndexedDB
          </StatusBadge>
        </div>
      </div>
      <OfflineReadinessPanel />
    </div>
  );
}
