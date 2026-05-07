import { Suspense } from "react";

import VerificationQueueWorkspace from "@/components/operations/VerificationQueueWorkspace";

export default function VerificationQueuePage() {
  return (
    <Suspense
      fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/80 px-6 py-10 text-center text-[13px] text-slate-500">Loading verification queue…</div>}
    >
      <VerificationQueueWorkspace />
    </Suspense>
  );
}
