import { cn } from "@/components/enterprise/cn";

const toneMap = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-rose-50 text-rose-800 border-rose-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  syncing: "bg-blue-50 text-blue-800 border-blue-200",
} as const;

export default function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
