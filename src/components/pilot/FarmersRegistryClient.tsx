"use client";

import * as React from "react";

import {
  farmerRegistrationPipeline,
  farmerRegistrySample,
  type FarmerRegistryDemoRow,
} from "@/lib/demo/agriculture-pilot-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { OpsCard, OpsMetric, OpsSectionTitle, OpsStatusBadge, PilotDatasetNotice } from "@/components/pilot/pilot-ui";

export default function FarmersRegistryClient() {
  const [rows, setRows] = React.useState<FarmerRegistryDemoRow[]>(farmerRegistrySample);
  const [usingDemo, setUsingDemo] = React.useState(true);
  const [county, setCounty] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [crop, setCrop] = React.useState("");
  const [verification, setVerification] = React.useState<"" | "verified" | "pending" | "flagged">("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("farmers")
          .select("id,full_name,county,village,latitude,longitude,created_at")
          .limit(80);
        if (cancelled || error || !data?.length) return;
        const mapped: FarmerRegistryDemoRow[] = (data as any[]).map((r, i) => ({
          id: String(r.id ?? `row-${i}`).slice(0, 12),
          fullName: String(r.full_name ?? "Farmer"),
          county: String(r.county ?? "—"),
          district: String(r.village ?? "—"),
          cooperative: "Cooperative TBD",
          gpsStatus: r.latitude != null && r.longitude != null ? "verified" : "pending",
          acreage: 2,
          mainCrop: "Rice",
          productionHistorySeasons: 2,
          subsidyEligible: true,
          verification: "verified",
          lastFieldVisit: String(r.created_at ?? "").slice(0, 10) || "—",
        }));
        setRows(mapped);
        setUsingDemo(false);
      } catch {
        /* calm demo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (county && !r.county.toLowerCase().includes(county.toLowerCase())) return false;
    if (district && !r.district.toLowerCase().includes(district.toLowerCase())) return false;
    if (crop && !r.mainCrop.toLowerCase().includes(crop.toLowerCase())) return false;
    if (verification && r.verification !== verification) return false;
    return true;
  });

  const p = farmerRegistrationPipeline;

  return (
    <div className="space-y-5">
      <OpsSectionTitle
        kicker="National registry"
        title="Farmer registry · Liberia AIS pilot"
        subtitle="Search and verify farmer participation · GIS readiness and subsidy eligibility tracked alongside field visits."
      />
      {usingDemo ? <PilotDatasetNotice /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OpsMetric label="Verified (illustr.)" value={Intl.NumberFormat().format(p.verified)} tone="forest" />
        <OpsMetric label="Pending verification" value={Intl.NumberFormat().format(p.pendingVerification)} tone="amber" />
        <OpsMetric label="Geo-tag completion" value={`${p.geoTaggedPct}%`} tone="navy" />
        <OpsMetric label="Flagged" value={Intl.NumberFormat().format(p.flagged)} tone="rose" />
      </div>

      <OpsCard>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[11px] font-medium text-slate-700">
            County
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="mt-1 block h-9 w-[140px] rounded-lg border border-slate-200 px-2 text-[12px]"
              placeholder="Filter"
            />
          </label>
          <label className="text-[11px] font-medium text-slate-700">
            District
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 block h-9 w-[140px] rounded-lg border border-slate-200 px-2 text-[12px]"
              placeholder="Filter"
            />
          </label>
          <label className="text-[11px] font-medium text-slate-700">
            Crop
            <input
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="mt-1 block h-9 w-[120px] rounded-lg border border-slate-200 px-2 text-[12px]"
              placeholder="Rice"
            />
          </label>
          <label className="text-[11px] font-medium text-slate-700">
            Verification
            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value as typeof verification)}
              className="mt-1 block h-9 w-[160px] rounded-lg border border-slate-200 px-2 text-[12px]"
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
          </label>
          <button
            type="button"
            className="h-9 rounded-lg bg-[#14532d] px-4 text-[12px] font-medium text-white hover:bg-[#0f2918]"
          >
            Register farmer (placeholder)
          </button>
        </div>
      </OpsCard>

      <OpsCard>
        <div className="mb-3 font-display text-[15px] font-semibold text-slate-900">Verification queue preview</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-2">Farmer</th>
                <th className="py-2 pr-2">County</th>
                <th className="py-2 pr-2">District</th>
                <th className="py-2 pr-2">Cooperative</th>
                <th className="py-2 pr-2">GPS</th>
                <th className="py-2 pr-2">Ha</th>
                <th className="py-2 pr-2">Crop</th>
                <th className="py-2 pr-2">Subsidy</th>
                <th className="py-2 pr-2">Verification</th>
                <th className="py-2">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-medium text-slate-900">{r.fullName}</td>
                  <td className="py-2 pr-2">{r.county}</td>
                  <td className="py-2 pr-2">{r.district}</td>
                  <td className="py-2 pr-2 text-slate-700">{r.cooperative}</td>
                  <td className="py-2 pr-2">
                    <span className="font-mono text-[10px] uppercase">{r.gpsStatus}</span>
                  </td>
                  <td className="py-2 pr-2 tabular-nums">{r.acreage}</td>
                  <td className="py-2 pr-2">{r.mainCrop}</td>
                  <td className="py-2 pr-2">{r.subsidyEligible ? "Eligible" : "No"}</td>
                  <td className="py-2 pr-2">
                    <OpsStatusBadge
                      status={r.verification === "verified" ? "healthy" : r.verification === "pending" ? "warning" : "critical"}
                    />
                  </td>
                  <td className="py-2 font-mono text-[11px]">{r.lastFieldVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OpsCard>
    </div>
  );
}
