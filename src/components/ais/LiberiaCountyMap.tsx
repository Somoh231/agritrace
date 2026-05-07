"use client";

import * as React from "react";
import Link from "next/link";

import { LIBERIA_COUNTY_PLOTS } from "@/lib/ais/liberia-counties";
import type { CountyProductionRow } from "@/lib/demo/agriculture-pilot-data";

type VizMode = "production" | "risk" | "balanced";

type Props = {
  counties: CountyProductionRow[];
  /** Food risk 0–100 keyed by county name */
  riskByCounty?: Record<string, number>;
  className?: string;
};

function heatForCounty(
  countyName: string,
  rows: CountyProductionRow[],
  risk: Record<string, number> | undefined,
  mode: VizMode,
) {
  const row = rows.find((r) => r.county === countyName);
  const riskScore = risk?.[countyName] ?? (row?.status === "critical" ? 72 : row?.status === "warning" ? 48 : 22);
  const prodNorm = row ? Math.min(1, row.productionMt / Math.max(row.targetMt, 1)) : 0.5;
  const riskNorm = riskScore / 100;
  const lens =
    mode === "production"
      ? { pr: 1, rr: 0.15 }
      : mode === "risk"
        ? { pr: 0.2, rr: 1 }
        : { pr: 0.65, rr: 0.55 };
  const blendNorm = Math.min(1, prodNorm * lens.pr + riskNorm * lens.rr);
  const g = Math.round(36 + blendNorm * 95);
  const r = Math.round(14 + riskNorm * lens.rr * 120 + (1 - prodNorm) * lens.pr * 40);
  const b = Math.round(48 + (1 - blendNorm) * 70);
  return `rgba(${r},${g},${b},0.88)`;
}

function LayerChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide transition ${
        active
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-50"
          : "border-white/10 bg-black/20 text-emerald-100/55 hover:bg-white/[0.06]"
      }`}
    >
      {label}
    </button>
  );
}

export default function LiberiaCountyMap({ counties, riskByCounty, className }: Props) {
  const [hover, setHover] = React.useState<string | null>(null);
  const [viz, setViz] = React.useState<VizMode>("balanced");
  const detail = hover ? counties.find((c) => c.county === hover) : null;

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-emerald-950/40 to-slate-900/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">National GIS · Liberia</div>
            <div className="mt-1 font-display text-[17px] font-semibold text-white">County operational intelligence</div>
            <p className="mt-1 text-[11px] text-emerald-100/65 leading-relaxed max-w-[520px]">
              Layer lenses harmonize production attainment with food-security risk. Mapbox routes activate automatically when{" "}
              <span className="font-mono text-emerald-200/90">NEXT_PUBLIC_MAPBOX_TOKEN</span> is configured.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <LayerChip active={viz === "production"} label="Production" onClick={() => setViz("production")} />
              <LayerChip active={viz === "risk"} label="Food security" onClick={() => setViz("risk")} />
              <LayerChip active={viz === "balanced"} label="Balanced" onClick={() => setViz("balanced")} />
              <Link
                href="/gis-intelligence"
                className="rounded-full border border-white/12 bg-black/25 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide text-emerald-100/75 hover:bg-white/[0.06]"
              >
                GIS intelligence
              </Link>
              <Link
                href="/national-heat-map"
                className="rounded-full border border-white/12 bg-black/25 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide text-emerald-100/55 hover:bg-white/[0.06]"
              >
                Heat panels
              </Link>
            </div>
          </div>
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ? (
            <a
              href="/gis-intelligence"
              className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/20"
            >
              Full-screen GIS
            </a>
          ) : (
            <span className="shrink-0 rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] text-emerald-100/70">
              SVG situational map · Mapbox optional
            </span>
          )}
        </div>

        <svg viewBox="0 0 320 200" className="w-full h-auto select-none" aria-label="Liberia county heat overview">
          <defs>
            <linearGradient id="coast" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0c4a21" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" rx="16" fill="url(#coast)" stroke="rgba(255,255,255,0.08)" />
          {LIBERIA_COUNTY_PLOTS.map((c) => {
            const fill = heatForCounty(c.name, counties, riskByCounty, viz);
            const active = hover === c.name;
            return (
              <g key={c.code}>
                <circle
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill={fill}
                  stroke={active ? "rgba(250,204,21,0.95)" : "rgba(255,255,255,0.12)"}
                  strokeWidth={active ? 2.2 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ filter: active ? "drop-shadow(0 0 12px rgba(250,204,21,0.35))" : undefined }}
                  onMouseEnter={() => setHover(c.name)}
                  onMouseLeave={() => setHover(null)}
                />
                <text
                  x={c.cx}
                  y={c.cy + 3}
                  textAnchor="middle"
                  className="fill-white pointer-events-none font-mono"
                  style={{ fontSize: 7.5, opacity: 0.92 }}
                >
                  {c.code}
                </text>
              </g>
            );
          })}
        </svg>

        {detail ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-[12px] text-emerald-50/95 animate-in fade-in duration-200">
            <div className="font-semibold text-white">{detail.county}</div>
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] text-emerald-100/80">
              <span>Production</span>
              <span className="text-right tabular-nums">{detail.productionMt.toFixed(1)} t</span>
              <span>Target</span>
              <span className="text-right tabular-nums">{detail.targetMt.toFixed(1)} t</span>
              <span>Loss</span>
              <span className="text-right tabular-nums">{detail.lossPct.toFixed(1)}%</span>
              <span>Reporting</span>
              <span className="text-right">{detail.status}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-emerald-100/55 font-mono">Hover a county for production and compliance posture.</div>
        )}
      </div>
    </div>
  );
}
