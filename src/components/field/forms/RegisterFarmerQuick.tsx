"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import CountySelect from "@/components/shared/CountySelect";
import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { polygonCentroidLngLat } from "@/lib/gis/operational-boundary-math";
import type { OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PILOT_COUNTIES } from "@/lib/utils/pilot-config";
import { PILOT_MODE } from "@/lib/utils/pilot-config";
import { processSyncQueue, queueFarmer, queuePlot } from "@/lib/offline/sync-queue";

export default function RegisterFarmerQuick({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [fullName, setFullName] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [county, setCounty] = React.useState<string>(PILOT_COUNTIES[0] ?? "Nimba");
  const [village, setVillage] = React.useState("");
  const [gps, setGps] = React.useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Rice pilot fields
  const [plotSizeHa, setPlotSizeHa] = React.useState<string>("");
  const [landTenure, setLandTenure] = React.useState<"owned" | "leased" | "communal" | "family">("family");
  const [waterSource, setWaterSource] = React.useState<"rain_fed" | "irrigated" | "both">("rain_fed");
  const [yearsFarmingPlot, setYearsFarmingPlot] = React.useState<string>("");
  const [priorProgrammes, setPriorProgrammes] = React.useState<"yes" | "no">("no");
  const [operationalBoundary, setOperationalBoundary] = React.useState<OperationalFarmBoundary | null>(null);

  const capture = () => {
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (e) => setErr(e.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-gray-200 bg-white p-4">
      {err ? <AlertBanner severity="danger" message={err} /> : null}
      <div className="space-y-3 mt-2">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
        />
        <input
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          placeholder="National ID (LBR-XXXXXXXX)"
          className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (+231…)"
          className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <CountySelect
            value={county}
            onChange={setCounty}
            allCounties={false}
            allowAllOption={false}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
          />
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village"
            className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
          />
        </div>

        {PILOT_MODE ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={plotSizeHa}
                onChange={(e) => setPlotSizeHa(e.target.value)}
                inputMode="decimal"
                placeholder="Plot size (ha)"
                className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
              />
              <select
                value={landTenure}
                onChange={(e) => setLandTenure(e.target.value as any)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
              >
                <option value="owned">Owned</option>
                <option value="leased">Leased</option>
                <option value="communal">Communal</option>
                <option value="family">Family</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value as any)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
              >
                <option value="rain_fed">Rain-fed</option>
                <option value="irrigated">Irrigated</option>
                <option value="both">Both</option>
              </select>
              <input
                value={yearsFarmingPlot}
                onChange={(e) => setYearsFarmingPlot(e.target.value)}
                inputMode="numeric"
                placeholder="Years farming plot"
                className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
              />
            </div>
            <select
              value={priorProgrammes}
              onChange={(e) => setPriorProgrammes(e.target.value as any)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
            >
              <option value="no">Previous govt programmes: No</option>
              <option value="yes">Previous govt programmes: Yes</option>
            </select>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-2">
              <FarmBoundaryCapture
                disabled={busy}
                readOnly={false}
                value={operationalBoundary}
                onChange={setOperationalBoundary}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={capture}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white text-[14px] text-gray-800"
        >
          {gps ? `GPS: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Get My Location"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setErr(null);
            setBusy(true);
            try {
              if (!fullName.trim()) throw new Error("Full name is required.");
              if (!nationalId.trim()) throw new Error("National ID is required.");
              // Offline-first: queue record locally, sync in background.
              const supabase = getSupabaseBrowserClient();
              const { data: me } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any));

              const farmerClientId = await queueFarmer({
                full_name: fullName.trim(),
                national_id: nationalId.trim(),
                phone: phone.trim() || null,
                county,
                village: village.trim() || null,
                latitude: gps?.lat ?? null,
                longitude: gps?.lng ?? null,
                registered_by: me.user?.id ?? null,
              } as any);

              if (PILOT_MODE) {
                const areaManual = plotSizeHa.trim() ? Number(plotSizeHa) : null;
                const years = yearsFarmingPlot.trim() ? Number(yearsFarmingPlot) : null;
                const poly = operationalBoundary?.geometry ?? null;
                const centroid = poly ? polygonCentroidLngLat(poly) : null;
                const polygonGeojson = operationalBoundary
                  ? ({
                      type: "Feature",
                      properties: {
                        source: "operational_farm_boundary_capture",
                        captured_at: operationalBoundary.capturedAt,
                        captured_points: operationalBoundary.capturedPoints,
                      },
                      geometry: operationalBoundary.geometry,
                    } as Record<string, unknown>)
                  : null;
                const areaHa =
                  operationalBoundary != null
                    ? operationalBoundary.areaHectares
                    : areaManual != null && Number.isFinite(areaManual)
                      ? areaManual
                      : null;
                await queuePlot({
                  farmer_id: farmerClientId,
                  commodity: "rice",
                  area_hectares: areaHa,
                  polygon_geojson: polygonGeojson,
                  center_latitude: centroid?.lat ?? gps?.lat ?? null,
                  center_longitude: centroid?.lng ?? gps?.lng ?? null,
                  land_tenure: landTenure,
                  water_source: waterSource,
                  years_farming_plot: years != null && Number.isFinite(years) ? Math.trunc(years) : null,
                  participated_programmes: priorProgrammes === "yes",
                  county,
                  village: village.trim() || null,
                  registered_by: me.user?.id ?? null,
                } as any);
              }

              toast.success("Farmer saved", "Will sync automatically");
              if (navigator.onLine) void processSyncQueue();
              onDone();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Failed to register farmer.";
              setErr(msg);
              toast.error("Couldn’t save farmer", msg);
            } finally {
              setBusy(false);
            }
          }}
          className="h-12 w-full rounded-xl bg-forest-700 text-white text-[14px] font-medium disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

