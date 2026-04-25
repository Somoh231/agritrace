"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogMovementQuick({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [lots, setLots] = React.useState<Array<{ id: string; lot_code: string }>>([]);
  const [locations, setLocations] = React.useState<Array<{ id: string; name: string }>>([]);

  const [lotId, setLotId] = React.useState("");
  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [weight, setWeight] = React.useState("500");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const [{ data: lotData }, { data: locData }] = await Promise.all([
        supabase.from("lots").select("id,lot_code").eq("commodity", "cocoa").order("created_at", { ascending: false }).limit(200),
        supabase.from("locations").select("id,name").eq("is_active", true).order("name").limit(200),
      ]);
      setLots((lotData as any) ?? []);
      setLocations((locData as any) ?? []);
      setLotId((lotData as any)?.[0]?.id ?? "");
      setFromId((locData as any)?.[0]?.id ?? "");
      setToId((locData as any)?.[1]?.id ?? (locData as any)?.[0]?.id ?? "");
    }
    load();
  }, []);

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-gray-200 bg-white p-4">
      {err ? <AlertBanner severity="danger" message={err} /> : null}
      <div className="space-y-3 mt-2">
        <select value={lotId} onChange={(e) => setLotId(e.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]">
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.lot_code}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 text-[14px]">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="Weight dispatched (kg)" className="h-12 w-full rounded-xl border border-gray-200 px-3 text-[14px]" />

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setErr(null);
            setBusy(true);
            try {
              const w = Number(weight);
              if (!Number.isFinite(w) || w <= 0) throw new Error("Weight must be > 0.");
              if (!lotId || !fromId || !toId) throw new Error("Select lot and locations.");
              if (fromId === toId) throw new Error("From and To must differ.");
              const supabase = getSupabaseBrowserClient();
              const { data: me } = await supabase.auth.getUser();
              const { error } = await supabase.from("movements").insert({
                lot_id: lotId,
                from_location_id: fromId,
                to_location_id: toId,
                weight_kg_dispatched: w,
                dispatched_at: new Date().toISOString(),
                dispatched_by: me.user?.id ?? null,
                status: "dispatched",
              } as any);
              if (error) throw error;
              toast.success("Movement logged", "Dispatched record created");
              onDone();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Failed to log movement.";
              setErr(msg);
              toast.error("Couldn’t log movement", msg);
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

