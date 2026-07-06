import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";

export default function EnterpriseDetailTile({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm", className)}>
      <p className="ent-label">{label}</p>
      <div className="mt-1.5 text-[13px] font-medium leading-snug text-ink-900">{value}</div>
    </div>
  );
}
