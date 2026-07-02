import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/components/enterprise/cn";
import { enterpriseTokens } from "@/components/enterprise/tokens";

export default function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: {
  href?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="mt-4 min-w-0">
        <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{description}</p>
      </div>
    </>
  );

  const base = cn(
    enterpriseTokens.radius.lg,
    enterpriseTokens.shadow.card,
    enterpriseTokens.card,
    "block p-5 min-h-[140px] transition hover:border-forest-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(base, "text-left w-full")}>
      {inner}
    </button>
  );
}
