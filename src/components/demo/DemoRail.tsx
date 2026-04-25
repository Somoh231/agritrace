"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

type DemoStep = {
  id: string;
  title: string;
  hints: string[];
  nextHref?: string;
  nextLabel?: string;
};

const STEPS_BY_PATH: Record<string, DemoStep> = {
  "/rice": {
    id: "rice",
    title: "Rice production visibility",
    hints: [
      "Start with top KPIs: production vs demand and loss signals.",
      "Point to county chart: show where interventions should focus.",
      "Use the map view for geographic credibility (optional).",
    ],
    nextHref: "/cocoa/lots?present=1&demo=1&step=cocoa",
    nextLabel: "Next: Cocoa lot tracking",
  },
  "/cocoa/lots": {
    id: "cocoa",
    title: "Cocoa lot tracking",
    hints: [
      "Open a lot and highlight chain-of-custody readiness fields.",
      "Emphasize export approval gating and audit trail evidence.",
      "Move to the movement ledger to show reconciliation.",
    ],
    nextHref: "/cocoa/discrepancies?present=1&demo=1&step=discrepancy",
    nextLabel: "Next: Discrepancy resolution",
  },
  "/cocoa/discrepancies": {
    id: "discrepancy",
    title: "Discrepancy resolution",
    hints: [
      "Show variance alerts and assign an owner (accountability).",
      "Add notes and mark resolved (audit trail stays intact).",
      "Mention supervisor review for high variance approvals.",
    ],
    nextHref: "/cocoa/eudr?present=1&demo=1&step=compliance",
    nextLabel: "Next: Export compliance report",
  },
  "/cocoa/eudr": {
    id: "compliance",
    title: "Export compliance report",
    hints: [
      "Explain checklist logic: IDs, GPS, deforestation checks, custody.",
      "Generate a DDS-style PDF output for partners.",
      "Close with pilot readiness and launch checklist.",
    ],
    nextHref: "/cocoa/pilot-readiness?present=1",
    nextLabel: "Next: Pilot readiness",
  },
};

export default function DemoRail() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const demo = search.get("demo") === "1";
  const [dismissed, setDismissed] = React.useState(false);

  const step = STEPS_BY_PATH[pathname];
  if (!demo || dismissed || !step) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[60] w-[360px] max-w-[calc(100vw-32px)]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Guided demo
            </div>
            <div className="mt-1 font-display text-[16px] text-gray-900">{step.title}</div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 rounded-md border border-gray-200 bg-white grid place-items-center text-gray-600 hover:bg-gray-50"
            aria-label="Dismiss demo rail"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          <div className="text-[11px] text-gray-500">What to say (30–60 seconds)</div>
          <ul className="text-[12px] text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
            {step.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const next = new URL(window.location.href);
              next.searchParams.delete("demo");
              next.searchParams.delete("step");
              router.push(next.pathname + next.search);
            }}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Exit demo mode
          </button>

          {step.nextHref ? (
            <button
              type="button"
              onClick={() => router.push(step.nextHref!)}
              className="h-9 px-3 rounded-md bg-forest-800 text-white text-[12px] hover:bg-forest-900 inline-flex items-center gap-2"
            >
              {step.nextLabel ?? "Next"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

