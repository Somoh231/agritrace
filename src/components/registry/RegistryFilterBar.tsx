"use client";

import { cn } from "@/components/enterprise/cn";

export default function RegistryFilterBar({
  search,
  onSearchChange,
  county,
  onCountyChange,
  counties,
  status,
  onStatusChange,
  statusOptions,
  showStatusFilter = true,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  county: string;
  onCountyChange: (value: string) => void;
  counties: string[];
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  showStatusFilter?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="flex-1 min-w-0">
        <label htmlFor="registry-search" className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Search registry
        </label>
        <input
          id="registry-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name, ID, county, cooperative…"
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-ink-900 placeholder:text-slate-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="registry-county" className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            County
          </label>
          <select
            id="registry-county"
            value={county}
            onChange={(e) => onCountyChange(e.target.value)}
            className="mt-1.5 h-10 min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {showStatusFilter ? (
        <div>
          <label htmlFor="registry-status" className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Status
          </label>
          <select
            id="registry-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="mt-1.5 h-10 min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        ) : null}
      </div>
    </div>
  );
}
