import { cn } from "@/components/enterprise/cn";

export type TimelineItem = {
  id: string;
  title: string;
  meta?: string;
  time: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const dotTone = {
  default: "bg-slate-300",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
} as const;

export default function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 ? (
            <span className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" aria-hidden />
          ) : null}
          <span className={cn("relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotTone[item.tone ?? "default"])} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] font-medium text-ink-900">{item.title}</p>
              <time className="font-mono text-[10px] text-slate-500">{item.time}</time>
            </div>
            {item.meta ? <p className="mt-0.5 text-[12px] text-slate-600">{item.meta}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
