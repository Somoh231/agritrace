"use client";

import * as React from "react";

import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

export default function FieldMobileClient() {
  return (
    <MinistryPageShell
      title="Mobile field workspace"
      description="Optimized checklist flow for extension officers — offline capture, queued uploads, and GPS stubs."
      actions={<SyncStatusIndicator />}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/field/inspections"
          className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700"
        >
          <div className="font-semibold text-white">Inspection visits</div>
          <div className="mt-2 text-slate-400">Log geo-stamped visits against farmer UUIDs.</div>
        </Link>
        <Link
          href="/field/boundary-capture"
          className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700"
        >
          <div className="font-semibold text-white">Capture farm boundary</div>
          <div className="mt-2 text-slate-400">Corner walk, approximate outline, queue for sync when offline.</div>
        </Link>
        <Link
          href="/field/pest-reports"
          className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-5 text-[13px] text-slate-200 hover:border-emerald-700"
        >
          <div className="font-semibold text-white">Pest & disease</div>
          <div className="mt-2 text-slate-400">Structured submissions routed to national analysts.</div>
        </Link>
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-950/40 px-4 py-5 text-[13px] text-slate-400 md:col-span-2">
          <div className="font-semibold text-slate-200">Photo & attachment uploads</div>
          <p className="mt-2 leading-relaxed">
            Attachments pipeline plugs into Supabase Storage buckets — enable bucket policies in dashboard, then bind capture IDs to{" "}
            <span className="font-mono text-emerald-300">farmer_visits</span>.
          </p>
        </div>
      </div>
    </MinistryPageShell>
  );
}
