"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { DashboardPanel, PageHeader, SectionHeader, StatusBadge } from "@/components/enterprise";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => <div className="min-h-[420px] animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});

export default function NationalHeatMapWorkspace() {
  const tokenReady = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="National command · GIS"
        title="National heat map"
        description="Immersive choropleth surfaces for production posture, plot registrations, and warehouse routes — spatial coordination across pilot counties."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/map"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-800 hover:bg-slate-50"
            >
              Operational map
            </Link>
            <Link
              href="/command-center"
              className="inline-flex h-10 items-center rounded-xl bg-forest-800 px-4 text-[13px] font-medium text-white hover:bg-forest-900"
            >
              Command center
            </Link>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(16,24,40,0.08)]">
        <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
          <SectionHeader kicker="Layers" title="Tactical controls" subtitle="Production · warehouses · movement traces" />
          <div className="mt-3 space-y-2 text-[12px] text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-slate-300" /> Yield heatmap
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-slate-300" /> Warehouse network
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300" /> Pest risk index
            </label>
          </div>
          <StatusBadge tone={tokenReady ? "success" : "warning"} className="mt-3">
            {tokenReady ? "Mapbox active" : "Fallback panels"}
          </StatusBadge>
        </div>

        <div className="absolute right-4 top-4 z-10 hidden rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:block">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Legend</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <span className="h-2 w-8 rounded bg-emerald-400" /> High yield
            <span className="h-2 w-8 rounded bg-amber-300" /> Watch
            <span className="h-2 w-8 rounded bg-rose-400" /> Risk
          </div>
        </div>

        <div className="min-h-[min(62vh,560px)] p-2 [&_.rounded-xl]:border-slate-200 [&_.text-gray-900]:text-ink-900 [&_.bg-white]:bg-transparent">
          <CountyHeatmap />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Season phase · Q3 maturity</p>
            <div className="flex gap-1 text-[11px] font-mono text-slate-600">
              {["Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
                <span
                  key={m}
                  className={m === "Sep" ? "rounded bg-forest-800 px-2 py-0.5 text-white" : "px-2 py-0.5"}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel>
          <SectionHeader title="County insights" subtitle="Pilot counties — production variance vs target." />
          <p className="mt-3 text-[13px] text-slate-600 leading-relaxed">
            Select a county on the map to inspect district cadence, warehouse pressure, and verification backlog in the command center.
          </p>
          <Link href="/county-dashboard" className="mt-3 inline-flex text-[13px] font-medium text-forest-700">
            County dashboard →
          </Link>
        </DashboardPanel>
        <DashboardPanel>
          <SectionHeader title="Operational summary" />
          <ul className="mt-3 space-y-2 text-[13px] text-slate-700">
            <li>3 pilot counties active · Nimba, Bong, Lofa</li>
            <li>Choropleth refreshes on reporting sync</li>
            <li>Movement traces from warehouse transfers</li>
          </ul>
        </DashboardPanel>
        <DashboardPanel>
          <SectionHeader title="Inspector" subtitle="Click map features for detail." />
          <p className="mt-3 text-[13px] text-slate-600">
            Full plot and movement layers available in GIS intelligence and operational map workspaces.
          </p>
          <Link href="/gis-intelligence" className="mt-3 inline-flex text-[13px] font-medium text-forest-700">
            GIS intelligence →
          </Link>
        </DashboardPanel>
      </div>
    </div>
  );
}
