import type { CommodityType } from "@/lib/supabase/types";

export type MovementEdge = {
  id: string;
  lot_id: string;
  commodity: CommodityType;
  from_location_id: string | null;
  to_location_id: string | null;
  weight_kg_dispatched: number;
  weight_kg_received: number | null;
  status: string;
};

export type OpeningRow = {
  location_id: string;
  commodity: CommodityType;
  opening_kg: number;
};

export type LocationLedgerRow = {
  location_id: string;
  location_name: string;
  county: string | null;
  organization_id: string | null;
  commodity: CommodityType;
  opening_kg: number;
  received_kg: number;
  dispatched_kg: number;
  balance_kg: number;
};

export function buildLocationLedger(params: {
  locations: Array<{
    id: string;
    name: string;
    county: string | null;
    organization_id: string | null;
  }>;
  movements: MovementEdge[];
  openings: OpeningRow[];
  filters: {
    commodity?: CommodityType | "";
    county?: string;
    organizationId?: string;
    locationId?: string;
  };
}): LocationLedgerRow[] {
  const openingMap = new Map<string, number>();
  for (const o of params.openings) {
    openingMap.set(`${o.location_id}:${o.commodity}`, Number(o.opening_kg ?? 0));
  }

  const commodities = new Set<CommodityType>();
  for (const m of params.movements) commodities.add(m.commodity);
  for (const o of params.openings) commodities.add(o.commodity);

  const rows: LocationLedgerRow[] = [];

  for (const loc of params.locations) {
    if (params.filters.locationId && loc.id !== params.filters.locationId) continue;
    if (params.filters.county && (loc.county ?? "") !== params.filters.county) continue;
    if (params.filters.organizationId && loc.organization_id !== params.filters.organizationId) continue;

    const comms = params.filters.commodity
      ? [params.filters.commodity]
      : commodities.size
        ? Array.from(commodities)
        : (["cocoa"] as CommodityType[]);

    for (const commodity of comms) {
      const opening = openingMap.get(`${loc.id}:${commodity}`) ?? 0;

      let received = 0;
      let dispatched = 0;
      for (const m of params.movements) {
        if (m.commodity !== commodity) continue;
        if (m.to_location_id === loc.id && m.status === "received" && m.weight_kg_received != null) {
          received += Number(m.weight_kg_received);
        }
        if (m.from_location_id === loc.id) {
          dispatched += Number(m.weight_kg_dispatched ?? 0);
        }
      }

      const balance = opening + received - dispatched;
      rows.push({
        location_id: loc.id,
        location_name: loc.name,
        county: loc.county,
        organization_id: loc.organization_id,
        commodity,
        opening_kg: opening,
        received_kg: received,
        dispatched_kg: dispatched,
        balance_kg: balance,
      });
    }
  }

  return rows.sort((a, b) => b.balance_kg - a.balance_kg);
}
