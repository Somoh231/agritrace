"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Layers, MapPin, Route, Wheat } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  PageHeader,
  QuickActionCard,
  SectionHeader,
} from "@/components/enterprise";
import { RegistryKpiStrip } from "@/components/registry";
import MapLayerLegend, { MapTokenBadge } from "@/components/maps/MapLayerLegend";
import { PILOT_COUNTIES_ACTIVE } from "@/lib/demo/agriculture-pilot-data";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => <div className="min-h-[min(52vh,480px)] animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});
const FarmPlotMap = dynamic(() => import("@/components/maps/FarmPlotMap"), {
  ssr: false,
  loading: () => <div className="min-h-[min(52vh,480px)] animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});
const MovementMap = dynamic(() => import("@/components/maps/MovementMap"), {
  ssr: false,
  loading: () => <div className="min-h-[min(52vh,480px)] animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});

type LayerId = "county" | "plots" | "movement";

const LAYERS: { id: LayerId; label: string; description: string }[] = [
  { id: "county", label: "County yield", description: "Rice production choropleth by county" },
  { id: "plots", label: "Farm plots", description: "Cocoa plot polygons by deforestation status" },
  { id: "movement", label: "Movement routes", description: "Lot corridor traces between locations" },
];

export default function MapOperationalWorkspace() {
  const [activeLayer, setActiveLayer] = React.useState<LayerId>("county");
  const [showCounty, setShowCounty] = React.useState(true);
  const [showPlots, setShowPlots] = React.useState(true);
  const [showMovement, setShowMovement] = React.useState(false);
  const tokenReady = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());

  const layerVisible =
    activeLayer === "county" ? showCounty : activeLayer === "plots" ? showPlots : showMovement;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Operational GIS · National fabric"
        title="Operational map workspace"
        description="Immersive geospatial intelligence for county production posture, registered plot anchors, and corridor movement traces — unified with registry and warehouse reporting."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/national-heat-map" className="btn-gov-outline inline-flex h-10 items-center rounded-lg px-4 text-[12px]">
              National heat map
            </Link>
            <Link href="/county-dashboard" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[12px] font-semibold">
              CAC command
            </Link>
          </div>
        }
      />

      <RegistryKpiStrip
        items={[
          { label: "Pilot counties", value: String(PILOT_COUNTIES_ACTIVE.length), hint: "Active choropleth scope" },
          { label: "Layers", value: "3", hint: "Yield · plots · movement" },
          { label: "Map engine", value: tokenReady ? "Mapbox" : "Fallback", hint: "GIS token posture", deltaTone: tokenReady ? "up" : "down" },
          { label: "Field command", value: "DAO", hint: "District operations hub", href: "/district-dashboard" },
        ]}
      />

      {!tokenReady ? (
        <AlertCard tone="warning" title="Mapbox token not configured">
          County boundaries and plot layers may not render. Set NEXT_PUBLIC_MAPBOX_TOKEN — registry and warehouse feeds remain operational.
        </AlertCard>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <QuickActionCard href="/county-dashboard" icon={MapPin} title="CAC county command" description="County verification queues, DAO oversight, and district performance." />
        <QuickActionCard href="/district-dashboard" icon={Wheat} title="DAO field operations" description="Registrations, inspections, offline queue, and GPS evidence capture." />
        <QuickActionCard href="/gis-intelligence" icon={Layers} title="GIS intelligence" description="Advanced ministry GIS workspace with enriched intelligence layers." />
      </div>

      <DashboardPanel padding="none" className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader kicker="Layers" title="Tactical map controls" subtitle="Select active layer and toggle visibility" />
          <div className="mt-4 flex flex-wrap gap-2">
            {LAYERS.map((layer) => {
              const active = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className={[
                    "inline-flex h-9 items-center rounded-lg border px-3 text-[12px] transition",
                    active ? "border-forest-300 bg-forest-50 font-medium text-forest-900" : "border-slate-200 bg-white text-slate-600 hover:border-forest-200",
                  ].join(" ")}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showCounty} onChange={(e) => setShowCounty(e.target.checked)} className="rounded border-slate-300" />
              County yield heatmap
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showPlots} onChange={(e) => setShowPlots(e.target.checked)} className="rounded border-slate-300" />
              Farm plot polygons
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showMovement} onChange={(e) => setShowMovement(e.target.checked)} className="rounded border-slate-300" />
              Movement routes
            </label>
          </div>
          <MapTokenBadge ready={tokenReady} />
        </div>

        <div className="relative min-h-[min(58vh,520px)] bg-slate-50 p-2">
          <div className="absolute left-4 top-4 z-10 hidden sm:block">
            {activeLayer === "county" ? (
              <MapLayerLegend
                items={[
                  { color: "#eaf7ec", label: "Low yield" },
                  { color: "#5bbf6e", label: "Moderate" },
                  { color: "#2d7a3e", label: "High yield" },
                ]}
              />
            ) : null}
            {activeLayer === "plots" ? (
              <MapLayerLegend
                items={[
                  { color: "#5bbf6e", label: "Clear" },
                  { color: "#ef4444", label: "Flagged" },
                  { color: "#9ca3af", label: "Pending" },
                ]}
              />
            ) : null}
            {activeLayer === "movement" ? (
              <MapLayerLegend items={[{ color: "#1a4422", label: "Lot corridor trace" }]} />
            ) : null}
          </div>

          <div className="absolute right-4 top-4 z-10 max-w-[220px] rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-lg backdrop-blur-sm">
            <Route className="mb-1 h-4 w-4 text-forest-700" aria-hidden />
            {LAYERS.find((l) => l.id === activeLayer)?.description}
          </div>

          {!layerVisible ? (
            <div className="flex min-h-[min(52vh,480px)] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-6 text-center">
              <p className="text-[13px] text-slate-600">Layer hidden — enable the checkbox above to restore the {activeLayer} surface.</p>
            </div>
          ) : (
            <>
              {activeLayer === "county" && showCounty ? <CountyHeatmap embedded heightClass="min-h-[min(52vh,480px)]" /> : null}
              {activeLayer === "plots" && showPlots ? <FarmPlotMap embedded heightClass="min-h-[min(52vh,480px)]" /> : null}
              {activeLayer === "movement" && showMovement ? <MovementMap embedded heightClass="min-h-[min(52vh,480px)]" /> : null}
            </>
          )}
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {showCounty ? (
          <DashboardPanel padding="none" className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <SectionHeader title="County yield layer" subtitle="Stacked reference · click county for drill-down" />
            </div>
            <CountyHeatmap embedded compact heightClass="h-[360px]" />
          </DashboardPanel>
        ) : null}
        {showPlots ? (
          <DashboardPanel padding="none" className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <SectionHeader title="Farm plot layer" subtitle="Deforestation status choropleth" />
            </div>
            <FarmPlotMap embedded compact heightClass="h-[360px]" />
          </DashboardPanel>
        ) : null}
      </div>

      {showMovement ? (
        <DashboardPanel padding="none" className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <SectionHeader title="Movement routes" subtitle="From → to location traces" />
          </div>
          <MovementMap embedded heightClass="h-[360px]" />
        </DashboardPanel>
      ) : null}
    </div>
  );
}
