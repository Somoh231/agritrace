import { IS_STAGING_BUILD } from "@/lib/env/app-env";

/**
 * Persistent marker for staging/preview builds of the authenticated app.
 * Renders nothing unless NEXT_PUBLIC_APP_ENV is exactly "staging"; production
 * builds cannot carry that value (enforced by the build guard).
 */
export default function StagingIndicator() {
  if (!IS_STAGING_BUILD) return null;
  return (
    <div
      role="note"
      aria-label="Staging environment: synthetic data only"
      data-testid="staging-indicator"
      className="flex h-7 shrink-0 items-center justify-center gap-2 bg-amber-300 px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-950" />
      Staging · Synthetic data
    </div>
  );
}
