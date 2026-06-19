import type { ReactNode } from "react";

export type ChipTone = "ok" | "warn" | "danger" | "info" | "neutral";

const LIGHT: Record<ChipTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  neutral: "border-gray-200 bg-gray-100 text-gray-600",
};

const DARK: Record<ChipTone, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  neutral: "border-white/15 bg-white/5 text-slate-300",
};

const DOT: Record<ChipTone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-gray-400",
};

/** Consistent status chip for operational tables, theme-aware for dark/light surfaces. */
export default function StatusChip({
  tone = "neutral",
  theme = "light",
  dot = true,
  children,
}: {
  tone?: ChipTone;
  theme?: "light" | "dark";
  dot?: boolean;
  children: ReactNode;
}) {
  const palette = theme === "dark" ? DARK : LIGHT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${palette[tone]}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden /> : null}
      {children}
    </span>
  );
}
