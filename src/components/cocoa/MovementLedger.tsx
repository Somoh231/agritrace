"use client";

import * as React from "react";

import AlertBanner from "@/components/shared/AlertBanner";
import ProgressBar from "@/components/shared/ProgressBar";
import StatusPill from "@/components/shared/StatusPill";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime, formatWeight } from "@/lib/utils/formatters";
import { calculateVariancePct, getVarianceSeverity } from "@/lib/utils/reconciliation";

type MovementRow = {
  id: string;
  lot_code: string;
  from_name: string;
  to_name: string;
  weight_dispatched: number;
  weight_received: number | null;
  status: "dispatched" | "in_transit" | "received" | "disputed";
  dispatched_at: string | null;
  received_at: string | null;
  driver_name: string | null;
  vehicle_id: string | null;
};

export default function MovementLedger() {
  const [tab, setTab] = React.useState<"ledger" | "disputes" | "log">("ledger");
  const [rows, setRows] = React.useState<MovementRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const disputes = rows.filter((r) => r.status === "disputed");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("movements")
        .select(
          "id, lot_id, weight_kg_dispatched, weight_kg_received, status, dispatched_at, received_at, driver_name, vehicle_id, lots(lot_code), from_location_id, to_location_id, from:locations!movements_from_location_id_fkey(name), to:locations!movements_to_location_id_fkey(name)",
        )
        .order("created_at", { ascending: false })
        .limit(400);

      const mapped: MovementRow[] =
        (data as any[])?.map((m) => ({
          id: m.id,
          lot_code: m.lots?.lot_code ?? "—",
          from_name: m.from?.name ?? "—",
          to_name: m.to?.name ?? "—",
          weight_dispatched: Number(m.weight_kg_dispatched ?? 0),
          weight_received: m.weight_kg_received == null ? null : Number(m.weight_kg_received),
          status: m.status,
          dispatched_at: m.dispatched_at ?? null,
          received_at: m.received_at ?? null,
          driver_name: m.driver_name ?? null,
          vehicle_id: m.vehicle_id ?? null,
        })) ?? [];

      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
        <div>
          <div className="font-display text-[16px] text-gray-900">Movement ledger</div>
          <div className="text-[12px] text-gray-500">Reconciliation and dispute tracking.</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab("ledger")}
            className={`h-8 px-3 rounded-md text-[12px] border ${
              tab === "ledger"
                ? "bg-forest-50 border-forest-100 text-forest-800"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Full ledger
          </button>
          <button
            type="button"
            onClick={() => setTab("disputes")}
            className={`h-8 px-3 rounded-md text-[12px] border ${
              tab === "disputes"
                ? "bg-forest-50 border-forest-100 text-forest-800"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Disputes <span className="ml-1 font-mono text-[10px] text-red-700">{disputes.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("log")}
            className={`h-8 px-3 rounded-md text-[12px] border ${
              tab === "log"
                ? "bg-forest-50 border-forest-100 text-forest-800"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Log movement
          </button>
        </div>
      </div>

      {tab === "ledger" ? (
        <LedgerView isLoading={isLoading} rows={rows} />
      ) : tab === "disputes" ? (
        <DisputesView rows={disputes} />
      ) : (
        <LogMovementForm
          onSaved={() => {
            setTab("ledger");
            load();
          }}
        />
      )}
    </div>
  );
}

function LedgerView({ isLoading, rows }: { isLoading: boolean; rows: MovementRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="grid grid-cols-[150px_1fr_80px_80px_110px_90px] gap-0 border-b border-gray-100 px-3.5 py-2">
        {["Lot ID", "From → To", "Disp.", "Recv.", "Variance", "Status"].map((h) => (
          <div key={h} className="font-mono text-[9px] uppercase tracking-[1px] text-gray-400">
            {h}
          </div>
        ))}
      </div>
      <div>
        {isLoading
          ? Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2 border-b border-gray-100 grid grid-cols-[150px_1fr_80px_80px_110px_90px]"
              >
                <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-40 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
              </div>
            ))
          : rows.map((r) => {
              const received = r.weight_received ?? 0;
              const pct =
                r.weight_received == null ? 0 : calculateVariancePct(r.weight_dispatched, received);
              const sev =
                r.weight_received == null
                  ? "warning"
                  : getVarianceSeverity(pct, r.weight_dispatched, received);
              const tone = sev === "normal" ? "green" : sev === "warning" ? "amber" : "red";
              const bg = r.status === "disputed" ? "bg-red-50" : "";
              return (
                <div
                  key={r.id}
                  className={`px-3.5 py-2 border-b border-gray-100 grid grid-cols-[150px_1fr_80px_80px_110px_90px] items-center ${bg}`}
                >
                  <div
                    className={`font-mono text-[11px] ${r.status === "disputed" ? "text-red-700" : "text-blue-700"}`}
                  >
                    {r.lot_code}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] text-gray-900 truncate">
                      {r.from_name} → {r.to_name}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {r.dispatched_at ? formatDateTime(r.dispatched_at) : "—"}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-gray-700">
                    {formatWeight(r.weight_dispatched)}
                  </div>
                  <div className="font-mono text-[11px] text-gray-700">
                    {r.weight_received == null ? "—" : formatWeight(received)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[60px]">
                      <ProgressBar valuePct={Math.min(100, Math.abs(pct) * 6)} tone={tone} />
                    </div>
                    <div
                      className={`font-mono text-[11px] ${tone === "green" ? "text-green-700" : tone === "amber" ? "text-amber-700" : "text-red-700"}`}
                    >
                      {r.weight_received == null ? "—" : `${pct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <StatusPill
                      status={
                        r.status === "received"
                          ? "ok"
                          : r.status === "disputed"
                            ? "error"
                            : "info"
                      }
                      label={r.status}
                    />
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

function DisputesView({ rows }: { rows: MovementRow[] }) {
  return (
    <div className="space-y-3">
      <AlertBanner
        severity="warning"
        message={`${rows.length} disputes require resolution before EUDR compliance can be issued.`}
      />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => {
            const received = r.weight_received ?? 0;
            const pct = r.weight_received == null ? 0 : calculateVariancePct(r.weight_dispatched, received);
            return (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] text-red-700">{r.lot_code}</div>
                    <div className="text-[12px] text-gray-900">
                      {r.from_name} → {r.to_name}
                    </div>
                  </div>
                  <StatusPill status="error" label="disputed" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-gray-700">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                      Dispatched
                    </div>
                    <div className="mt-1 font-mono">{formatWeight(r.weight_dispatched)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                      Received
                    </div>
                    <div className="mt-1 font-mono">{r.weight_received == null ? "—" : formatWeight(received)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                      Variance
                    </div>
                    <div className="mt-1 font-mono text-red-700">
                      {r.weight_received == null ? "—" : `${pct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                      Driver
                    </div>
                    <div className="mt-1">{r.driver_name ?? "—"} {r.vehicle_id ? `· ${r.vehicle_id}` : ""}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800">
                    Escalate to supervisor
                  </button>
                  <button type="button" className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50">
                    Add explanation note
                  </button>
                  <button type="button" className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50">
                    Contact driver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-[12px] text-gray-600">
          No disputes.
        </div>
      )}
    </div>
  );
}

function LogMovementForm({ onSaved }: { onSaved: () => void }) {
  const [lots, setLots] = React.useState<Array<{ id: string; lot_code: string; weight_kg_current: number }>>([]);
  const [locations, setLocations] = React.useState<Array<{ id: string; name: string }>>([]);

  const [lotId, setLotId] = React.useState("");
  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [mode, setMode] = React.useState("Truck");
  const [weight, setWeight] = React.useState("500");
  const [driver, setDriver] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  const [dispatchAt, setDispatchAt] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const [{ data: lotData }, { data: locData }] = await Promise.all([
        supabase.from("lots").select("id,lot_code,weight_kg_current").eq("commodity", "cocoa").order("created_at", { ascending: false }).limit(200),
        supabase.from("locations").select("id,name").eq("is_active", true).order("name"),
      ]);
      setLots((lotData as any) ?? []);
      setLocations((locData as any) ?? []);
      setLotId((lotData as any)?.[0]?.id ?? "");
      setFromId((locData as any)?.[0]?.id ?? "");
      setToId((locData as any)?.[1]?.id ?? (locData as any)?.[0]?.id ?? "");
    }
    load();
  }, []);

  const selectedLot = lots.find((l) => l.id === lotId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-xl">
      {error ? <div className="mb-3 text-[12px] text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Lot</div>
          <select value={lotId} onChange={(e) => setLotId(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
            {lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lot_code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">From</div>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">To</div>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Transport</div>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
            {["Truck", "Motorbike", "Boat", "Foot"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Weight dispatched (kg)</div>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
          {selectedLot ? (
            <div className="mt-1 text-[11px] text-gray-500">
              Lot weight now: <span className="font-mono">{formatWeight(Number(selectedLot.weight_kg_current ?? 0))}</span>
            </div>
          ) : null}
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Driver</div>
          <input value={driver} onChange={(e) => setDriver(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Vehicle ID</div>
          <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
        </div>
        <div className="sm:col-span-2">
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Dispatch timestamp</div>
          <input type="datetime-local" value={dispatchAt} onChange={(e) => setDispatchAt(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
        </div>
        <div className="sm:col-span-2">
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20 w-full rounded-md border border-gray-200 px-2 py-2 text-[12px]" />
        </div>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={async () => {
          setError(null);
          setIsSaving(true);
          try {
            const w = Number(weight);
            if (!Number.isFinite(w) || w <= 0) throw new Error("Weight must be > 0.");
            if (!lotId) throw new Error("Select a lot.");
            if (!fromId || !toId) throw new Error("Select from/to locations.");
            if (fromId === toId) throw new Error("From and To must be different.");
            if (selectedLot && w > Number(selectedLot.weight_kg_current ?? 0)) {
              throw new Error("Dispatched weight cannot exceed lot current weight.");
            }

            const supabase = getSupabaseBrowserClient();
            const { data: me } = await supabase.auth.getUser();
            const { error: insErr } = await supabase.from("movements").insert({
              lot_id: lotId,
              from_location_id: fromId,
              to_location_id: toId,
              weight_kg_dispatched: w,
              transport_mode: mode,
              driver_name: driver || null,
              vehicle_id: vehicle || null,
              dispatched_at: new Date(dispatchAt).toISOString(),
              dispatched_by: me.user?.id ?? null,
              status: "dispatched",
              notes: notes || null,
            } as any);
            if (insErr) throw insErr;

            await supabase.from("lots").update({ status: "in_transit" } as any).eq("id", lotId);
            await supabase.from("audit_log").insert({
              action: "MOVE",
              table_name: "movements",
              new_values: { lot_id: lotId, from: fromId, to: toId, weight: w },
            } as any);

            onSaved();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save movement.");
          } finally {
            setIsSaving(false);
          }
        }}
        className="mt-4 h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save movement"}
      </button>
      <div className="mt-2 text-[11px] text-gray-500">
        Received weights + dispute workflow are completed in Phase 4 QA.
      </div>
    </div>
  );
}

