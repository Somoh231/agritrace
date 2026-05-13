"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
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
    <MinistryPageShell
      title="Capture farm boundary"
      description="Walk corners, capture points, save — works offline; syncs when connectivity returns."
      actions={<SyncStatusIndicator />}
    >
      <div className="space-y-4 text-[13px] text-slate-300">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <label className="block text-slate-400">
            Farmer UUID (from registry)
            <input
              value={farmerInput}
              onChange={(e) => setFarmerInput(e.target.value)}
              placeholder="Paste farmer UUID (or use ?farmer= in the link)"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none focus:border-emerald-600"
            />
          </label>
          {!farmerId ? (
            <p className="mt-2 text-[12px] text-amber-200/90">
              Enter the farmer&apos;s registry id above, or open this page with <span className="font-mono text-white">?farmer=</span> in the URL.
            </p>
          ) : null}
        </div>

        <FarmBoundaryCapture disabled={!farmerId} readOnly={false} value={boundary} onChange={setBoundary} />

        <button
          type="button"
          disabled={saving || !farmerId || !boundary}
          onClick={() => void queueFarmBoundary()}
          className="min-h-[48px] w-full rounded-xl bg-emerald-700 px-4 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save to farm record (queue)"}
        </button>
      </div>
    </MinistryPageShell>
  );
}
