import type { ReactNode } from "react";

export default function MinistryPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-700/50 pb-6">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] md:text-[24px] font-semibold tracking-tight text-white">{title}</h1>
          {description ? (
            <p className="mt-2 text-[13px] text-slate-400 leading-relaxed max-w-3xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
