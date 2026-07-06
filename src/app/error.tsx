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
    <div className="enterprise-canvas min-h-screen px-4 py-10">
      <div className="enterprise-card mx-auto max-w-xl p-6" role="alert" aria-live="assertive">
        <h1 className="ent-section-title text-[20px]">Something went wrong</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          The page hit an unexpected error. You can retry, or return to the homepage.
        </p>
        {process.env.NODE_ENV !== "production" && error.digest ?
          <p className="mt-3 font-mono text-[11px] text-slate-500">Reference: {error.digest}</p>
        : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="btn-emerald h-10 rounded-lg px-4 text-[13px]">
            Retry
          </button>
          <Link href="/" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[13px]">
            Go to homepage
          </Link>
          <Link href="/request-demo" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[13px]">
            Request demo
          </Link>
        </div>
      </div>
    </div>
  );
}
