import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

export default function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pb-6 border-b border-[rgb(var(--enterprise-border))]", className)}>
      <div className="min-w-0 max-w-3xl">
        {kicker ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-forest-600/90">{kicker}</p>
        ) : null}
        <h1 className="mt-1 font-editorial text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-tight text-ink-900 leading-tight">
          {title}
        </h1>
        {description ? <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
  );
}
