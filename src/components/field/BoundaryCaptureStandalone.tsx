"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { polygonCentroidLngLat } from "@/lib/gis/operational-boundary-math";
import type { OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";
import { queuePlot } from "@/lib/offline/sync-queue";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function BoundaryCaptureStandalone() {
  const searchParams = useSearchParams();
  const farmerFromUrl = searchParams.get("farmer")?.trim() ?? "";
  const [farmerInput, setFarmerInput] = React.useState(farmerFromUrl);
  React.useEffect(() => {
    setFarmerInput(farmerFromUrl);
  }, [farmerFromUrl]);
  const farmerId = farmerInput.trim();
  const toast = useToast();
  const [boundary, setBoundary] = React.useState<OperationalFarmBoundary | null>(null);
  const [saving, setSaving] = React.useState(false);

  const queueFarmBoundary = async () => {
    if (!farmerId) {
      toast.error("Farmer ID required", "Add the farmer UUID to the address bar: ?farmer=…");
      return;
    }
    if (!boundary) {
      toast.error("No boundary yet", "Capture at least three corner points, close the boundary, then save.");
      return;
    }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const poly = boundary.geometry;
      const centroid = polygonCentroidLngLat(poly);
      const polygonGeojson = {
        type: "Feature",
        properties: {
          source: "operational_farm_boundary_capture",
          captured_at: boundary.capturedAt,
          captured_points: boundary.capturedPoints,
          officer_profile_id: boundary.officerProfileId ?? user?.id ?? null,
        },
        geometry: boundary.geometry,
      } as Record<string, unknown>;
      await queuePlot({
        farmer_id: farmerId,
        commodity: "rice",
        area_hectares: boundary.areaHectares,
        polygon_geojson: polygonGeojson,
        center_latitude: centroid?.lat ?? null,
        center_longitude: centroid?.lng ?? null,
        registered_by: user?.id ?? null,
      } as any);
      toast.success("Queued for sync", "Plot boundary is stored locally until the device is online.");
      setBoundary(null);
    } catch (e) {
      toast.error("Could not queue", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[rgb(var(--ministry-workspace))]">
      {/* Compact field command strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[rgb(var(--ministry-gold))]/15 px-3 py-2.5 md:px-4">
        <div className="min-w-0">
          <div className="cmd-kicker">Field GIS · Boundary capture</div>
          <div className="mt-0.5 font-serif-display text-[16px] leading-none text-white">Capture farm boundary</div>
        </div>
        <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[420px]">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-200/55">Farmer</span>
          <input
            value={farmerInput}
            onChange={(e) => setFarmerInput(e.target.value)}
            placeholder="Paste farmer UUID or use ?farmer="
            className="h-9 w-full min-w-0 rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-panel))]/50 px-3 font-mono text-[11px] text-emerald-50 placeholder:text-emerald-200/35 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
          />
        </label>
        <div className="ml-auto flex items-center gap-3">
          <div className="cmd-surface px-2 py-1">
            <SyncStatusIndicator />
          </div>
          <button
            type="button"
            disabled={saving || !farmerId || !boundary}
            onClick={() => void queueFarmBoundary()}
            className="h-9 rounded-lg bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm ring-1 ring-[rgb(var(--ministry-gold))]/30 hover:bg-emerald-500 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save boundary"}
          </button>
        </div>
        {!farmerId ? (
          <p className="w-full font-mono text-[10px] text-amber-200/80">
            Enter the farmer&apos;s registry id to enable saving — capture still works for testing.
          </p>
        ) : null}
      </div>

      {/* Map-dominant capture surface */}
      <div className="min-h-0 flex-1 px-2 py-2 md:px-3 md:py-3">
        <FarmBoundaryCapture
          disabled={!farmerId}
          readOnly={false}
          value={boundary}
          onChange={setBoundary}
          chromeless
          mapHeight="100%"
        />
      </div>
    </div>
  );
}
