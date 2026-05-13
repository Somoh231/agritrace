import { Suspense } from "react";
import dynamic from "next/dynamic";

const BoundaryCaptureStandalone = dynamic(() => import("@/components/field/BoundaryCaptureStandalone"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-slate-400">Loading…</div>,
});

export default function BoundaryCapturePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <BoundaryCaptureStandalone />
    </Suspense>
  );
}
