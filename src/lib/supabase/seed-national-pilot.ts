/**
 * Pilot-scale national seed (Liberia rice): counties grid, districts, warehouses,
 * inventory SKUs/stock, allocations, rice production rows (needs farmers from seed:demo),
 * field reports, food security row, donor shipments, reporting + audit samples.
 *
 * Order: apply SQL migrations → npm run seed:demo → npm run seed:national
 */
import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { LIBERIA_COUNTIES } from "@/lib/utils/liberia";
import { PILOT_COUNTIES, PILOT_SEASON } from "@/lib/utils/pilot-config";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const PILOT_COUNTY_SET = new Set<string>(PILOT_COUNTIES);

const DISTRICTS_BY_COUNTY: Record<string, string[]> = {
  Nimba: ["Sanniquellie-Mahn", "Gbehlay-Geh"],
  Bong: ["Salala", "Suakoko"],
  Lofa: ["Kolahun", "Voinjama"],
};

const PILOT_WAREHOUSES = [
  { name: "Nimba Central Inputs Hub", county: "Nimba", latitude: 7.42, longitude: -8.75 },
  { name: "Bong County Inputs Depot", county: "Bong", latitude: 7.02, longitude: -9.48 },
  { name: "Lofa Rice Inputs Store", county: "Lofa", latitude: 8.12, longitude: -9.72 },
  { name: "Montserrado Consolidation Point", county: "Montserrado", latitude: 6.31, longitude: -10.81 },
] as const;

const SKU_ITEMS = [
  { sku: "SEED-RICE-NERICA-25KG", name: "NERICA certified rice seed (25 kg)", category: "rice_seed", unit: "bag" },
  { sku: "FERT-UREA-50KG", name: "Urea fertilizer (50 kg)", category: "fertilizer", unit: "bag" },
  { sku: "FERT-NPK-50KG", name: "NPK compound fertilizer (50 kg)", category: "fertilizer", unit: "bag" },
  { sku: "PEST-GENERIC-1L", name: "Integrated pest management spray (1 L)", category: "pesticide", unit: "bottle" },
] as const;

async function ensureWarehouse(
  supabase: SupabaseClient<any>,
  w: (typeof PILOT_WAREHOUSES)[number],
): Promise<string> {
  const { data: existing } = await supabase.from("warehouses").select("id").eq("name", w.name).maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("warehouses")
    .insert({
      name: w.name,
      county: w.county,
      latitude: w.latitude,
      longitude: w.longitude,
      low_stock_threshold_pct: 18,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase: SupabaseClient<any> = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const name of LIBERIA_COUNTIES) {
    const isPilot = PILOT_COUNTY_SET.has(name);
    const { error } = await supabase.from("counties").upsert({ name, is_pilot: isPilot }, { onConflict: "name" });
    if (error) throw error;
  }

  const { data: countyRows, error: countyErr } = await supabase.from("counties").select("id,name");
  if (countyErr) throw countyErr;
  const countyIdByName = new Map((countyRows ?? []).map((r: { id: string; name: string }) => [r.name, r.id]));

  for (const c of PILOT_COUNTIES) {
    const cid = countyIdByName.get(c);
    if (!cid) continue;
    for (const d of DISTRICTS_BY_COUNTY[c] ?? []) {
      const { error } = await supabase.from("districts").upsert(
        { county_id: cid, name: d },
        { onConflict: "county_id,name" },
      );
      if (error) throw error;
    }
  }

  const warehouseIds: Record<string, string> = {};
  for (const w of PILOT_WAREHOUSES) {
    warehouseIds[w.name] = await ensureWarehouse(supabase, w);
  }

  for (const item of SKU_ITEMS) {
    const { error } = await supabase.from("inventory_items").upsert(item, { onConflict: "sku" });
    if (error) throw error;
  }

  const { data: items } = await supabase
    .from("inventory_items")
    .select("id,sku")
    .in(
      "sku",
      SKU_ITEMS.map((s) => s.sku),
    );
  const itemIdBySku = new Map((items ?? []).map((r: { id: string; sku: string }) => [r.sku, r.id]));

  const whUuidList = Object.values(warehouseIds);
  await supabase.from("warehouse_stock").delete().in("warehouse_id", whUuidList);

  const stockRows: Array<Record<string, unknown>> = [];
  let qtyBase = 800;
  for (const w of PILOT_WAREHOUSES) {
    const wid = warehouseIds[w.name];
    for (const sku of SKU_ITEMS) {
      const iid = itemIdBySku.get(sku.sku);
      if (!iid) continue;
      qtyBase += 50;
      stockRows.push({
        warehouse_id: wid,
        inventory_item_id: iid,
        quantity: qtyBase + Math.round(Math.random() * 200),
        batch_code: `PILOT-${PILOT_SEASON}-${sku.sku.slice(0, 8)}`,
        expiry_date: "2027-03-15",
        donor_tagged: sku.sku.includes("UREA") || sku.sku.includes("NPK"),
        loss_flag: false,
        theft_flag: false,
      });
    }
  }
  if (stockRows.length) {
    const { error } = await supabase.from("warehouse_stock").insert(stockRows);
    if (error) throw error;
  }

  await supabase.from("input_allocations").delete().eq("season", PILOT_SEASON);
  for (const county of PILOT_COUNTIES) {
    for (const sku of SKU_ITEMS) {
      const iid = itemIdBySku.get(sku.sku);
      if (!iid) continue;
      const allocated = 120 + county.length * 10;
      const { error } = await supabase.from("input_allocations").insert({
        county,
        inventory_item_id: iid,
        season: PILOT_SEASON,
        quantity_allocated: allocated,
        quantity_distributed: Math.round(allocated * 0.62),
      });
      if (error) throw error;
    }
  }

  const { data: stockIds } = await supabase
    .from("warehouse_stock")
    .select("id,donor_tagged")
    .in("warehouse_id", whUuidList)
    .limit(6);
  if (stockIds?.length) {
    await supabase.from("expiry_tracking").delete().in(
      "warehouse_stock_id",
      stockIds.map((r: { id: string }) => r.id),
    );
    for (const row of stockIds.slice(0, 3)) {
      await supabase.from("expiry_tracking").insert({
        warehouse_stock_id: row.id,
        alert_level: row.donor_tagged ? "critical" : "watch",
      });
    }
  }

  await supabase.from("rice_production_records").delete().eq("season", PILOT_SEASON);
  const { data: farmers } = await supabase
    .from("farmers")
    .select("id,county,full_name")
    .in("county", [...PILOT_COUNTIES])
    .limit(45);

  const { data: ministryProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "demo-ministry@agritrace.demo")
    .maybeSingle();
  const recordedBy = ministryProfile?.id ?? null;

  const riceRows: Array<Record<string, unknown>> = [];
  let idx = 0;
  for (const f of farmers ?? []) {
    idx += 1;
    riceRows.push({
      farmer_id: f.id,
      season: PILOT_SEASON,
      planting_date: "2025-11-12",
      expected_yield_kg: 1800 + idx * 12,
      actual_yield_kg: 1650 + idx * 11,
      post_harvest_loss_kg: 40 + (idx % 5) * 8,
      post_harvest_loss_cause: idx % 3 === 0 ? "Moisture at drying" : "Rodent damage",
      county: f.county,
      recorded_by: recordedBy,
      notes: "Pilot seed — Liberia rice programme",
    });
  }
  if (riceRows.length) {
    const { error } = await supabase.from("rice_production_records").insert(riceRows);
    if (error) throw error;
  }

  await supabase.from("field_reports").delete().like("summary", "Pilot seed:%");

  const { data: fieldAgent } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "demo-field@agritrace.demo")
    .maybeSingle();
  const officerId = fieldAgent?.id ?? null;

  for (const county of PILOT_COUNTIES) {
    const { error } = await supabase.from("field_reports").insert({
      county,
      officer_profile_id: officerId,
      summary: `Pilot seed: Extension visit backlog clearing in ${county}`,
      channel: "offline",
      payload: { plotsVisited: 12 + county.length, inputsVerified: true },
    });
    if (error) throw error;
  }

  const { error: fsErr } = await supabase.from("food_security_indicators").upsert(
    {
      period_label: `${PILOT_SEASON}-national`,
      rice_demand_mt: 620000,
      domestic_production_mt: 220000,
      import_dependency_pct: 42,
      national_risk_score: 58,
      notes: "Pilot modelling — Liberia rice balance sheet (illustrative).",
    },
    { onConflict: "period_label" },
  );
  if (fsErr) throw fsErr;

  await supabase.from("donor_shipments").delete().eq("programme_code", "RICE-LBR-PILOT");

  const primaryWh = warehouseIds[PILOT_WAREHOUSES[0].name];
  const ureaId = itemIdBySku.get("FERT-UREA-50KG");
  const seedId = itemIdBySku.get("SEED-RICE-NERICA-25KG");

  if (ureaId && primaryWh) {
    const { error } = await supabase.from("donor_shipments").insert({
      donor_name: "WFP / Joint Inputs Programme",
      inventory_item_id: ureaId,
      quantity: 4200,
      warehouse_id: primaryWh,
      received_at: "2026-01-18",
      programme_code: "RICE-LBR-PILOT",
    });
    if (error) throw error;
  }
  if (seedId) {
    const { error } = await supabase.from("donor_shipments").insert({
      donor_name: "AfDB Rice Value Chain Window",
      inventory_item_id: seedId,
      quantity: 3100,
      warehouse_id: warehouseIds[PILOT_WAREHOUSES[1].name],
      received_at: "2026-02-02",
      programme_code: "RICE-LBR-PILOT",
    });
    if (error) throw error;
  }

  const { data: supExisting } = await supabase
    .from("supplier_records")
    .select("id")
    .eq("name", "Liberty Supplies Cooperative")
    .maybeSingle();
  if (!supExisting) {
    const { error } = await supabase.from("supplier_records").insert({
      name: "Liberty Supplies Cooperative",
      country: "Liberia",
      notes: "Pilot supplier registry row.",
    });
    if (error) throw error;
  }

  const seedSku = itemIdBySku.get("SEED-RICE-NERICA-25KG");
  if (seedSku && primaryWh && farmers?.[0]?.id && officerId) {
    await supabase.from("distribution_logs").insert({
      farmer_id: farmers[0].id,
      warehouse_id: primaryWh,
      inventory_item_id: seedSku,
      quantity: 4,
      channel: "cooperative",
      created_by: officerId,
    });
  }

  if (seedSku && primaryWh && recordedBy) {
    await supabase.from("inventory_movements").insert({
      inventory_item_id: seedSku,
      warehouse_from: null,
      warehouse_to: primaryWh,
      quantity: 500,
      movement_type: "receipt",
      reference: `SEED-${PILOT_SEASON}-001`,
      county_allocation: "Nimba",
      created_by: recordedBy,
    });
  }

  const farmer0 = farmers?.[0];
  if (farmer0 && officerId) {
    await supabase.from("farmer_visits").insert({
      farmer_id: farmer0.id,
      visited_by: officerId,
      notes: "Pilot seed visit — registration verified.",
      gps_latitude: 7.41,
      gps_longitude: -8.73,
      verification_status: "verified",
    });
    await supabase.from("farmer_subsidies").insert({
      farmer_id: farmer0.id,
      programme: "Rice input voucher",
      amount_usd: 85,
      period_label: PILOT_SEASON,
    });
    await supabase.from("geo_locations").insert({
      farmer_id: farmer0.id,
      latitude: 7.411,
      longitude: -8.731,
      accuracy_m: 12,
    });
  }

  const { error: repErr } = await supabase.from("reports").upsert(
    {
      report_code: "LBR-RICE-PILOT-Q1",
      title: "National Rice Pilot — consolidated dashboard extract",
      period_label: PILOT_SEASON,
      status: "final",
    },
    { onConflict: "report_code" },
  );
  if (repErr) throw repErr;

  if (recordedBy) {
    await supabase.from("audit_log").insert({
      user_id: recordedBy,
      action: "SEED_NATIONAL_PILOT",
      table_name: "seed",
      new_values: { script: "seed-national-pilot", season: PILOT_SEASON },
    });
  }

  console.log("National pilot seed complete:", {
    counties: LIBERIA_COUNTIES.length,
    pilotWarehouses: PILOT_WAREHOUSES.length,
    farmersLinked: farmers?.length ?? 0,
    riceRows: riceRows.length,
    season: PILOT_SEASON,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
