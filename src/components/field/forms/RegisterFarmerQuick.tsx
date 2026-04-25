"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";

export default function RegisterFarmerQuick({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [fullName, setFullName] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [county, setCounty] = React.useState(LIBERIA_COUNTIES[0]);
  const [village, setVillage] = React.useState("");
  const [gps, setGps] = React.useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

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
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value as any)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
          >
            {LIBERIA_COUNTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village"
            className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
          />
        </div>

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
              const supabase = getSupabaseBrowserClient();
              const { data: me } = await supabase.auth.getUser();
              const { error } = await supabase.from("farmers").insert({
                full_name: fullName.trim(),
                national_id: nationalId.trim(),
                phone: phone.trim() || null,
                county,
                village: village.trim() || null,
                latitude: gps?.lat ?? null,
                longitude: gps?.lng ?? null,
                registered_by: me.user?.id ?? null,
              } as any);
              if (error) throw error;
              toast.success("Farmer registered", `${fullName.trim()} · ${county}`);
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

