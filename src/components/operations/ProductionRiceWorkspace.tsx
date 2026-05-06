"use client";

import dynamic from "next/dynamic";

import MinistryPageShell from "@/components/operations/MinistryPageShell";

const ProductionRecordsTable = dynamic(() => import("@/components/rice/ProductionRecordsTable"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] rounded-xl border border-slate-700 bg-slate-900/40 animate-pulse" />
  ),
});

export default function ProductionRiceWorkspace() {
  return (
    <MinistryPageShell
      title="Rice production"
      description="Season-scoped production ledger with loss attribution — writes route through existing ministry validations."
      actions={
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("agritrace-primary-action"));
          }}
          className="h-10 px-4 rounded-lg border border-slate-600 bg-slate-900 text-[13px] text-slate-200 hover:bg-slate-800"
        >
          Quick capture
        </button>
      }
    >
      <div className="rounded-xl border border-slate-700/80 bg-white overflow-hidden">
        <ProductionRecordsTable />
      </div>
    </MinistryPageShell>
  );
}
