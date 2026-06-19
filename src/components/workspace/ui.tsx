import type { ReactNode } from "react";
import Link from "next/link";

type Tone = "default" | "alert" | "escalation" | "ok";

function toneDot(tone: Tone): string {
  if (tone === "alert") return "bg-rose-400";
  if (tone === "escalation") return "bg-amber-400";
  if (tone === "ok") return "bg-emerald-400";
  return "bg-[rgb(var(--ministry-gold))]";
}

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
    <section className={`cmd-surface overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--ministry-panel-border))]/50 px-4 py-2.5">
        <div className="min-w-0">
          <div className="cmd-kicker">{title}</div>
          {hint ? <div className="mt-1 text-[11px] text-emerald-100/45">{hint}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

/** A queue/list row — the core operational unit for review and approval surfaces. */
export function QueueRow({
  href,
  title,
  meta,
  tone = "default",
  badge,
}: {
  href: string;
  title: string;
  meta?: string;
  tone?: Tone;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-[rgb(var(--ministry-gold))]/[0.08]"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot(tone)}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-white">{title}</span>
        {meta ? <span className="block truncate text-[11px] text-emerald-100/45">{meta}</span> : null}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-md border border-[rgb(var(--ministry-gold))]/30 bg-[rgb(var(--ministry-gold))]/[0.1] px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--ministry-gold))]">
          {badge}
        </span>
      ) : null}
      <span className="shrink-0 font-mono text-[13px] text-[rgb(var(--ministry-gold))]/70 transition group-hover:translate-x-0.5">
        →
      </span>
    </Link>
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
          : "cmd-surface cmd-surface-hover text-emerald-50"
      }`}
    >
      <div className={`font-serif-display text-[18px] leading-tight ${primary ? "text-white" : "text-white"}`}>
        {title}
      </div>
      <div className={`text-[12px] ${primary ? "text-emerald-50/85" : "text-emerald-100/50"}`}>{subtitle}</div>
    </Link>
  );
}

/** A compact KPI/metric tile that links into a real operational surface. */
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
    <Link href={href} className="group cmd-surface cmd-surface-hover px-3.5 py-3">
      <div className="cmd-kicker">{label}</div>
      <div className="mt-1.5 font-serif-display text-[19px] leading-none text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-emerald-100/45">{hint}</div> : null}
    </Link>
  );
}
