import { StatusBadge } from "@/components/enterprise";

export type LegendItem = {
  color: string;
  label: string;
};

export default function MapLayerLegend({
  title = "Legend",
  items,
  className = "",
}: {
  title?: string;
  items: LegendItem[];
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[11px] text-slate-700">
            <span className="h-2.5 w-6 shrink-0 rounded" style={{ backgroundColor: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MapTokenBadge({ ready }: { ready: boolean }) {
  return (
    <StatusBadge tone={ready ? "success" : "warning"} className="mt-2">
      {ready ? "Mapbox active" : "Token missing — fallback panels"}
    </StatusBadge>
  );
}
