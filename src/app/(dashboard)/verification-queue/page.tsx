import { Suspense } from "react";

import VerificationQueueWorkspace from "@/components/operations/VerificationQueueWorkspace";

export default function VerificationQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-2">
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      }
    >
      <VerificationQueueWorkspace />
    </Suspense>
  );
}
