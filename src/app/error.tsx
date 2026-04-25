"use client";

import * as React from "react";
import Link from "next/link";

import AlertBanner from "@/components/shared/AlertBanner";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="font-display text-[20px] text-gray-900">Something went wrong</div>
        <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
          The page hit an unexpected error. You can retry, or return to the homepage.
        </div>

        <div className="mt-4">
          <AlertBanner
            severity="warning"
            message={error?.message || "Unexpected application error."}
            actions={[{ label: "Retry", onClick: reset }]}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-10 px-4 rounded-lg bg-forest-700 text-white text-[12px] hover:bg-forest-800"
          >
            Retry
          </button>
          <Link
            href="/"
            className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Go to homepage
          </Link>
          <Link
            href="/login"
            className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Login
          </Link>
        </div>

        {error?.digest ? (
          <div className="mt-4 text-[11px] text-gray-400 font-mono">digest: {error.digest}</div>
        ) : null}
      </div>
    </div>
  );
}

