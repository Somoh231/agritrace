"use client";

import * as React from "react";
import Link from "next/link";

import { governanceFraming } from "@/lib/demo/agriculture-pilot-data";

import { OpsCard, OpsSectionTitle, PilotDatasetNotice } from "@/components/pilot/pilot-ui";

const REPORTS = [
  { title: "Cabinet brief", desc: "Executive summary · rice pilot posture & risks", href: "/rice/reports" },
  { title: "County report pack", desc: "County coordination outputs · verification & inputs", href: "/county-operations" },
  { title: "Donor utilization", desc: "Donor-tagged inventory & distribution attestations", href: "/inventory" },
  { title: "Input distribution report", desc: "Warehouse → farmer fidelity & leakage indicators", href: "/inventory" },
  { title: "Farmer registry export", desc: "CSV / PDF pipelines · role-governed exports", href: "/farmers" },
  { title: "Audit trail export", desc: "Immutable activity extracts · audit-ready", href: "/activity" },
  { title: "Food security snapshot", desc: "Demand/supply & loss intelligence summary", href: "/food-security" },
];

export default function ReportsCenterClient() {
  return (
    <div className="space-y-5">
      <OpsSectionTitle
        kicker="Reporting"
        title="Ministry & donor reporting center"
        subtitle="Audit-ready, role-governed exports · sovereign database framing with national portability."
      />
      <PilotDatasetNotice />

      <OpsCard className="border-emerald-100 bg-emerald-50/25">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">{governanceFraming.headline}</div>
        <ul className="mt-2 grid gap-1 text-[12px] text-slate-800 sm:grid-cols-2">
          {governanceFraming.bullets.map((b) => (
            <li key={b}>· {b}</li>
          ))}
        </ul>
      </OpsCard>

      <div className="grid gap-3 md:grid-cols-2">
        {REPORTS.map((r) => (
          <OpsCard key={r.title} dense>
            <div className="font-display text-[15px] font-semibold text-slate-900">{r.title}</div>
            <p className="mt-2 text-[12px] text-slate-600">{r.desc}</p>
            <Link href={r.href} className="mt-3 inline-block text-[12px] font-semibold text-[#14532d] underline-offset-2 hover:underline">
              Open workspace →
            </Link>
          </OpsCard>
        ))}
      </div>

      <OpsCard dense>
        <div className="text-[12px] font-semibold text-slate-900">Scheduled ministry publications (placeholder)</div>
        <p className="mt-2 text-[11px] text-slate-600">
          Configure weekly county packs and monthly donor statements once export pipelines are approved.
        </p>
      </OpsCard>
    </div>
  );
}
