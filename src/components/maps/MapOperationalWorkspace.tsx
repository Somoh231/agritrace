"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import {
  AlertCard,
  DashboardPanel,
  PageHeader,
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

      <div className="relative -mx-4 md:-mx-6">
        <DashboardPanel padding="none" className="overflow-hidden rounded-none border-x-0 md:rounded-2xl md:border-x">
          <div className="relative min-h-[min(72vh,640px)] bg-slate-100">
            <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
              <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
                <p className="ent-label mb-2">Active layer</p>
                <div className="flex flex-wrap gap-1.5">
                  {LAYERS.map((layer) => {
                    const active = activeLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => setActiveLayer(layer.id)}
                        className={[
                          "inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] transition",
                          active ? "border-forest-300 bg-forest-50 font-medium text-forest-900" : "border-slate-200 bg-white text-slate-600 hover:border-forest-200",
                        ].join(" ")}
                      >
                        {layer.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="hidden sm:block rounded-xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-sm">
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
            </div>

            <div className="absolute right-4 top-4 z-20 w-[min(100%,240px)] rounded-xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-lg backdrop-blur-sm">
              <SectionHeader kicker="GIS" title="Layer filters" subtitle={LAYERS.find((l) => l.id === activeLayer)?.description} />
              <div className="mt-3 space-y-2 text-[12px] text-slate-700">
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

            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2 sm:right-auto">
              <div className="rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] text-slate-700 shadow backdrop-blur-sm">
                <span className="font-mono font-semibold text-forest-800">{PILOT_COUNTIES_ACTIVE.length}</span> pilot counties
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] text-slate-700 shadow backdrop-blur-sm">
                Engine · <span className="font-medium">{tokenReady ? "Mapbox LIVE" : "Fallback"}</span>
              </div>
            </div>

            <div className="absolute inset-0 p-1">
              {!layerVisible ? (
                <div className="flex h-full min-h-[min(68vh,600px)] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-6 text-center">
                  <p className="text-[13px] text-slate-600">Layer hidden — enable the checkbox above to restore the {activeLayer} surface.</p>
                </div>
              ) : (
                <>
                  {activeLayer === "county" && showCounty ? <CountyHeatmap embedded heightClass="h-[min(68vh,600px)]" /> : null}
                  {activeLayer === "plots" && showPlots ? <FarmPlotMap embedded heightClass="h-[min(68vh,600px)]" /> : null}
                  {activeLayer === "movement" && showMovement ? <MovementMap embedded heightClass="h-[min(68vh,600px)]" /> : null}
                </>
              )}
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
