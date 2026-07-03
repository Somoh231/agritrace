import { Suspense } from "react";

import MinistryTransfersWorkspace from "@/components/operations/MinistryTransfersWorkspace";

export default function NationalTransfersPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-ink-900">Loading national transfer trace…</p>
        </div>
      }
    >
      <MinistryTransfersWorkspace />
    </Suspense>
  );
}
