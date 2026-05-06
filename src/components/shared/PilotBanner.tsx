import * as React from "react";

import { PILOT_COUNTIES, PILOT_MODE, PILOT_SEASON } from "@/lib/utils/pilot-config";

export default function PilotBanner() {
  if (!PILOT_MODE) return null;

  return (
    <div className="w-full bg-[#ecfdf5] border-b border-emerald-100 px-[18px] py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex items-center gap-2 font-mono text-[10px] text-emerald-900">
        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
        <span className="truncate">
          PILOT · Season {PILOT_SEASON} · {PILOT_COUNTIES.join(", ")} · Ministry-owned AIS layer · sovereign agricultural
          database · rice-first · expandable nationally
        </span>
      </div>
      <div className="shrink-0 font-mono text-[10px] text-emerald-800">Illustrative pilot data where live feeds are pending</div>
    </div>
  );
}

