"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { insertClientAuditLog } from "@/lib/audit/clientAudit";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CommodityType } from "@/lib/supabase/types";
import { buildLocationLedger, type MovementEdge, type OpeningRow } from "@/lib/inventory/ledger";
import { formatWeight } from "@/lib/utils/formatters";

const COMMODITIES: CommodityType[] = ["cocoa", "rice", "rubber", "palm_oil", "coffee"];

export default function InventoryLedgerClient() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [commodity, setCommodity] = React.useState<CommodityType | "">("cocoa");
  const [county, setCounty] = React.useState("");
  const [orgId, setOrgId] = React.useState("");
  const [locationId, setLocationId] = React.useState("");

  const [locations, setLocations] = React.useState<
    Array<{ id: string; name: string; county: string | null; organization_id: string | null }>
  >([]);
  const [orgs, setOrgs] = React.useState<Array<{ id: string; name: string }>>([]);
  const [movements, setMovements] = React.useState<MovementEdge[]>([]);
  const [openings, setOpenings] = React.useState<OpeningRow[]>([]);

  const [editOpening, setEditOpening] = React.useState<null | { location_id: string; commodity: CommodityType }>(
    null,
  );
  const [openingInput, setOpeningInput] = React.useState("0");
  const [savingOpening, setSavingOpening] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const [{ data: locs, error: locErr }, { data: orgRows }, { data: movs, error: movErr }] =
        await Promise.all([
          supabase.from("locations").select("id,name,county,organization_id").eq("is_active", true).limit(500),
          supabase.from("organizations").select("id,name").order("name").limit(200),
          supabase
            .from("movements")
            .select(
              "id,lot_id,from_location_id,to_location_id,weight_kg_dispatched,weight_kg_received,status,lots(commodity)",
            )
            .order("created_at", { ascending: false })
            .limit(2000),
        ]);

      if (locErr) throw locErr;
      if (movErr) throw movErr;

      setLocations((locs as any) ?? []);
      setOrgs((orgRows as any) ?? []);

      const mapped: MovementEdge[] =
        (movs as any[])?.map((m) => ({
          id: m.id,
          lot_id: m.lot_id,
          commodity: (m.lots?.commodity ?? "cocoa") as CommodityType,
          from_location_id: m.from_location_id ?? null,
          to_location_id: m.to_location_id ?? null,
          weight_kg_dispatched: Number(m.weight_kg_dispatched ?? 0),
          weight_kg_received: m.weight_kg_received == null ? null : Number(m.weight_kg_received),
          status: m.status,
        })) ?? [];
      setMovements(mapped);

      const { data: opens, error: openErr } = await supabase
        .from("location_inventory_opening")
        .select("location_id,commodity,opening_kg");

      if (openErr) {
        if (openErr.message.includes("does not exist") || openErr.code === "42P01") {
          setOpenings([]);
        } else {
          throw openErr;
        }
      } else {
        setOpenings(
          (opens as any[])?.map((o) => ({
            location_id: o.location_id,
            commodity: o.commodity as CommodityType,
            opening_kg: Number(o.opening_kg ?? 0),
          })) ?? [],
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory ledger.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const onPrimary = () => load();
    window.addEventListener("agritrace-primary-action", onPrimary);
    return () => window.removeEventListener("agritrace-primary-action", onPrimary);
  }, [load]);

  const ledgerRows = React.useMemo(
    () =>
      buildLocationLedger({
        locations,
        movements,
        openings,
        filters: { commodity, county, organizationId: orgId, locationId },
      }),
    [locations, movements, openings, commodity, county, orgId, locationId],
  );

  const saveOpening = async () => {
    if (!editOpening) return;
    setSavingOpening(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const kg = Number(openingInput);
      if (!Number.isFinite(kg) || kg < 0) throw new Error("Opening balance must be a number ≥ 0.");

      const { error } = await supabase.from("location_inventory_opening").upsert(
        {
          location_id: editOpening.location_id,
          commodity: editOpening.commodity,
          opening_kg: kg,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "location_id,commodity" },
      );
      if (error) throw error;

      await insertClientAuditLog({
        action: "INVENTORY_OPENING_UPSERT",
        table_name: "location_inventory_opening",
        record_id: editOpening.location_id,
        new_values: { commodity: editOpening.commodity, opening_kg: kg },
      });

      setEditOpening(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save opening balance.");
    } finally {
      setSavingOpening(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div>
            <div className="font-display text-[16px] text-gray-900">Inventory ledger</div>
            <div className="text-[12px] text-gray-500">
              Per-location balances: opening + received − dispatched (from movements).
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 self-start"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <FilterField label="Commodity">
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value as any)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              <option value="">All</option>
              {COMMODITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="County">
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g. Nimba"
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
            />
          </FilterField>
          <FilterField label="Organization">
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              <option value="">All</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Location">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              <option value="">All</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        {error ? (
          <div className="mt-3">
            <AlertBanner severity="warning" message={error} actions={[{ label: "Retry", onClick: load }]} />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading ledger…
          </div>
        ) : ledgerRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[12px] font-medium text-gray-900">No ledger rows</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Adjust filters or ensure locations and movements exist. Run{" "}
              <span className="font-mono">schema.integrity.sql</span> for opening balances.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Location</th>
                  <th className="text-left font-medium px-3 py-3">County</th>
                  <th className="text-left font-medium px-3 py-3">Commodity</th>
                  <th className="text-right font-medium px-3 py-3">Opening</th>
                  <th className="text-right font-medium px-3 py-3">Received</th>
                  <th className="text-right font-medium px-3 py-3">Dispatched</th>
                  <th className="text-right font-medium px-3 py-3">Balance</th>
                  <th className="text-right font-medium px-4 py-3"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerRows.map((r) => (
                  <tr key={`${r.location_id}-${r.commodity}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.location_name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{r.location_id}</div>
                    </td>
                    <td className="px-3 py-3">{r.county ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{r.commodity}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatWeight(r.opening_kg)}</td>
                    <td className="px-3 py-3 text-right font-mono text-green-700">{formatWeight(r.received_kg)}</td>
                    <td className="px-3 py-3 text-right font-mono text-amber-800">{formatWeight(r.dispatched_kg)}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium">{formatWeight(r.balance_kg)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditOpening({ location_id: r.location_id, commodity: r.commodity });
                          setOpeningInput(String(r.opening_kg));
                        }}
                        className="h-8 px-2 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Opening
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editOpening ? (
        <div className="fixed inset-0 z-[120] bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
            <div className="font-display text-[16px] text-gray-900">Opening balance</div>
            <div className="mt-1 text-[11px] text-gray-500 font-mono">
              {editOpening.location_id} · {editOpening.commodity}
            </div>
            <div className="mt-4">
              <label className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Opening (kg)</label>
              <input
                value={openingInput}
                onChange={(e) => setOpeningInput(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
                inputMode="decimal"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpening(null)}
                className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingOpening}
                onClick={saveOpening}
                className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] disabled:opacity-50"
              >
                {savingOpening ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      {children}
    </div>
  );
}
