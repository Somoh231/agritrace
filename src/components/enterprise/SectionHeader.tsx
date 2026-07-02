import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

export default function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {kicker ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{kicker}</p>
        ) : null}
        <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight text-ink-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
