import { Suspense } from "react";

import GisIntelligenceWorkspace from "@/components/gis/GisIntelligenceWorkspace";

export default function GisIntelligencePage() {
  return (
    <Suspense fallback={<div className="min-h-[480px] animate-pulse rounded-xl bg-slate-950/80" aria-hidden />}>
      <GisIntelligenceWorkspace />
    </Suspense>
  );
}
