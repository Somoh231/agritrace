"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { AlertCard, DashboardPanel, PageHeader, SectionHeader } from "@/components/enterprise";
import { RegistryKpiStrip } from "@/components/registry";
import MapLayerLegend, { MapTokenBadge } from "@/components/maps/MapLayerLegend";
import { PILOT_COUNTIES_ACTIVE } from "@/lib/demo/agriculture-pilot-data";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => <div className="min-h-[min(62vh,560px)] animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});

export default function NationalHeatMapWorkspace() {
  const tokenReady = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());
  const [showYield, setShowYield] = React.useState(true);
  const [showWarehouse, setShowWarehouse] = React.useState(true);
  const [showPest, setShowPest] = React.useState(false);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="National command · GIS"
        title="National heat map"
        description="Immersive choropleth surfaces for production posture, plot registrations, and warehouse routes — spatial coordination across pilot counties."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/map" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
              Operational map
            </Link>
            <Link href="/command-center" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
              Command center
            </Link>
          </div>
        }
      />

      <RegistryKpiStrip
        items={[
          { label: "Pilot counties", value: String(PILOT_COUNTIES_ACTIVE.length), hint: "Nimba · Bong · Lofa" },
          { label: "Active layer", value: showYield ? "Yield" : "—", hint: "Choropleth posture" },
          { label: "Map engine", value: tokenReady ? "Mapbox" : "Fallback", hint: "GIS token", deltaTone: tokenReady ? "up" : "down" },
          { label: "CAC command", value: "County", hint: "District oversight", href: "/county-dashboard" },
        ]}
      />

      {!tokenReady ? (
        <AlertCard tone="warning" title="Mapbox fallback mode">
          Choropleth may not render without NEXT_PUBLIC_MAPBOX_TOKEN — county dashboards and registry feeds remain operational.
        </AlertCard>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(16,24,40,0.08)]">
        <div className="border-b border-slate-100 px-4 py-4 sm:hidden">
          <SectionHeader kicker="Layers" title="Tactical controls" subtitle="Toggle intelligence overlays" />
          <div className="mt-3 space-y-2 text-[12px] text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showYield} onChange={(e) => setShowYield(e.target.checked)} className="rounded border-slate-300" />
              Yield heatmap
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showWarehouse} onChange={(e) => setShowWarehouse(e.target.checked)} className="rounded border-slate-300" />
              Warehouse network (reference)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showPest} onChange={(e) => setShowPest(e.target.checked)} className="rounded border-slate-300" />
              Pest risk index (reference)
            </label>
          </div>
          <MapTokenBadge ready={tokenReady} />
          <div className="mt-3">
            <MapLayerLegend
              items={[
                { color: "#eaf7ec", label: "Low yield" },
                { color: "#5bbf6e", label: "Moderate" },
                { color: "#2d7a3e", label: "High yield" },
              ]}
            />
          </div>
        </div>

        <div className="absolute left-4 top-4 z-10 hidden max-w-[280px] rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:block">
          <SectionHeader kicker="Layers" title="Tactical controls" subtitle="Toggle intelligence overlays" />
          <div className="mt-3 space-y-2 text-[12px] text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showYield} onChange={(e) => setShowYield(e.target.checked)} className="rounded border-slate-300" />
              Yield heatmap
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showWarehouse} onChange={(e) => setShowWarehouse(e.target.checked)} className="rounded border-slate-300" />
              Warehouse network (reference)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showPest} onChange={(e) => setShowPest(e.target.checked)} className="rounded border-slate-300" />
              Pest risk index (reference)
            </label>
          </div>
          <MapTokenBadge ready={tokenReady} />
        </div>

        <div className="absolute right-4 top-4 z-10 hidden sm:block">
          <MapLayerLegend
            items={[
              { color: "#eaf7ec", label: "Low yield" },
              { color: "#5bbf6e", label: "Moderate" },
              { color: "#2d7a3e", label: "High yield" },
            ]}
          />
        </div>

        <div className="min-h-[min(62vh,560px)] p-2">
          {showYield ? (
            <CountyHeatmap embedded heightClass="min-h-[min(60vh,540px)] h-[min(60vh,540px)]" />
          ) : (
            <div className="flex min-h-[min(60vh,540px)] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <p className="text-[13px] text-slate-600">Yield layer hidden — enable the heatmap checkbox to restore the choropleth.</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Reference overlays · warehouse {showWarehouse ? "on" : "off"} · pest {showPest ? "on" : "off"}
            </p>
            <div className="flex gap-1 text-[11px] font-mono text-slate-600">
              {["Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
                <span key={m} className={m === "Sep" ? "rounded bg-forest-800 px-2 py-0.5 text-white" : "px-2 py-0.5"}>
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
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Select a county on the map to inspect district cadence, warehouse pressure, and verification backlog in the command center.
          </p>
          <Link href="/county-dashboard" className="mt-3 inline-flex text-[13px] font-medium text-forest-700 hover:underline">
            CAC county command →
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
          <Link href="/gis-intelligence" className="mt-3 inline-flex text-[13px] font-medium text-forest-700 hover:underline">
            GIS intelligence →
          </Link>
        </DashboardPanel>
      </div>
    </div>
  );
}
