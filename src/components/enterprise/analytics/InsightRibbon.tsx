import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

export type InsightTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneBorder: Record<InsightTone, string> = {
  neutral: "border-l-slate-400",
  success: "border-l-emerald-600",
  warning: "border-l-amber-500",
  danger: "border-l-rose-600",
  info: "border-l-sky-600",
};

export default function InsightRibbon({
  title,
  children,
  tone = "neutral",
  action,
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: InsightTone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] border-l-[3px]",
        toneBorder[tone],
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-900 tracking-tight">{title}</p>
        {action}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}
