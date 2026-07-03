import Link from "next/link";

import { KpiCard } from "@/components/enterprise";

export type RegistryKpiItem = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
};

export function RegistryKpiStrip({ items, className }: { items: RegistryKpiItem[]; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-3 lg:grid-cols-4"}>
      {items.map((item) => {
        const card = (
          <KpiCard
            label={item.label}
            value={item.value}
            hint={item.hint}
            delta={item.delta}
            deltaTone={item.deltaTone}
          />
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="block transition hover:opacity-95">
            {card}
          </Link>
        ) : (
          <div key={item.label}>{card}</div>
        );
      })}
    </div>
  );
}
