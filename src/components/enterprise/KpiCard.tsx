import { cn } from "@/components/enterprise/cn";
import { enterpriseTokens } from "@/components/enterprise/tokens";

export default function KpiCard({
  label,
  value,
  hint,
  delta,
  deltaTone = "neutral",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  className?: string;
}) {
  const deltaClass =
    deltaTone === "up" ? "text-emerald-700" : deltaTone === "down" ? "text-rose-600" : "text-slate-500";

  return (
    <article
      className={cn(
        enterpriseTokens.radius.md,
        enterpriseTokens.shadow.card,
        enterpriseTokens.card,
        "px-4 py-4 transition hover:shadow-md",
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[1.65rem] font-semibold tabular-nums tracking-tight text-ink-900">{value}</span>
        {delta ? <span className={cn("text-[12px] font-medium tabular-nums", deltaClass)}>{delta}</span> : null}
      </div>
      {hint ? <p className="mt-1.5 text-[12px] text-slate-500 leading-snug">{hint}</p> : null}
    </article>
  );
}
