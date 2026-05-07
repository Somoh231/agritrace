"use client";

import * as React from "react";

import { LIBERIA_COUNTY_PLOTS } from "@/lib/ais/liberia-counties";
import type { CountyProductionRow } from "@/lib/demo/agriculture-pilot-data";

type Props = {
  counties: CountyProductionRow[];
  /** Food risk 0–100 keyed by county name */
  riskByCounty?: Record<string, number>;
  className?: string;
};

function heatForCounty(countyName: string, rows: CountyProductionRow[], risk?: Record<string, number>) {
  const row = rows.find((r) => r.county === countyName);
  const riskScore = risk?.[countyName] ?? (row?.status === "critical" ? 72 : row?.status === "warning" ? 48 : 22);
  const prodNorm = row ? Math.min(1, row.productionMt / Math.max(row.targetMt, 1)) : 0.5;
  const g = Math.round(40 + prodNorm * 80);
  const r = Math.round(12 + (riskScore / 100) * 140);
  const b = Math.round(50 + (1 - prodNorm) * 60);
  return `rgba(${r},${g},${b},0.85)`;
}

export default function LiberiaCountyMap({ counties, riskByCounty, className }: Props) {
  const [hover, setHover] = React.useState<string | null>(null);
  const detail = hover ? counties.find((c) => c.county === hover) : null;

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-emerald-950/40 to-slate-900/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Geospatial</div>
            <div className="mt-1 font-display text-[15px] font-semibold text-white">County situational panel</div>
            <p className="mt-1 text-[11px] text-emerald-100/65 leading-relaxed max-w-[280px]">
              Production tint · food-risk overlay · warehouse / DAO density indicators integrate with Mapbox when configured.
            </p>
          </div>
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ? (
            <a
              href="/map"
              className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/20"
            >
              Mapbox workspace
            </a>
          ) : null}
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
            const fill = heatForCounty(c.name, counties, riskByCounty);
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
