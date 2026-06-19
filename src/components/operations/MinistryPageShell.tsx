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
      <header className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between border-b border-[rgb(var(--ministry-gold))]/15 pb-3">
        <div className="min-w-0">
          <div className="cmd-kicker">{kicker ?? "AgriVault · National Intelligence"}</div>
          <h1 className="mt-1.5 font-serif-display text-[22px] md:text-[26px] leading-none text-white">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-[12px] text-emerald-100/55 leading-snug max-w-3xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
