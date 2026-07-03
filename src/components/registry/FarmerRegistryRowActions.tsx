"use client";

import Link from "next/link";

import type { FarmerRegistryDemoRow } from "@/lib/demo/agriculture-pilot-data";

import { isRegistryUuid } from "@/components/registry/registry-utils";

export default function FarmerRegistryRowActions({
  row,
  onViewProfile,
  onVerify,
}: {
  row: FarmerRegistryDemoRow;
  onViewProfile: (row: FarmerRegistryDemoRow) => void;
  onVerify: (row: FarmerRegistryDemoRow) => void;
}) {
  const canVerify = isRegistryUuid(row.id);

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onViewProfile(row)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
      >
        View
      </button>
      <Link
        href="/verification-queue"
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
      >
        Review
      </Link>
      {canVerify ? (
        <button
          type="button"
          onClick={() => onVerify(row)}
          className="rounded-md border border-forest-200 bg-forest-50 px-2 py-1 text-[11px] font-medium text-forest-800 hover:bg-forest-100"
        >
          {row.verification === "flagged" ? "Flag" : "Verify"}
        </button>
      ) : (
        <Link
          href="/registration-approvals"
          className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
        >
          Flag
        </Link>
      )}
    </div>
  );
}
