"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { generateLotCode } from "@/lib/utils/lot-codes";

export default function CreateLotQuick({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [originId, setOriginId] = React.useState("");
  const [weight, setWeight] = React.useState("1200");
  const [locations, setLocations] = React.useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("locations")
        .select("id,name")
        .eq("type", "collection_point")
        .eq("is_active", true)
        .order("name")
        .limit(200);
      setLocations((data as any) ?? []);
      setOriginId((data as any)?.[0]?.id ?? "");
    }
    load();
  }, []);

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-gray-200 bg-white p-4">
      {err ? <AlertBanner severity="danger" message={err} /> : null}
      <div className="space-y-3 mt-2">
        <select
          value={originId}
          onChange={(e) => setOriginId(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputMode="decimal"
          placeholder="Weight (kg)"
          className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]"
        />

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setErr(null);
            setBusy(true);
            try {
              const w = Number(weight);
              if (!Number.isFinite(w) || w <= 0) throw new Error("Weight must be > 0.");
              if (!originId) throw new Error("Select origin.");
              const supabase = getSupabaseBrowserClient();
              const { data: me } = await supabase.auth.getUser();
              const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", me.user?.id ?? "")
                .single();

              const seq = Math.floor(Math.random() * 5000 + 1);
              const lotCode = generateLotCode("cocoa", seq);

              const { error } = await supabase.from("lots").insert({
                lot_code: lotCode,
                commodity: "cocoa",
                origin_location_id: originId,
                organization_id: (profile as any)?.organization_id ?? null,
                weight_kg_in: w,
                weight_kg_current: w,
                status: "created",
                compliance_status: "unchecked",
                created_by: me.user?.id ?? null,
              } as any);
              if (error) throw error;
              toast.success("Lot created", lotCode);
              onDone();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Failed to create lot.";
              setErr(msg);
              toast.error("Couldn’t create lot", msg);
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

