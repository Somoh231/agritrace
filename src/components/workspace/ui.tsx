import type { ReactNode } from "react";
import Link from "next/link";

/** @deprecated Re-export — use `QueueRow` from `@/components/enterprise`. */
export { default as QueueRow } from "@/components/enterprise/QueueRow";
export type { QueueRowTone } from "@/components/enterprise/QueueRow";

/** A titled operational panel built on the command surface. */
export function Panel({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`gov-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="gov-kicker gov-kicker-gold">{title}</div>
          {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

/** A large, tappable field action — used on the CLAN field workspace. */
export function BigAction({
  href,
  title,
  subtitle,
  primary = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[96px] flex-col justify-between rounded-xl px-4 py-3.5 transition ${
        primary
          ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white ring-1 ring-[rgb(var(--ministry-gold))]/30 hover:from-emerald-500 hover:to-emerald-600 shadow-lg"
          : "gov-card gov-card-hover"
      }`}
    >
      <div className={`font-serif-display text-[18px] leading-tight ${primary ? "text-white" : "text-slate-900"}`}>
        {title}
      </div>
      <div className={`text-[12px] ${primary ? "text-emerald-50/85" : "text-slate-500"}`}>{subtitle}</div>
    </Link>
  );
}

/**
 * @deprecated Use `QuickActionCard` or linked `KpiCard` from `@/components/enterprise` instead.
 * Legacy linked KPI tile with gov-card styling.
 */
export function StatTile({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Link href={href} className="group gov-card gov-card-hover px-4 py-3.5">
      <div className="gov-kicker">{label}</div>
      <div className="mt-2 font-serif-display text-[24px] leading-none text-slate-900">{value}</div>
      {hint ? <div className="mt-1.5 text-[11px] text-slate-500">{hint}</div> : null}
    </Link>
  );
}
