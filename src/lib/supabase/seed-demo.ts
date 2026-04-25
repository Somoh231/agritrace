import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

import { generateLotCode } from "@/lib/utils/lot-codes";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(n: number, amount: number) {
  return n + (Math.random() * 2 - 1) * amount;
}

const DEMO_PASSWORD = "DemoPass!2026";

const DEMO_USERS = [
  {
    email: "demo-ministry@agritrace.demo",
    full_name: "MoA Officer (Demo)",
    role: "government_officer",
    orgName: "Ministry of Agriculture Liberia",
    county: "Montserrado",
  },
  {
    email: "demo-exporter@agritrace.demo",
    full_name: "Exporter Ops (Demo)",
    role: "exporter",
    orgName: "Liberia Agricultural Export Company",
    county: "Montserrado",
  },
  {
    email: "demo-coop@agritrace.demo",
    full_name: "Coop Manager (Demo)",
    role: "cooperative_manager",
    orgName: "Nimba Cocoa Farmers Association",
    county: "Nimba",
  },
  {
    email: "demo-field@agritrace.demo",
    full_name: "Field Agent (Demo)",
    role: "field_agent",
    orgName: "Nimba Cocoa Farmers Association",
    county: "Nimba",
  },
] as const;

async function ensureDemoAuthUsers(supabase: any) {
  const created: Array<{ email: string; id: string }> = [];

  for (const u of DEMO_USERS) {
    // Best-effort lookup by email; if listUsers isn't available, we still try createUser.
    let existingId: string | null = null;
    try {
      const res = await supabase.auth.admin.listUsers({ perPage: 200 });
      const found = res.data.users.find((x: any) => x.email?.toLowerCase() === u.email.toLowerCase());
      existingId = found?.id ?? null;
    } catch {
      existingId = null;
    }

    if (!existingId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      created.push({ email: u.email, id: data.user.id });
    } else {
      // Keep password consistent for demos.
      await supabase.auth.admin.updateUserById(existingId, {
        password: DEMO_PASSWORD,
      });
      created.push({ email: u.email, id: existingId });
    }
  }

  return created;
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Orgs (upsert by name)
  const ORGS = [
    {
      name: "Nimba Cocoa Farmers Association",
      type: "cooperative",
      county: "Nimba",
      country: "Liberia",
      license_number: null,
    },
    {
      name: "Bong County Agricultural Cooperative",
      type: "cooperative",
      county: "Bong",
      country: "Liberia",
      license_number: null,
    },
    {
      name: "Liberia Agricultural Export Company",
      type: "exporter",
      county: "Montserrado",
      country: "Liberia",
      license_number: "LIB-EXP-2026-00041",
    },
    {
      name: "Ministry of Agriculture Liberia",
      type: "government",
      county: "Montserrado",
      country: "Liberia",
      license_number: null,
    },
  ] as const;

  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .upsert(ORGS as any, { onConflict: "name" })
    .select("id,name,county,type,license_number");
  if (orgErr) throw orgErr;

  const orgByName = new Map(orgs.map((o: any) => [o.name, o] as const));
  const nimbaCoop = orgByName.get("Nimba Cocoa Farmers Association")!;
  const bongCoop = orgByName.get("Bong County Agricultural Cooperative")!;
  const exporter = orgByName.get("Liberia Agricultural Export Company")!;

  // 2) Demo auth users + profiles (bootstrap)
  const demoAuthUsers = await ensureDemoAuthUsers(supabase);
  const idByEmail = new Map(demoAuthUsers.map((u) => [u.email, u.id] as const));

  const profileRows = DEMO_USERS.map((u) => ({
    id: idByEmail.get(u.email)!,
    full_name: u.full_name,
    role: u.role,
    organization_id: orgByName.get(u.orgName)!.id,
    county: u.county,
    phone: null,
  }));

  const { error: profErr } = await supabase.from("profiles").upsert(profileRows as any);
  if (profErr) throw profErr;

  // 3) Locations
  const LOCATIONS = [
    {
      name: "Sanniquellie Collection Point",
      type: "collection_point",
      organization_id: nimbaCoop.id,
      county: "Nimba",
      latitude: 7.3667,
      longitude: -8.6833,
    },
    {
      name: "Yekepa Collection Point",
      type: "collection_point",
      organization_id: nimbaCoop.id,
      county: "Nimba",
      latitude: 7.5795,
      longitude: -8.536,
    },
    {
      name: "Gbarnga Collection Point",
      type: "collection_point",
      organization_id: bongCoop.id,
      county: "Bong",
      latitude: 6.9954,
      longitude: -9.4722,
    },
    {
      name: "Suakoko Collection Point",
      type: "collection_point",
      organization_id: bongCoop.id,
      county: "Bong",
      latitude: 7.0314,
      longitude: -9.4983,
    },
    {
      name: "Nimba Warehouse",
      type: "warehouse",
      organization_id: nimbaCoop.id,
      county: "Nimba",
      latitude: 7.42,
      longitude: -8.75,
    },
    {
      name: "Bong Warehouse",
      type: "warehouse",
      organization_id: bongCoop.id,
      county: "Bong",
      latitude: 7.02,
      longitude: -9.5,
    },
    {
      name: "Monrovia Processing Facility",
      type: "processing_facility",
      organization_id: exporter.id,
      county: "Montserrado",
      latitude: 6.3156,
      longitude: -10.8074,
    },
    {
      name: "Freeport of Monrovia",
      type: "export_port",
      organization_id: exporter.id,
      county: "Montserrado",
      latitude: 6.3303,
      longitude: -10.8037,
    },
  ];

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .upsert(LOCATIONS as any, { onConflict: "name" })
    .select("id,name,type,county,organization_id,latitude,longitude");
  if (locErr) throw locErr;

  // 4) Farmers + plots
  const countyCenters = {
    Nimba: { lat: 7.45, lng: -8.7 },
    Bong: { lat: 7.0, lng: -9.45 },
    Lofa: { lat: 8.15, lng: -9.75 },
  } as const;

  const counties = ["Nimba", "Bong", "Lofa"] as const;
  const farmerCounts = { Nimba: 30, Bong: 15, Lofa: 5 } as const;

  const farmersRows: any[] = [];
  for (const county of counties) {
    for (let i = 0; i < farmerCounts[county]; i++) {
      const coop = county === "Bong" ? bongCoop : nimbaCoop;
      const center = countyCenters[county];
      farmersRows.push({
        full_name: `${county} Farmer ${String(i + 1).padStart(2, "0")}`,
        national_id: `LBR-${county.slice(0, 2).toUpperCase()}-${String(100000 + i)}`,
        phone: `+23177${randInt(100000, 999999)}`,
        gender: pick(["Female", "Male"]),
        organization_id: coop.id,
        county,
        district:
          county === "Nimba"
            ? "Sanniquellie-Mahn"
            : county === "Bong"
              ? "Jorquelleh"
              : "Voinjama",
        village: pick(["Town Center", "Outskirts", "River Bank"]),
        latitude: jitter(center.lat, 0.15),
        longitude: jitter(center.lng, 0.15),
        notes: null,
      });
    }
  }

  const { data: farmers, error: farmersErr } = await supabase
    .from("farmers")
    .insert(farmersRows)
    .select("id,county,organization_id");
  if (farmersErr) throw farmersErr;

  const plotRows: any[] = [];
  for (const farmer of farmers as any[]) {
    const isRice = Math.random() < 0.25;
    const commodity = isRice ? "rice" : "cocoa";
    const center = countyCenters[(farmer.county as keyof typeof countyCenters) ?? "Nimba"];
    const hasPolygon = Math.random() < 0.55;
    const status = Math.random() < 0.6 ? "clear" : Math.random() < 0.75 ? "pending" : "flagged";

    plotRows.push({
      farmer_id: farmer.id,
      commodity,
      area_hectares: Number((Math.random() * 2.5 + 0.4).toFixed(2)),
      polygon_geojson: hasPolygon
        ? {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [jitter(center.lng, 0.01), jitter(center.lat, 0.01)],
                  [jitter(center.lng, 0.01), jitter(center.lat, 0.01)],
                  [jitter(center.lng, 0.01), jitter(center.lat, 0.01)],
                  [jitter(center.lng, 0.01), jitter(center.lat, 0.01)],
                  [jitter(center.lng, 0.01), jitter(center.lat, 0.01)],
                ],
              ],
            },
          }
        : null,
      center_latitude: jitter(center.lat, 0.08),
      center_longitude: jitter(center.lng, 0.08),
      land_tenure: pick(["owned", "leased", "communal"]),
      planting_year: randInt(2012, 2024),
      deforestation_check_status: status,
      county: farmer.county,
      district: null,
      village: null,
    });
  }

  const { data: plots, error: plotsErr } = await supabase
    .from("plots")
    .insert(plotRows)
    .select("id,farmer_id,commodity");
  if (plotsErr) throw plotsErr;

  // 5) Cocoa lots + movements
  const cocoaPlots = (plots as any[]).filter((p) => p.commodity === "cocoa");
  const lotRows: any[] = [];
  for (let i = 1; i <= 20; i++) {
    const origin = pick((locations as any[]).filter((l) => l.type === "collection_point"));
    const orgId = origin.organization_id;
    const weightIn = randInt(800, 3500);
    lotRows.push({
      lot_code: generateLotCode("cocoa", i),
      commodity: "cocoa",
      origin_location_id: origin.id,
      organization_id: orgId,
      weight_kg_in: weightIn,
      weight_kg_current: weightIn,
      moisture_content: Number((Math.random() * 4 + 6).toFixed(1)),
      quality_grade: pick(["Grade 1", "Grade 2", "Reject"]),
      status: pick(["created", "in_transit", "at_warehouse", "exported"]),
      season: "2026-A",
      farmer_group_ids: cocoaPlots.slice(i, i + 3).map((p) => p.farmer_id),
      compliance_status: pick(["compliant", "pending_verification", "non_compliant", "unchecked"]),
      notes: null,
    });
  }

  const { data: lots, error: lotsErr } = await supabase
    .from("lots")
    .insert(lotRows)
    .select("id,origin_location_id,organization_id,weight_kg_current,status,lot_code");
  if (lotsErr) throw lotsErr;

  const movementsRows: any[] = [];
  const port = (locations as any[]).find((l) => l.type === "export_port")!;
  const proc = (locations as any[]).find((l) => l.type === "processing_facility")!;
  const warehouses = (locations as any[]).filter((l) => l.type === "warehouse");

  for (const lot of lots as any[]) {
    const origin = (locations as any[]).find((l) => l.id === lot.origin_location_id)!;
    const warehouse = pick(warehouses.filter((w: any) => w.county === origin.county));

    const w1 = Number(lot.weight_kg_current);
    const received1 = Number((w1 * (1 - Math.random() * 0.03)).toFixed(2));
    movementsRows.push({
      lot_id: lot.id,
      from_location_id: origin.id,
      to_location_id: warehouse.id,
      weight_kg_dispatched: w1,
      weight_kg_received: received1,
      dispatched_at: new Date(Date.now() - randInt(1, 6) * 86400000).toISOString(),
      received_at: new Date(Date.now() - randInt(0, 5) * 86400000).toISOString(),
      transport_mode: pick(["Truck", "Motorbike"]),
      driver_name: pick(["K. Johnson", "S. Doe", "M. Kpannah"]),
      vehicle_id: `LR-${randInt(1000, 9999)}`,
      status: "received",
      notes: null,
    });

    if (lot.status === "exported") {
      const dispatched2 = received1;
      const received2 = Number((dispatched2 * (1 - Math.random() * 0.02)).toFixed(2));
      movementsRows.push({
        lot_id: lot.id,
        from_location_id: warehouse.id,
        to_location_id: proc.id,
        weight_kg_dispatched: dispatched2,
        weight_kg_received: received2,
        dispatched_at: new Date(Date.now() - randInt(1, 4) * 86400000).toISOString(),
        received_at: new Date(Date.now() - randInt(0, 3) * 86400000).toISOString(),
        transport_mode: "Truck",
        driver_name: pick(["K. Johnson", "S. Doe", "M. Kpannah"]),
        vehicle_id: `LR-${randInt(1000, 9999)}`,
        status: "received",
        notes: null,
      });
      const dispatched3 = received2;
      const received3 = Number((dispatched3 * (1 - Math.random() * 0.02)).toFixed(2));
      movementsRows.push({
        lot_id: lot.id,
        from_location_id: proc.id,
        to_location_id: port.id,
        weight_kg_dispatched: dispatched3,
        weight_kg_received: received3,
        dispatched_at: new Date(Date.now() - randInt(1, 2) * 86400000).toISOString(),
        received_at: new Date(Date.now() - randInt(0, 1) * 86400000).toISOString(),
        transport_mode: "Truck",
        driver_name: pick(["K. Johnson", "S. Doe", "M. Kpannah"]),
        vehicle_id: `LR-${randInt(1000, 9999)}`,
        status: "received",
        notes: null,
      });
    }
  }
  const { error: mvErr } = await supabase.from("movements").insert(movementsRows);
  if (mvErr) throw mvErr;

  // 6) Rice production records + reports
  const riceFarmers = (farmers as any[]).slice(0, 30);
  const riceRows: any[] = [];
  for (let i = 0; i < 60; i++) {
    const f = pick(riceFarmers);
    const expected = randInt(600, 3000);
    const highLoss = i < 10;
    const actual = highLoss
      ? Math.round(expected * (1 - randInt(12, 25) / 100))
      : Math.round(expected * (1 - randInt(0, 9) / 100));
    const loss = Math.max(0, expected - actual);
    riceRows.push({
      farmer_id: f.id,
      season: "2026-A",
      planting_date: new Date(Date.now() - randInt(60, 200) * 86400000).toISOString().slice(0, 10),
      expected_yield_kg: expected,
      actual_yield_kg: actual,
      post_harvest_loss_kg: loss,
      post_harvest_loss_cause: pick(["storage", "transport", "moisture", "pests"]),
      market_destination: pick(["local_market", "cooperative", "self_consumption"]),
      farm_gate_price_usd: Number((Math.random() * 0.25 + 0.15).toFixed(2)),
      county: f.county,
      district: null,
      notes: null,
    });
  }
  const { error: riceErr } = await supabase.from("rice_production_records").insert(riceRows);
  if (riceErr) throw riceErr;

  const reportsRows = [
    {
      report_code: `RPT-MOA-${new Date().getFullYear()}-00001`,
      title: "Production summary · 2026-A",
      period_label: "2026-A",
      status: "final",
      pdf_url: null,
    },
    {
      report_code: `RPT-MOA-${new Date().getFullYear()}-00002`,
      title: "Post-harvest loss · 2026-A",
      period_label: "2026-A",
      status: "draft",
      pdf_url: null,
    },
  ];
  await supabase.from("reports").insert(reportsRows as any);

  // 7) Audit log
  const auditRows = [
    { action: "CREATE", table_name: "profiles", new_values: { demo_users: DEMO_USERS.map((u) => u.email) } },
    { action: "CREATE", table_name: "farmers", new_values: { count: farmersRows.length } },
    { action: "CREATE", table_name: "plots", new_values: { count: plotRows.length } },
    { action: "CREATE", table_name: "lots", new_values: { count: lotRows.length } },
    { action: "MOVE", table_name: "movements", new_values: { count: movementsRows.length } },
    { action: "CREATE", table_name: "rice_production_records", new_values: { count: riceRows.length } },
    { action: "CREATE", table_name: "reports", new_values: { count: reportsRows.length } },
  ];
  await supabase.from("audit_log").insert(auditRows as any);

  console.log("Demo seed complete.");
  console.log("Demo credentials:");
  for (const u of DEMO_USERS) console.log(`- ${u.role}: ${u.email} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

