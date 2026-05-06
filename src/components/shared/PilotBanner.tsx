import * as React from "react";

import { PILOT_COUNTIES, PILOT_MODE, PILOT_SEASON } from "@/lib/utils/pilot-config";

export default function PilotBanner() {
  if (!PILOT_MODE) return null;

  return (
    <div className="w-full border-b border-emerald-900/40 bg-emerald-950/35 px-4 py-1.5">
      <div className="max-w-[1600px] mx-auto flex items-center gap-2 font-mono text-[10px] text-emerald-100/85">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden />
        <span className="truncate">
          Active pilot · Season {PILOT_SEASON} · Counties {PILOT_COUNTIES.join(", ")} · national expansion ready
        </span>
      </div>
    </div>
  );
}
