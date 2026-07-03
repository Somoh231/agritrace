"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-slate-400">
            An unexpected error occurred. Our team has been notified if error monitoring is enabled.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
