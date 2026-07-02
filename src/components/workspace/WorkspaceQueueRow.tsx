import Link from "next/link";

import { StatusBadge } from "@/components/enterprise";

export type WorkspaceQueueTone = "default" | "alert" | "escalation" | "ok";

const toneToBadge: Record<WorkspaceQueueTone, "neutral" | "danger" | "warning" | "success"> = {
  default: "neutral",
  alert: "danger",
  escalation: "warning",
  ok: "success",
};

const toneDot: Record<WorkspaceQueueTone, string> = {
  default: "bg-slate-300",
  alert: "bg-rose-500",
  escalation: "bg-amber-500",
  ok: "bg-emerald-500",
};

export function WorkspacePrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
      {children}
    </Link>
  );
}

export default function WorkspaceQueueRow({
  href,
  title,
  meta,
  tone = "default",
  badge,
}: {
  href: string;
  title: string;
  meta?: string;
  tone?: WorkspaceQueueTone;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${toneDot[tone]}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink-900">{title}</span>
        {meta ? <span className="block truncate text-[12px] text-slate-500">{meta}</span> : null}
      </span>
      {badge ? <StatusBadge tone={toneToBadge[tone]}>{badge}</StatusBadge> : null}
      <span className="shrink-0 text-[13px] font-medium text-forest-700 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
