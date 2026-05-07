"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] rounded-xl border border-slate-700 bg-slate-950/60 animate-pulse" aria-hidden />
  ),
});
const FarmPlotMap = dynamic(() => import("@/components/maps/FarmPlotMap"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] rounded-xl border border-slate-700 bg-slate-950/60 animate-pulse" aria-hidden />
  ),
});
const MovementMap = dynamic(() => import("@/components/maps/MovementMap"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] rounded-xl border border-slate-700 bg-slate-950/60 animate-pulse" aria-hidden />
  ),
});

export default function NationalHeatMapPage() {
  const tokenReady = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());

  return (
    <div className="space-y-6 text-slate-100 pb-8">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-emerald-950/35 to-slate-950 px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/75">National command · GIS</div>
        <h1 className="mt-2 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold text-white">National heat map</h1>
        <p className="mt-2 max-w-[840px] text-[13px] leading-relaxed text-emerald-50/85">
          Choropleth production surfaces, plot registrations, and warehouse routes are rendered here for spatial coordination across counties.
          The situational SVG panel on the command center supplements this workspace when Mapbox is offline.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
          <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-emerald-100/85">
            Layers · Production · Warehouses · Movement traces
          </span>
          <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-emerald-100/85">
            {tokenReady ? "Mapbox runtime active" : "Fallback rendering panels"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/gis-intelligence" className="inline-flex text-[12px] font-medium text-amber-200 hover:text-amber-100">
            Advanced GIS workspace →
          </Link>
          <Link href="/command-center" className="inline-flex text-[12px] font-medium text-emerald-300 hover:text-emerald-200">
            ← Command center
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 [&_.rounded-xl]:border-slate-700 [&_.text-gray-900]:text-white [&_.text-gray-500]:text-slate-400 [&_.text-gray-600]:text-slate-400 [&_.bg-white]:bg-slate-900 [&_.border-gray-200]:border-slate-700">
        <CountyHeatmap />
      </div>
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 [&_.rounded-xl]:border-slate-700 [&_.text-gray-900]:text-white [&_.text-gray-500]:text-slate-400 [&_.bg-white]:bg-slate-900 [&_.border-gray-200]:border-slate-700">
        <FarmPlotMap />
      </div>
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 [&_.rounded-xl]:border-slate-700 [&_.text-gray-900]:text-white [&_.text-gray-500]:text-slate-400 [&_.bg-white]:bg-slate-900 [&_.border-gray-200]:border-slate-700">
        <MovementMap />
      </div>
    </div>
  );
}
