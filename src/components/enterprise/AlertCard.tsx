import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

const toneStyles = {
  info: "border-slate-200 bg-slate-50 text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
} as const;

export default function AlertCard({
  title,
  children,
  tone = "info",
  action,
  className,
}: {
  title?: string;
  children: ReactNode;
  tone?: keyof typeof toneStyles;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone], className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {title ? <p className="text-[13px] font-semibold">{title}</p> : null}
          <div className={cn("text-[13px] leading-relaxed", title ? "mt-1" : "")}>{children}</div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
