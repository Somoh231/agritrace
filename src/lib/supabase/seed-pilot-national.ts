/**
 * Liberia rice pilot — idempotent seed via service role.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: npm run seed:pilot
 *
 * Safe to re-run: deterministic IDs derived from stable seeds (uuidFromSeed).
 */

import "dotenv/config";

import { createHash } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  PILOT_COUNTIES_ACTIVE,
  PILOT_COUNTIES_FULL,
  countyProductionPerformance,
  farmerRegistrySample,
  fieldReports,
  inventoryTransfers,
  nationalHeroMetrics,
  warehouses as demoWarehouses,
} from "@/lib/demo/agriculture-pilot-data";
import { PILOT_SEASON } from "@/lib/utils/pilot-config";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v?.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

/** Deterministic UUID v4-shaped identifier from any string (stable across runs). */
export function uuidFromSeed(seed: string): string {
  const hash = createHash("sha256").update(seed, "utf8").digest();
  const buf = Buffer.alloc(16);
  hash.copy(buf, 0, 0, 16);
  buf[6] = (buf[6]! & 0x0f) | 0x40;
  buf[8] = (buf[8]! & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const COUNTY_COORDS: Record<string, { lat: number; lng: number }> = {
  Nimba: { lat: 7.6045, lng: -8.4189 },
  Bong: { lat: 7.0628, lng: -9.51306 },
  Lofa: { lat: 8.13869, lng: -9.72207 },
  Margibi: { lat: 6.53185, lng: -10.34918 },
  Montserrado: { lat: 6.328, lng: -10.7978 },
};

const WH_CODES = ["WH-GNT", "WH-GBG", "WH-VOJ", "WH-MRV"] as const;

function jitterCoord(lat: number, lng: number, key: string) {
  const h = createHash("sha256").update(key).digest();
  const j1 = (h[0]! / 255 - 0.5) * 0.08;
  const j2 = (h[1]! / 255 - 0.5) * 0.08;
  return { lat: lat + j1, lng: lng + j2 };
}

async function upsertCounties(supabase: SupabaseClient) {
  const rows = PILOT_COUNTIES_FULL.map((name) => ({
    id: uuidFromSeed(`county:${name}`),
    name,
    code: name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5),
    is_pilot_active: (PILOT_COUNTIES_ACTIVE as readonly string[]).includes(name),
  }));
  const { error } = await supabase.from("counties").upsert(rows, { onConflict: "name" });
  if (error) throw error;
}

async function loadCountyIdsByName(supabase: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("counties").select("id,name");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[(row as { name: string }).name] = (row as { id: string }).id;
  }
  return map;
}

const DISTRICT_SEEDS: Array<{ county: string; name: string }> = [
  { county: "Nimba", name: "Sanniquellie-Mahn" },
  { county: "Nimba", name: "Ganta" },
  { county: "Bong", name: "Fuamah" },
  { county: "Bong", name: "Salala" },
  { county: "Lofa", name: "Voinjama" },
  { county: "Lofa", name: "Kolahun" },
  { county: "Margibi", name: "Kakata" },
  { county: "Montserrado", name: "Careysburg" },
];

async function upsertDistricts(supabase: SupabaseClient, countyIds: Record<string, string>) {
  const rows = DISTRICT_SEEDS.map((d) => ({
    id: uuidFromSeed(`district:${d.county}:${d.name}`),
    county_id: countyIds[d.county],
    name: d.name,
  })).filter((r) => Boolean(r.county_id));

  const { error } = await supabase.from("districts").upsert(rows, { onConflict: "county_id,name" });
  if (error) throw error;
}

async function upsertOrganizations(supabase: SupabaseClient) {
  const orgSpecs = [
    { seed: "org:moa", name: "Ministry of Agriculture Liberia", type: "government" as const, county: "Montserrado" },
    ...farmerRegistrySample.map((f) => ({
      seed: `org:${f.county}:${f.cooperative}`,
      name: f.cooperative,
      type: "cooperative" as const,
      county: f.county,
    })),
  ];
  const seen = new Set<string>();
  const rows = orgSpecs.filter((o) => {
    if (seen.has(o.seed)) return false;
    seen.add(o.seed);
    return true;
  }).map((o) => ({
    id: uuidFromSeed(o.seed),
    name: o.name,
    type: o.type,
    country: "Liberia",
    county: o.county,
  }));

  const { error } = await supabase.from("organizations").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

function orgIdForCoop(name: string, county: string) {
  return uuidFromSeed(`org:${county}:${name}`);
}

async function upsertCooperatives(supabase: SupabaseClient) {
  const coopNames = new Map<string, { county: string; name: string }>();
  for (const f of farmerRegistrySample) {
    coopNames.set(`${f.county}|${f.cooperative}`, { county: f.county, name: f.cooperative });
  }
  const rows = [...coopNames.values()].map((c) => ({
    id: uuidFromSeed(`coop:${c.county}:${c.name}`),
    name: c.name,
    county: c.county,
    organization_id: orgIdForCoop(c.name, c.county),
    contact_phone: "+231770000000",
  }));
  const { error } = await supabase.from("cooperatives").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

function coopId(county: string, name: string) {
  return uuidFromSeed(`coop:${county}:${name}`);
}

async function upsertInventoryItems(supabase: SupabaseClient) {
  const rows = [
    {
      id: uuidFromSeed("item:NERICA-SEED-50KG"),
      sku: "NERICA-SEED-50KG",
      name: "NERICA rice seed",
      category: "rice_seed" as const,
      unit: "kg",
    },
    {
      id: uuidFromSeed("item:UREA-50KG"),
      sku: "UREA-50KG",
      name: "Urea fertilizer",
      category: "fertilizer" as const,
      unit: "kg",
    },
    {
      id: uuidFromSeed("item:NPK-50KG"),
      sku: "NPK-50KG",
      name: "NPK compound",
      category: "fertilizer" as const,
      unit: "kg",
    },
    {
      id: uuidFromSeed("item:PEST-GENERIC-1L"),
      sku: "PEST-GENERIC-1L",
      name: "Crop protection (generic)",
      category: "pesticide" as const,
      unit: "l",
    },
  ];
  const { error } = await supabase.from("inventory_items").upsert(rows, { onConflict: "sku" });
  if (error) throw error;
}

function itemId(sku: string) {
  return uuidFromSeed(`item:${sku}`);
}

async function upsertWarehouses(supabase: SupabaseClient) {
  const rows = demoWarehouses.map((w, i) => ({
    id: uuidFromSeed(`wh:${WH_CODES[i] ?? `WH-${i}`}`),
    code: WH_CODES[i] ?? `WH-${String(i + 1).padStart(3, "0")}`,
    name: w.name,
    county: w.county,
    latitude: COUNTY_COORDS[w.county]?.lat ?? null,
    longitude: COUNTY_COORDS[w.county]?.lng ?? null,
    low_stock_threshold: 5000,
  }));
  const { error } = await supabase.from("warehouses").upsert(rows, { onConflict: "code" });
  if (error) throw error;
}

async function loadWarehouseIdsByCode(supabase: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("warehouses").select("id,code");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[(row as { code: string }).code] = (row as { id: string }).id;
  }
  return map;
}

async function upsertWarehouseStock(supabase: SupabaseClient, whByCode: Record<string, string>) {
  const seedKg = [
    { code: "WH-GNT", sku: "NERICA-SEED-50KG", kg: 420_000, donor: true },
    { code: "WH-GNT", sku: "UREA-50KG", kg: 310_000, donor: false },
    { code: "WH-GNT", sku: "PEST-GENERIC-1L", kg: 42_000, donor: false },
    { code: "WH-GBG", sku: "NERICA-SEED-50KG", kg: 280_000, donor: false },
    { code: "WH-GBG", sku: "UREA-50KG", kg: 240_000, donor: true },
    { code: "WH-VOJ", sku: "NERICA-SEED-50KG", kg: 315_000, donor: true },
    { code: "WH-VOJ", sku: "NPK-50KG", kg: 265_000, donor: false },
    { code: "WH-MRV", sku: "NERICA-SEED-50KG", kg: 890_000, donor: false },
    { code: "WH-MRV", sku: "UREA-50KG", kg: 720_000, donor: false },
  ];

  const rows = seedKg.map((s, idx) => ({
    id: uuidFromSeed(`stock:${s.code}:${s.sku}:${idx}`),
    warehouse_id: whByCode[s.code],
    item_id: itemId(s.sku),
    quantity_numeric: s.kg,
    donor_tagged: s.donor,
    expiry_date: null as string | null,
  }));

  const { error } = await supabase.from("warehouse_stock").upsert(rows, {
    onConflict: "warehouse_id,item_id",
  });
  if (error) throw error;
}

async function upsertFarmersAndPlots(supabase: SupabaseClient) {
  const farmerRows = farmerRegistrySample.map((f) => {
    const base = COUNTY_COORDS[f.county] ?? { lat: 6.5, lng: -9.5 };
    const gps =
      f.gpsStatus === "verified"
        ? jitterCoord(base.lat, base.lng, `gps:${f.id}`)
        : f.gpsStatus === "pending"
          ? jitterCoord(base.lat - 0.05, base.lng + 0.05, `gps-p:${f.id}`)
          : { lat: base.lat, lng: base.lng };

    return {
      id: uuidFromSeed(`farmer:${f.id}`),
      client_id: uuidFromSeed(`farmer-client:${f.id}`),
      full_name: f.fullName,
      national_id: null as string | null,
      phone: "+231770100000",
      gender: null as string | null,
      organization_id: orgIdForCoop(f.cooperative, f.county),
      cooperative_id: coopId(f.county, f.cooperative),
      county: f.county,
      district: f.district,
      village: null as string | null,
      latitude: gps.lat,
      longitude: gps.lng,
      verification_status: f.verification,
      acreage_hectares: f.acreage,
      main_crop: f.mainCrop.toLowerCase(),
      subsidy_eligible: f.subsidyEligible,
      registration_date: "2025-11-01",
      notes: `Pilot registry seed · last visit ${f.lastFieldVisit}`,
    };
  });

  const { error: fe } = await supabase.from("farmers").upsert(farmerRows, { onConflict: "id" });
  if (fe) throw fe;

  const plotRows = farmerRegistrySample.map((f) => ({
    id: uuidFromSeed(`plot:${f.id}`),
    farmer_id: uuidFromSeed(`farmer:${f.id}`),
    commodity: "rice" as const,
    area_hectares: f.acreage,
    county: f.county,
    district: f.district,
    village: null as string | null,
    center_latitude: COUNTY_COORDS[f.county]?.lat ?? null,
    center_longitude: COUNTY_COORDS[f.county]?.lng ?? null,
  }));

  const { error: pe } = await supabase.from("plots").upsert(plotRows, { onConflict: "id" });
  if (pe) throw pe;

  const riceRows = farmerRegistrySample.map((f) => ({
    id: uuidFromSeed(`rice:${f.id}:${PILOT_SEASON}`),
    farmer_id: uuidFromSeed(`farmer:${f.id}`),
    plot_id: uuidFromSeed(`plot:${f.id}`),
    season: PILOT_SEASON,
    expected_yield_kg: f.acreage * 2800,
    actual_yield_kg: f.acreage * 2600,
    post_harvest_loss_kg: f.acreage * 120,
    post_harvest_loss_cause: "moisture handling",
    county: f.county,
    district: f.district,
    notes: "Pilot illustrative yield",
  }));

  const { error: re } = await supabase.from("rice_production_records").upsert(riceRows, { onConflict: "id" });
  if (re) throw re;
}

async function upsertSatellites(supabase: SupabaseClient) {
  const visits = farmerRegistrySample.map((f) => ({
    id: uuidFromSeed(`visit:${f.id}`),
    farmer_id: uuidFromSeed(`farmer:${f.id}`),
    visited_at: `${f.lastFieldVisit}T12:00:00Z`,
    channel: "field",
    notes: "Pilot supervision visit",
    gps_ok: f.gpsStatus === "verified",
  }));
  const { error: ve } = await supabase.from("farmer_visits").upsert(visits, { onConflict: "id" });
  if (ve) throw ve;

  const geo = farmerRegistrySample
    .filter((f) => f.gpsStatus !== "none")
    .map((f) => {
      const base = COUNTY_COORDS[f.county] ?? { lat: 6.5, lng: -9.5 };
      const p = jitterCoord(base.lat, base.lng, `geo:${f.id}`);
      return {
        id: uuidFromSeed(`geo:${f.id}`),
        farmer_id: uuidFromSeed(`farmer:${f.id}`),
        label: "Farm gate",
        latitude: p.lat,
        longitude: p.lng,
        accuracy_m: 12,
        source: "mobile",
      };
    });
  if (geo.length) {
    const { error: ge } = await supabase.from("geo_locations").upsert(geo, { onConflict: "id" });
    if (ge) throw ge;
  }

  const subsidies = farmerRegistrySample
    .filter((f) => f.subsidyEligible)
    .map((f) => ({
      id: uuidFromSeed(`sub:${f.id}`),
      farmer_id: uuidFromSeed(`farmer:${f.id}`),
      programme: "National rice input programme",
      amount_usd: 120,
      period_label: PILOT_SEASON,
      status: "eligible" as const,
    }));
  if (subsidies.length) {
    const { error: se } = await supabase.from("farmer_subsidies").upsert(subsidies, { onConflict: "id" });
    if (se) throw se;
  }

  const prod = farmerRegistrySample.map((f) => ({
    id: uuidFromSeed(`fprod:${f.id}:${PILOT_SEASON}`),
    farmer_id: uuidFromSeed(`farmer:${f.id}`),
    season: PILOT_SEASON,
    commodity: "rice" as const,
    expected_yield_kg: f.acreage * 2800,
    actual_yield_kg: f.acreage * 2600,
    notes: `${f.productionHistorySeasons} seasons on record`,
  }));
  const { error: pe } = await supabase.from("farmer_production").upsert(prod, { onConflict: "id" });
  if (pe) throw pe;
}

async function upsertInputAllocations(supabase: SupabaseClient) {
  const pilotCounties = [...PILOT_COUNTIES_ACTIVE];
  const rows: Array<{
    id: string;
    county: string;
    season: string;
    item_id: string;
    quantity_allocated: number;
    quantity_distributed: number;
  }> = [];
  for (const county of pilotCounties) {
    for (const sku of ["NERICA-SEED-50KG", "UREA-50KG"] as const) {
      rows.push({
        id: uuidFromSeed(`alloc:${county}:${sku}:${PILOT_SEASON}`),
        county,
        season: PILOT_SEASON,
        item_id: itemId(sku),
        quantity_allocated: sku.includes("NERICA") ? 400_000 : 300_000,
        quantity_distributed: sku.includes("NERICA") ? 310_000 : 240_000,
      });
    }
  }
  const { error } = await supabase.from("input_allocations").upsert(rows, {
    onConflict: "county,season,item_id",
  });
  if (error) throw error;
}

async function upsertDistributionLogs(supabase: SupabaseClient, whByCode: Record<string, string>) {
  const rows = farmerRegistrySample.slice(0, 4).map((f, i) => ({
    id: uuidFromSeed(`dist:${f.id}`),
    farmer_id: uuidFromSeed(`farmer:${f.id}`),
    warehouse_id: whByCode[["WH-GNT", "WH-GBG", "WH-VOJ", "WH-MRV"][i % 4]!],
    item_id: itemId("NERICA-SEED-50KG"),
    quantity_numeric: 50 + i * 10,
    channel: "field",
  }));
  const { error } = await supabase.from("distribution_logs").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function upsertInventoryMovements(supabase: SupabaseClient, whByCode: Record<string, string>) {
  const mapNameToCode = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("gbarnga")) return "WH-GBG";
    if (l.includes("ganta")) return "WH-GNT";
    if (l.includes("voinjama")) return "WH-VOJ";
    if (l.includes("monrovia")) return "WH-MRV";
    if (l.includes("nimba")) return "WH-GNT";
    return "WH-MRV";
  };

  const skuFromCommodity = (c: string) => {
    if (c.includes("Urea")) return "UREA-50KG";
    if (c.includes("NERICA")) return "NERICA-SEED-50KG";
    if (c.includes("NPK")) return "NPK-50KG";
    return "NERICA-SEED-50KG";
  };

  const rows = inventoryTransfers.map((t) => ({
    id: uuidFromSeed(`mov:${t.id}`),
    from_warehouse_id: whByCode[mapNameToCode(t.from)] ?? null,
    to_warehouse_id: whByCode[mapNameToCode(t.to)] ?? null,
    item_id: itemId(skuFromCommodity(t.commodity)),
    quantity_numeric: t.qtyTons * 1000,
    status: t.status,
    notes: `Pilot transfer seed · ${t.date}`,
    occurred_at: `${t.date}T10:00:00Z`,
  }));

  const { error } = await supabase.from("inventory_movements").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function upsertSuppliersDonorExpiry(supabase: SupabaseClient, whByCode: Record<string, string>) {
  const suppliers = [
    { id: uuidFromSeed("supplier:1"), supplier_name: "West Africa Inputs Ltd", item_id: itemId("UREA-50KG") },
    { id: uuidFromSeed("supplier:2"), supplier_name: "NERICA Programme Vendor", item_id: itemId("NERICA-SEED-50KG") },
  ];
  const { error: serr } = await supabase.from("supplier_records").upsert(suppliers, { onConflict: "id" });
  if (serr) throw serr;

  const shipments = [
    {
      id: uuidFromSeed("donor:ship:1"),
      donor_name: "IFAD",
      programme: "Rice value chain support",
      item_id: itemId("NERICA-SEED-50KG"),
      warehouse_id: whByCode["WH-GNT"]!,
      quantity_numeric: 120_000,
    },
    {
      id: uuidFromSeed("donor:ship:2"),
      donor_name: "World Food Programme",
      programme: "Emergency resilience stocks",
      item_id: itemId("UREA-50KG"),
      warehouse_id: whByCode["WH-MRV"]!,
      quantity_numeric: 200_000,
    },
  ];
  const { error: derr } = await supabase.from("donor_shipments").upsert(shipments, { onConflict: "id" });
  if (derr) throw derr;

  const expiry = [
    {
      id: uuidFromSeed("expiry:WH-GBG:PEST"),
      warehouse_id: whByCode["WH-GBG"]!,
      item_id: itemId("PEST-GENERIC-1L"),
      alert_level: "watch" as const,
      flag_type: "near_expiry",
      notes: "Pilot monitoring flag",
    },
    {
      id: uuidFromSeed("expiry:WH-MRV:UREA"),
      warehouse_id: whByCode["WH-MRV"]!,
      item_id: itemId("UREA-50KG"),
      alert_level: "healthy" as const,
      flag_type: null as string | null,
      notes: null as string | null,
    },
  ];
  const { error: eerr } = await supabase.from("expiry_tracking").upsert(expiry, {
    onConflict: "warehouse_id,item_id",
  });
  if (eerr) throw eerr;
}

async function upsertFieldAndReporting(supabase: SupabaseClient) {
  const reports = fieldReports.map((r) => ({
    id: uuidFromSeed(`field:${r.id}`),
    county: r.county,
    district: null as string | null,
    summary: r.summary,
    channel: r.channel,
    officer_label: r.officer,
    submitted_at: r.submittedAt,
    submitted_by: null as string | null,
  }));
  const { error: ferr } = await supabase.from("field_reports").upsert(reports, { onConflict: "id" });
  if (ferr) throw ferr;

  const indicators = [
    {
      id: uuidFromSeed("fsi:self_suff:national"),
      indicator_key: "rice_self_sufficiency_pct",
      indicator_value: 100 - nationalHeroMetrics.importDependencyPct,
      indicator_unit: "pct",
      period_label: PILOT_SEASON,
      county: null as string | null,
      notes: "Illustrative pilot headline",
    },
    {
      id: uuidFromSeed("fsi:loss:national"),
      indicator_key: "post_harvest_loss_pct",
      indicator_value: nationalHeroMetrics.postHarvestLossRatePct,
      indicator_unit: "pct",
      period_label: PILOT_SEASON,
      county: null as string | null,
      notes: null as string | null,
    },
    ...countyProductionPerformance.slice(0, 5).map((c, i) => ({
      id: uuidFromSeed(`fsi:yield:${c.county}:${PILOT_SEASON}:${i}`),
      indicator_key: "rice_production_mt",
      indicator_value: c.productionMt,
      indicator_unit: "metric_tonnes",
      period_label: PILOT_SEASON,
      county: c.county,
      notes: null as string | null,
    })),
  ];
  const { error: ierr } = await supabase.from("food_security_indicators").upsert(indicators, {
    onConflict: "indicator_key,period_label,county",
  });
  if (ierr) throw ierr;

  const ministryReports = [
    {
      id: uuidFromSeed("report:PILOT-2026-A"),
      report_code: "PILOT-2026-A",
      title: "National rice pilot — consolidated situational report",
      period_label: PILOT_SEASON,
      status: "final" as const,
      pdf_url: null as string | null,
    },
    {
      id: uuidFromSeed("report:PILOT-INV-WEEKLY"),
      report_code: "INV-WEEKLY-01",
      title: "Input inventory & donor tagging summary",
      period_label: "2026-W18",
      status: "draft" as const,
      pdf_url: null as string | null,
    },
  ];
  const { error: rerr } = await supabase.from("reports").upsert(ministryReports, { onConflict: "report_code" });
  if (rerr) throw rerr;

  const audits = [
    {
      id: uuidFromSeed("audit:seed:1"),
      user_id: null as string | null,
      action: "SEED_PILOT_DATA",
      table_name: "farmers",
      record_id: null as string | null,
      new_values: { script: "seed-pilot-national" },
    },
    {
      id: uuidFromSeed("audit:seed:2"),
      user_id: null as string | null,
      action: "SEED_PILOT_DATA",
      table_name: "warehouse_stock",
      record_id: null as string | null,
      new_values: { note: "Illustrative Liberia rice pilot balances" },
    },
  ];
  const { error: aerr } = await supabase.from("audit_log").upsert(audits, { onConflict: "id" });
  if (aerr) throw aerr;
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.info("[seed:pilot] Upserting pilot reference & inventory domain…");
  await upsertCounties(supabase);
  const countyIds = await loadCountyIdsByName(supabase);
  await upsertDistricts(supabase, countyIds);
  await upsertOrganizations(supabase);
  await upsertCooperatives(supabase);
  await upsertInventoryItems(supabase);
  await upsertWarehouses(supabase);
  const whByCode = await loadWarehouseIdsByCode(supabase);
  await upsertWarehouseStock(supabase, whByCode);
  console.info("[seed:pilot] Upserting farmers, plots, rice records…");
  await upsertFarmersAndPlots(supabase);
  console.info("[seed:pilot] Upserting satellite farmer tables…");
  await upsertSatellites(supabase);
  console.info("[seed:pilot] Upserting allocations & logistics…");
  await upsertInputAllocations(supabase);
  await upsertDistributionLogs(supabase, whByCode);
  await upsertInventoryMovements(supabase, whByCode);
  await upsertSuppliersDonorExpiry(supabase, whByCode);
  console.info("[seed:pilot] Upserting reporting…");
  await upsertFieldAndReporting(supabase);

  console.info("[seed:pilot] Done. Counties:", PILOT_COUNTIES_FULL.length, "| Pilot active:", PILOT_COUNTIES_ACTIVE.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
