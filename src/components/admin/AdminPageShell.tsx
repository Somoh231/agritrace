import type { ReactNode } from "react";

/** Shared card surface for the admin console — one consistent style everywhere. */
export const ADMIN_CARD = "rounded-xl border border-gray-200 bg-white shadow-sm";

/**
 * Consistent admin console page frame: a full-width light canvas, a single
 * standardized header (kicker / title / description / actions), and even spacing.
 * Replaces the ad-hoc white "header cards" + narrow max-width wrappers that made
 * admin pages float as small cards inside the dark dashboard shell.
 */
export default function AdminPageShell({
  kicker = "Administration",
  title,
  description,
  actions,
  children,
}: {
  kicker?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full space-y-5">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">{kicker}</div>
          ) : null}
          <h1 className="mt-1.5 font-display text-[22px] leading-tight text-gray-900">{title}</h1>
          {description ? <p className="mt-1.5 max-w-3xl text-[13px] text-gray-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
