import { Suspense } from "react";

import MinistryTransfersWorkspace from "@/components/operations/MinistryTransfersWorkspace";

export default function NationalTransfersPage() {
  return (
    <Suspense
      fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/80 px-6 py-10 text-center text-[13px] text-slate-500">Loading national transfer trace…</div>}
    >
      <MinistryTransfersWorkspace />
    </Suspense>
  );
}
