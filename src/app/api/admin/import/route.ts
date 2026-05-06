import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminConsole } from "@/lib/supabase/require-admin-console";

type ImportType = "farmers" | "rice" | "lots_movements";

function reqStr(v: unknown, field: string) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`Missing "${field}".`);
  return s;
}

function asNum(v: unknown, field: string) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) throw new Error(`Invalid number for "${field}".`);
  return n;
}

function asDate(v: unknown, field: string) {
  const s = reqStr(v, field);
  // Accept YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Invalid date for "${field}" (use YYYY-MM-DD).`);
  return s;
}

export async function POST(request: Request) {
  const guard = await requireAdminConsole();
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  try {
    const body = (await request.json()) as {
      type: ImportType;
      mode: "validate" | "import";
      rows: Record<string, string>[];
    };

    if (!body?.type || !body?.mode || !Array.isArray(body?.rows)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Keep imports safe for demo: cap rows.
    const rows = body.rows.slice(0, 2000);
    const errors: Array<{ row: number; message: string }> = [];

    if (body.type === "farmers") {
      const inserts: any[] = [];
      rows.forEach((r, idx) => {
        try {
          inserts.push({
            full_name: reqStr(r.full_name ?? r["full_name"], "full_name"),
            national_id: String(r.national_id ?? r["national_id"] ?? "").trim() || null,
            phone: String(r.phone ?? r["phone"] ?? "").trim() || null,
            gender: String(r.gender ?? r["gender"] ?? "").trim() || null,
            county: reqStr(r.county ?? r["county"], "county"),
            district: String(r.district ?? r["district"] ?? "").trim() || null,
            village: String(r.village ?? r["village"] ?? "").trim() || null,
            latitude: r.latitude ? asNum(r.latitude, "latitude") : null,
            longitude: r.longitude ? asNum(r.longitude, "longitude") : null,
            notes: String(r.notes ?? r["notes"] ?? "").trim() || null,
          });
        } catch (e) {
          errors.push({ row: idx + 1, message: e instanceof Error ? e.message : "Invalid row." });
        }
      });

      if (body.mode === "validate") {
        return NextResponse.json({ ok: errors.length === 0, errors, previewCount: inserts.length });
      }
      if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

      const { error } = await admin.from("farmers").insert(inserts);
      if (error) throw error;

      await admin.from("audit_log").insert({
        user_id: guard.userId,
        action: "ADMIN_IMPORT_FARMERS",
        table_name: "farmers",
        new_values: { count: inserts.length },
      } as any);

      return NextResponse.json({ ok: true, inserted: inserts.length, errors: [] });
    }

    if (body.type === "rice") {
      const inserts: any[] = [];
      rows.forEach((r, idx) => {
        try {
          inserts.push({
            farmer_id: reqStr(r.farmer_id ?? r["farmer_id"], "farmer_id"),
            season: reqStr(r.season ?? r["season"], "season"),
            planting_date: r.planting_date ? asDate(r.planting_date, "planting_date") : null,
            expected_yield_kg: r.expected_yield_kg ? asNum(r.expected_yield_kg, "expected_yield_kg") : null,
            actual_yield_kg: r.actual_yield_kg ? asNum(r.actual_yield_kg, "actual_yield_kg") : null,
            post_harvest_loss_kg: r.post_harvest_loss_kg ? asNum(r.post_harvest_loss_kg, "post_harvest_loss_kg") : null,
            post_harvest_loss_cause: String(r.post_harvest_loss_cause ?? r["post_harvest_loss_cause"] ?? "").trim() || null,
            market_destination: String(r.market_destination ?? r["market_destination"] ?? "").trim() || null,
            farm_gate_price_usd: r.farm_gate_price_usd ? asNum(r.farm_gate_price_usd, "farm_gate_price_usd") : null,
            county: String(r.county ?? r["county"] ?? "").trim() || null,
            district: String(r.district ?? r["district"] ?? "").trim() || null,
            water_source: String(r.water_source ?? r["water_source"] ?? "").trim() || null,
            years_farming_plot: r.years_farming_plot ? asNum(r.years_farming_plot, "years_farming_plot") : null,
            notes: String(r.notes ?? r["notes"] ?? "").trim() || null,
            recorded_by: guard.userId,
          });
        } catch (e) {
          errors.push({ row: idx + 1, message: e instanceof Error ? e.message : "Invalid row." });
        }
      });

      if (body.mode === "validate") {
        return NextResponse.json({ ok: errors.length === 0, errors, previewCount: inserts.length });
      }
      if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

      const { error } = await admin.from("rice_production_records").insert(inserts);
      if (error) throw error;

      await admin.from("audit_log").insert({
        user_id: guard.userId,
        action: "ADMIN_IMPORT_RICE",
        table_name: "rice_production_records",
        new_values: { count: inserts.length },
      } as any);

      return NextResponse.json({ ok: true, inserted: inserts.length, errors: [] });
    }

    // lots_movements: pilot-friendly minimal support (lots only in this slice)
    if (body.type === "lots_movements") {
      const inserts: any[] = [];
      rows.forEach((r, idx) => {
        try {
          inserts.push({
            lot_code: reqStr(r.lot_code ?? r["lot_code"], "lot_code"),
            commodity: reqStr(r.commodity ?? r["commodity"], "commodity"),
            origin_location_id: String(r.origin_location_id ?? r["origin_location_id"] ?? "").trim() || null,
            organization_id: String(r.organization_id ?? r["organization_id"] ?? "").trim() || null,
            weight_kg_in: asNum(r.weight_kg_in ?? r["weight_kg_in"], "weight_kg_in"),
            weight_kg_current: asNum(r.weight_kg_current ?? r["weight_kg_current"], "weight_kg_current"),
            moisture_content: r.moisture_content ? asNum(r.moisture_content, "moisture_content") : null,
            quality_grade: String(r.quality_grade ?? r["quality_grade"] ?? "").trim() || null,
            status: String(r.status ?? r["status"] ?? "created"),
            season: String(r.season ?? r["season"] ?? "").trim() || null,
            compliance_status: String(r.compliance_status ?? r["compliance_status"] ?? "unchecked"),
            notes: String(r.notes ?? r["notes"] ?? "").trim() || null,
            created_by: guard.userId,
          });
        } catch (e) {
          errors.push({ row: idx + 1, message: e instanceof Error ? e.message : "Invalid row." });
        }
      });

      if (body.mode === "validate") {
        return NextResponse.json({ ok: errors.length === 0, errors, previewCount: inserts.length });
      }
      if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

      const { error } = await admin.from("lots").insert(inserts);
      if (error) throw error;

      await admin.from("audit_log").insert({
        user_id: guard.userId,
        action: "ADMIN_IMPORT_LOTS",
        table_name: "lots",
        new_values: { count: inserts.length },
      } as any);

      return NextResponse.json({ ok: true, inserted: inserts.length, errors: [] });
    }

    return NextResponse.json({ error: "Unsupported import type." }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

