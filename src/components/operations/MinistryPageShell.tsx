import type { ReactNode } from "react";

export default function MinistryPageShell({
  title,
  description,
  kicker,
  actions,
  children,
}: {
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="gov-kicker gov-kicker-gold">{kicker ?? "AgriVault · National Intelligence"}</div>
          <h1 className="mt-2 font-serif-display text-[26px] md:text-[32px] leading-tight text-slate-900">{title}</h1>
          {description ? (
            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed max-w-3xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
