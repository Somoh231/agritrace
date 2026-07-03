"use client";

import * as React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] global error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" role="alert" aria-live="assertive">
        <div className="font-display text-[20px] text-gray-900">Something went wrong</div>
        <div className="mt-2 text-[12px] leading-relaxed text-gray-600">
          The page hit an unexpected error. You can retry, or return to the homepage.
        </div>
        {process.env.NODE_ENV !== "production" && error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-gray-400">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-lg bg-forest-700 px-4 text-[12px] text-white hover:bg-forest-800"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Go to homepage
          </Link>
          <Link
            href="/request-demo"
            className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Request demo
          </Link>
        </div>
      </div>
    </div>
  );
}
