/**
 * Ministry-grade canonical pilot seed (Agrivault farmer registry structure).
 * Prerequisites: apply migrations including `20260507120000_ministry_canonical.sql`.
 *
 *   npm run seed:ministry
 */
import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_LINES,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_COUNTY_METRICS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function skuCategory(sku: string): "rice_seed" | "fertilizer" | "pesticide" | "tool" | "other" {
  if (sku.includes("RICE") || sku.includes("SEED")) return "rice_seed";
  if (sku.includes("FERT")) return "fertilizer";
  if (sku.includes("PEST")) return "pesticide";
  if (sku.includes("TOOL") || sku.includes("HOE")) return "tool";
  return "other";
}

function verificationDb(v: string): "verified" | "pending" | "flagged" {
  return v === "Verified" ? "verified" : "pending";
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("[seed:ministry] Upserting warehouses…");
  const warehouseUuidByCode = new Map<string, string>();
  for (const w of MINISTRY_WAREHOUSES) {
    const { data, error } = await supabase
      .from("warehouses")
      .upsert(
        {
          ministry_code: w.ministryCode,
          name: w.name,
          county: w.county,
          latitude: w.latitude,
          longitude: w.longitude,
          capacity_mt: w.capacityMt,
          current_stock_mt: w.currentStockMt,
          utilization_pct: w.utilizationPct,
          manager_name: w.managerName,
          operational_status: w.operationalStatus,
          donor_resupply_flag: w.donorResupplyFlag,
          low_stock_threshold_pct: 18,
        },
        { onConflict: "ministry_code" },
      )
      .select("id,ministry_code");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) throw new Error(`Warehouse upsert missing row for ${w.ministryCode}`);
    warehouseUuidByCode.set(w.ministryCode, row.id as string);
  }

  console.log("[seed:ministry] Upserting inventory SKUs…");
  const seenSku = new Set<string>();
  for (const line of MINISTRY_INVENTORY_LINES) {
    if (seenSku.has(line.sku)) continue;
    seenSku.add(line.sku);
    const category = skuCategory(line.sku);
    const unit = line.unit === "bags" ? "bag" : line.unit === "units" ? "unit" : "kg";
    const { error } = await supabase.from("inventory_items").upsert(
      { sku: line.sku, name: line.itemName, category, unit },
      { onConflict: "sku" },
    );
    if (error) throw error;
  }

  const { data: itemRows } = await supabase.from("inventory_items").select("id,sku").in("sku", [...seenSku]);
  const itemIdBySku = new Map((itemRows ?? []).map((r: { id: string; sku: string }) => [r.sku, r.id]));

  console.log("[seed:ministry] Replacing warehouse_stock for ministry warehouses…");
  const ministryWhIds = [...warehouseUuidByCode.values()];
  await supabase.from("warehouse_stock").delete().in("warehouse_id", ministryWhIds);

  for (const line of MINISTRY_INVENTORY_LINES) {
    const wid = warehouseUuidByCode.get(line.warehouseMinistryCode);
    const iid = itemIdBySku.get(line.sku);
    if (!wid || !iid) continue;
    const lossFlag = line.stockStatus.toLowerCase().includes("low");
    const { error } = await supabase.from("warehouse_stock").insert({
      warehouse_id: wid,
      inventory_item_id: iid,
      quantity: line.quantity,
      batch_code: line.inventoryCode,
      expiry_date: line.expiryDate,
      donor_tagged: line.warehouseMinistryCode === "WH-LOF-001",
      loss_flag: lossFlag,
      theft_flag: false,
    });
    if (error) throw error;
  }

  console.log("[seed:ministry] Upserting cooperatives + farmers…");
  const orgIdByName = new Map<string, string>();
  for (const f of MINISTRY_FARMERS) {
    if (!orgIdByName.has(f.cooperative)) {
      const { data: existing } = await supabase.from("organizations").select("id").eq("name", f.cooperative).maybeSingle();
      if (existing?.id) {
        orgIdByName.set(f.cooperative, existing.id as string);
        continue;
      }
      const { data: ins, error } = await supabase
        .from("organizations")
        .insert({
          name: f.cooperative,
          type: "cooperative",
          country: "Liberia",
          county: f.county,
        })
        .select("id")
        .single();
      if (error) throw error;
      orgIdByName.set(f.cooperative, ins!.id as string);
    }
  }

  const farmerRows = MINISTRY_FARMERS.map((f) => ({
    registry_public_id: f.registryPublicId,
    full_name: f.fullName,
    gender: f.gender,
    phone: f.phone,
    county: f.county,
    district: f.district,
    village: null as string | null,
    latitude: f.gpsLat,
    longitude: f.gpsLng,
    registration_date: f.registrationDate,
    verification_status: verificationDb(f.verification),
    subsidy_eligible: f.subsidyEligible,
    main_crop: f.cropType.toLowerCase(),
    acreage_hectares: f.acreageHa,
    dao_officer_code: f.daoCode,
    primary_warehouse_code: f.primaryWarehouseCode,
    cooperative_name: f.cooperative,
    organization_id: orgIdByName.get(f.cooperative) ?? null,
    notes: `Ministry canonical pilot · warehouse ${f.primaryWarehouseCode}`,
  }));

  const { error: farmErr } = await supabase.from("farmers").upsert(farmerRows, { onConflict: "registry_public_id" });
  if (farmErr) throw farmErr;

  const { data: farmerIds } = await supabase.from("farmers").select("id,registry_public_id").not("registry_public_id", "is", null);
  const farmerUuidByRegistry = new Map(
    (farmerIds ?? []).map((r: { id: string; registry_public_id: string }) => [r.registry_public_id, r.id]),
  );

  console.log("[seed:ministry] Farmer subsidy ledger rows…");
  for (const f of MINISTRY_FARMERS) {
    const fid = farmerUuidByRegistry.get(f.registryPublicId);
    if (!fid || f.subsidyAllocationQty <= 0) continue;
    await supabase.from("farmer_subsidies").delete().eq("farmer_id", fid).eq("programme", "National inputs programme");
    const { error } = await supabase.from("farmer_subsidies").insert({
      farmer_id: fid,
      programme: "National inputs programme",
      period_label: `dist:${f.lastDistributionDate}`,
      amount_usd: null,
    });
    if (error) throw error;
  }

  console.log("[seed:ministry] DAO officers…");
  for (const d of MINISTRY_DAO_OFFICERS) {
    const { error } = await supabase.from("pilot_dao_officers").upsert(
      {
        dao_code: d.daoCode,
        full_name: d.fullName,
        county: d.county,
        district: d.district,
        reports_submitted: d.reportsSubmitted,
        overdue_reports: d.overdueReports,
        farm_visits: d.farmVisits,
        last_activity: d.lastActivity,
        compliance_score: d.complianceScore,
        status: d.status,
      },
      { onConflict: "dao_code" },
    );
    if (error) throw error;
  }

  console.log("[seed:ministry] Operational events…");
  await supabase.from("pilot_operational_events").delete().like("event_code", "EVT-%");
  for (const e of MINISTRY_OPERATIONAL_EVENTS) {
    const { error } = await supabase.from("pilot_operational_events").insert({
      event_code: e.eventCode,
      occurred_at: e.occurredAt,
      severity: e.severity,
      county: e.county,
      district: e.district,
      event_type: e.eventType,
      message: e.message,
      status: e.status,
    });
    if (error) throw error;
  }

  console.log("[seed:ministry] County intelligence metrics…");
  for (const c of MINISTRY_COUNTY_METRICS) {
    const { error } = await supabase.from("pilot_county_metrics").upsert(
      {
        county: c.county,
        production_index: c.productionIndex,
        food_risk: c.foodRisk,
        dao_compliance: c.daoCompliance,
        intelligence_lng: c.lng,
        intelligence_lat: c.lat,
      },
      { onConflict: "county" },
    );
    if (error) throw error;
  }

  console.log("[seed:ministry] Inventory movements…");
  await supabase.from("inventory_movements").delete().like("reference", "MIN-%");
  for (const m of MINISTRY_INVENTORY_MOVEMENTS) {
    const fromId = warehouseUuidByCode.get(m.fromWarehouseCode) ?? null;
    const toId = warehouseUuidByCode.get(m.toWarehouseCode) ?? null;
    const itemId = itemIdBySku.get(m.sku);
    if (!itemId) continue;
    const { error } = await supabase.from("inventory_movements").insert({
      inventory_item_id: itemId,
      warehouse_from: fromId,
      warehouse_to: toId,
      quantity: m.quantity,
      movement_type: m.movementType,
      reference: m.reference,
      created_at: m.occurredAt,
    });
    if (error) throw error;
  }

  console.log("[seed:ministry] Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
