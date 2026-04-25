"use client";

import * as React from "react";

import DataTable from "@/components/shared/DataTable";
import StatusPill from "@/components/shared/StatusPill";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";

type FarmerRow = {
  id: string;
  full_name: string;
  county: string;
  plots_count: number;
  gps: "Mapped" | "Point only" | "None";
  eudr: "Clear" | "Pending" | "Flagged";
  registration_date: string;
};

export default function FarmerRegistryTable() {
  const [county, setCounty] = React.useState<string>("");
  const [rows, setRows] = React.useState<FarmerRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        let q = supabase
          .from("farmers")
          .select("id, full_name, county, registration_date, plots(id, polygon_geojson, center_latitude, center_longitude, deforestation_check_status)")
          .order("created_at", { ascending: false })
          .limit(250);
        if (county) q = q.eq("county", county);
        const { data } = await q;

        const mapped: FarmerRow[] =
          (data as any[])?.map((f) => {
            const plots = (f.plots ?? []) as any[];
            const plotsCount = plots.length;
            const polygonCount = plots.filter((p) => p.polygon_geojson).length;
            const pointCount = plots.filter((p) => p.center_latitude != null && p.center_longitude != null).length;
            const flagged = plots.some((p) => p.deforestation_check_status === "flagged");
            const pending = plots.some((p) => p.deforestation_check_status === "pending");

            const gps =
              plotsCount === 0
                ? "None"
                : polygonCount === plotsCount
                  ? "Mapped"
                  : pointCount > 0
                    ? "Point only"
                    : "None";

            const eudr = flagged ? "Flagged" : pending ? "Pending" : "Clear";

            return {
              id: f.id,
              full_name: f.full_name,
              county: f.county,
              plots_count: plotsCount,
              gps,
              eudr,
              registration_date: f.registration_date ?? "",
            };
          }) ?? [];

        setRows(mapped);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [county]);

  const columns = [
    {
      key: "id",
      label: "Farmer ID",
      width: "120px",
      render: (v: unknown) => <span className="font-mono text-[11px] text-blue-700">{String(v ?? "")}</span>,
    },
    { key: "full_name", label: "Name", width: "160px" },
    { key: "county", label: "County", width: "90px" },
    { key: "plots_count", label: "Plots", width: "60px", render: (v: unknown) => <span className="font-mono">{String(v ?? 0)}</span> },
    {
      key: "gps",
      label: "GPS",
      width: "100px",
      render: (v: unknown) =>
        v === "Mapped" ? (
          <StatusPill status="ok" label="Mapped" />
        ) : v === "Point only" ? (
          <StatusPill status="warning" label="Point only" />
        ) : (
          <StatusPill status="error" label="None" />
        ),
    },
    {
      key: "eudr",
      label: "EUDR",
      width: "100px",
      render: (v: unknown) =>
        v === "Clear" ? (
          <StatusPill status="ok" label="Clear" />
        ) : v === "Pending" ? (
          <StatusPill status="warning" label="Pending" />
        ) : (
          <StatusPill status="error" label="Flagged" />
        ),
    },
    {
      key: "registration_date",
      label: "Registered",
      width: "110px",
      render: (v: unknown) => <span className="font-mono text-[11px] text-gray-600">{String(v ?? "").slice(0, 10)}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-[16px] text-gray-900">Farmer registry</div>
            <div className="text-[12px] text-gray-500">Registration + mapping coverage.</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">County</div>
            <select value={county} onChange={(e) => setCounty(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]">
              <option value="">All</option>
              {LIBERIA_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={isLoading ? [] : (rows as any)}
          emptyMessage={isLoading ? "Loading…" : "No farmers."}
        />
      </div>

      <RegisterFarmerForm />
    </div>
  );
}

function RegisterFarmerForm() {
  const [fullName, setFullName] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [gender, setGender] = React.useState("Prefer not to say");
  const [county, setCounty] = React.useState(LIBERIA_COUNTIES[0]);
  const [district, setDistrict] = React.useState("");
  const [village, setVillage] = React.useState("");
  const [coops, setCoops] = React.useState<Array<{ id: string; name: string }>>([]);
  const [coopId, setCoopId] = React.useState<string>("");
  const [gps, setGps] = React.useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("organizations").select("id,name").eq("type", "cooperative").order("name");
      setCoops((data as any) ?? []);
      setCoopId((data as any)?.[0]?.id ?? "");
    }
    load();
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-display text-[16px] text-gray-900">Register new farmer</div>
      <div className="mt-1 text-[12px] text-gray-500">Fast entry for field agents and call center.</div>

      {error ? <div className="mt-3 text-[12px] text-red-700">{error}</div> : null}
      {ok ? <div className="mt-3 text-[12px] text-green-700">{ok}</div> : null}

      <div className="mt-4 space-y-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-2">Personal information</div>
          <div className="space-y-2">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
            <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID (LBR-XXXXXXXX)" className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
            <div className="grid grid-cols-2 gap-2">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+231…)" className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-2">Location</div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={county} onChange={(e) => setCounty(e.target.value as any)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
                {LIBERIA_COUNTIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village" className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
              <select value={coopId} onChange={(e) => setCoopId(e.target.value)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
                {coops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-2">GPS location</div>
          <div className="space-y-2">
            <input
              readOnly
              value={
                gps
                  ? `${gps.lat.toFixed(5)}°, ${gps.lng.toFixed(5)}°${gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ""}`
                  : ""
              }
              placeholder="Capture coordinates"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-[12px] bg-gray-50"
            />
            <button
              type="button"
              disabled={gpsBusy}
              onClick={() => {
                setError(null);
                setOk(null);
                setGpsBusy(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGps({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      accuracy: pos.coords.accuracy,
                    });
                    setGpsBusy(false);
                  },
                  (err) => {
                    setError(err.message);
                    setGpsBusy(false);
                  },
                  { enableHighAccuracy: true, timeout: 15000 },
                );
              }}
              className="h-10 w-full rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {gpsBusy ? "Capturing…" : "Capture GPS"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setError(null);
            setOk(null);
            try {
              if (!fullName.trim()) throw new Error("Full name is required.");
              if (!nationalId.trim()) throw new Error("National ID is required.");
              const supabase = getSupabaseBrowserClient();
              const { data: me } = await supabase.auth.getUser();
              const { error: insErr } = await supabase.from("farmers").insert({
                full_name: fullName.trim(),
                national_id: nationalId.trim(),
                phone: phone.trim() || null,
                gender,
                organization_id: coopId || null,
                county,
                district: district.trim() || null,
                village: village.trim() || null,
                latitude: gps?.lat ?? null,
                longitude: gps?.lng ?? null,
                registered_by: me.user?.id ?? null,
              } as any);
              if (insErr) throw insErr;
              await supabase.from("audit_log").insert({
                action: "CREATE",
                table_name: "farmers",
                new_values: { full_name: fullName.trim(), county },
              } as any);
              setOk("Farmer registered.");
              setFullName("");
              setNationalId("");
              setPhone("");
              setDistrict("");
              setVillage("");
              setGps(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Registration failed.");
            }
          }}
          className="h-10 w-full rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
        >
          Register farmer
        </button>
      </div>
    </div>
  );
}

