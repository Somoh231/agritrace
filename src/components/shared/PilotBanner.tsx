"use client";

import * as React from "react";

import { PREVIEW_READ_ONLY_LABEL } from "@/lib/auth/preview-read-only";
import { useReadOnlyPreview } from "@/lib/auth/read-only-context";

import { PILOT_COUNTIES, PILOT_MODE, PREVIEW_DATA_LABEL, PREVIEW_DATA_MODE } from "@/lib/utils/pilot-config";

/**
 * Persistent strip at the top of every platform page. While the platform shows
 * illustrative fixtures (PREVIEW_DATA_MODE) it carries the owner-approved
 * preview label, so no figure or record can be mistaken for programme results.
 */
export default function PilotBanner() {
  const readOnly = useReadOnlyPreview();
  if (!PILOT_MODE && !PREVIEW_DATA_MODE && !readOnly) return null;

  return (
    <div role="note" data-preview-label className="w-full shrink-0 border-b border-amber-300/70 bg-amber-50 px-4 py-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-snug text-amber-950">
        {readOnly ? (
          // The account is read-only: separate from (and in addition to) the data label.
          <span data-readonly-indicator className="inline-flex items-center gap-1.5 rounded-[3px] bg-slate-900 px-2 py-0.5 font-semibold text-white">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            {PREVIEW_READ_ONLY_LABEL}
          </span>
        ) : null}
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
