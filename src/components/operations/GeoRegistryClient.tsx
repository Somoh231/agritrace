"use client";

import Link from "next/link";

import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "latitude", header: "Lat" },
  { key: "longitude", header: "Lng" },
  { key: "accuracy_m", header: "Accuracy (m)" },
  { key: "captured_at", header: "Captured" },
  { key: "farmer_id", header: "Farmer" },
];

export default function GeoRegistryClient() {
  return (
    <MinistryPageShell
      title="Geo-mapping"
      description="Captured parcel and farm-gate coordinates linked to registry identities — complements full-screen cartography."
      actions={
        <Link
          href="/map"
          className="h-10 px-4 rounded-lg border border-slate-600 bg-slate-900 text-[13px] text-slate-100 hover:bg-slate-800 inline-flex items-center"
        >
          Open national map
        </Link>
      }
    >
      <LiveQueryGrid
        table="geo_locations"
        select="latitude,longitude,accuracy_m,captured_at,farmer_id"
        columns={COLS}
        filename="geo-locations.csv"
        title="Latest geo fixes"
      />
      <p className="mt-6 text-[12px] text-slate-500">
        Heat overlays and county choropleths consume this layer alongside warehouse anchors — configure Mapbox tokens for operational cartography.
      </p>
    </MinistryPageShell>
  );
}
