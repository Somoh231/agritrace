import { cn } from "@/components/enterprise/cn";

const lightToneMap = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-rose-50 text-rose-800 border-rose-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  syncing: "bg-blue-50 text-blue-800 border-blue-200",
} as const;

const darkToneMap = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  neutral: "border-white/15 bg-white/5 text-slate-300",
  syncing: "border-blue-500/30 bg-blue-500/10 text-blue-200",
} as const;

const dotToneMap = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-gray-400",
  syncing: "bg-blue-500",
} as const;

export type StatusBadgeTone = keyof typeof lightToneMap;

export default function StatusBadge({
  children,
  tone = "neutral",
  theme = "light",
  dot = false,
  uppercase = false,
  shape = "rounded",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
  /** Surface theme for dark command panels */
  theme?: "light" | "dark";
  dot?: boolean;
  uppercase?: boolean;
  shape?: "rounded" | "pill";
  className?: string;
}) {
  const palette = theme === "dark" ? darkToneMap : lightToneMap;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-medium leading-tight",
        shape === "pill" ? "rounded-full font-mono text-[10px]" : "rounded-md text-[11px]",
        uppercase ? "uppercase tracking-wide" : "",
        palette[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotToneMap[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}
