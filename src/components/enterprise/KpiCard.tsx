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
      <p className="ent-label">{label}</p>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="ent-metric">{value}</span>
        {delta ? <span className={cn("text-[12px] font-medium tabular-nums", deltaClass)}>{delta}</span> : null}
      </div>
      {hint ? <p className="mt-1.5 text-[12px] text-slate-500 leading-snug">{hint}</p> : null}
    </article>
  );
}
