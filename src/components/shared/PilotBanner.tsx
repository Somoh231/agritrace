import * as React from "react";

import { PILOT_COUNTIES, PILOT_MODE, PREVIEW_DATA_LABEL, PREVIEW_DATA_MODE } from "@/lib/utils/pilot-config";

/**
 * Persistent strip at the top of every platform page. While the platform shows
 * illustrative fixtures (PREVIEW_DATA_MODE) it carries the owner-approved
 * preview label, so no figure or record can be mistaken for programme results.
 */
export default function PilotBanner() {
  if (!PILOT_MODE && !PREVIEW_DATA_MODE) return null;

  return (
    <div role="note" data-preview-label className="w-full shrink-0 border-b border-amber-300/70 bg-amber-50 px-4 py-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-snug text-amber-950">
        {PREVIEW_DATA_MODE ? (
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
            {PREVIEW_DATA_LABEL}
          </span>
        ) : null}
        <span className="font-mono text-[10px] text-amber-900/80">
          Liberia pilot · {PILOT_COUNTIES.join(" · ")} · being validated
        </span>
      </div>
    </div>
  );
}
