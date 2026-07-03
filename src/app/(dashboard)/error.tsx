"use client";

import * as React from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[dashboard] route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10" role="alert" aria-live="assertive">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-forest-600">Operational workspace</p>
        <h1 className="mt-2 font-display text-[20px] font-semibold text-ink-900">This view could not load</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          An unexpected error interrupted this dashboard page. Your session is still active — retry the view or return
          to the command center.
        </p>
        {process.env.NODE_ENV !== "production" && error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-slate-400">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-forest-700 px-4 text-[12px] font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </button>
          <Link
            href="/command-center"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] text-slate-700 hover:bg-slate-50"
          >
            Command center
          </Link>
          <Link
            href="/activity"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] text-slate-700 hover:bg-slate-50"
          >
            Activity log
          </Link>
        </div>
      </div>
    </div>
  );
}
