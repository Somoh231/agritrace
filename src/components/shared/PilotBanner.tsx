import * as React from "react";

import { PILOT_COUNTIES, PILOT_MODE, PILOT_SEASON } from "@/lib/utils/pilot-config";

export default function PilotBanner() {
  if (!PILOT_MODE) return null;

  return (
    <div className="w-full bg-green-50 border-b border-green-100 px-[18px] py-[6px] flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-center gap-2 font-mono text-[10px] text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-600 animate-blink" aria-hidden="true" />
        <span className="truncate">
          PILOT ACTIVE · Season {PILOT_SEASON} · {PILOT_COUNTIES.join(", ")} counties · Rice production
        </span>
      </div>
      <div className="shrink-0 font-mono text-[10px] text-green-700">Phase 1 · 90-day trial</div>
    </div>
  );
}

