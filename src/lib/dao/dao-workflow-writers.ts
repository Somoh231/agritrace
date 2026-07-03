import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { daoAuditInsertSafe } from "@/lib/dao/dao-audit";
import { isOperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";
import {
  buildFieldReportSummary,
  isMoaOperationalSurveyKind,
  type MoaOperationalSurveyKind,
  type MoaOperationalSurveyPayload,
} from "@/lib/reporting/moa-operational-payload";
import {
  ensureFarmBoundarySubmission,
  ensureOperationalSubmission,
} from "@/lib/workflow/submission-bridge";

export type PersistResult =
  | { ok: true; submissionId?: string | null }
  | { ok: false; error: string };

async function persistPlotFromBoundary(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  farmerId: string,
  boundary: import("@/lib/gis/operational-boundary-types").OperationalFarmBoundary,
  registeredBy: string | null,
): Promise<string | null> {
  const polygonGeojson = {
    type: "Feature",
    properties: {
      source: "dao_workflow_boundary",
      captured_at: boundary.capturedAt,
      captured_points: boundary.capturedPoints,
    },
    geometry: boundary.geometry,
  };
  const { data, error } = await supabase
    .from("plots")
    .insert({
      farmer_id: farmerId,
      commodity: "rice",
      area_hectares: boundary.areaHectares,
      polygon_geojson: polygonGeojson,
      registered_by: registeredBy,
    } as Record<string, unknown>)
    .select("id")
    .single();
  if (error) return null;
  return data?.id ? String(data.id) : null;
}

export async function persistRegisterFarmerPayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const full_name = String(payload.full_name ?? "").trim();
    const county = String(payload.county ?? "").trim();
    if (!full_name || !county) return { ok: false, error: "Full name and county are required." };

    const acreage = payload.acreage_hectares != null && String(payload.acreage_hectares).trim()
      ? Number(payload.acreage_hectares)
      : null;
    const lat = payload.latitude != null && String(payload.latitude).trim() ? Number(payload.latitude) : null;
    const lng = payload.longitude != null && String(payload.longitude).trim() ? Number(payload.longitude) : null;

    let notes: string | null = null;
    const composed = payload.notes_composed;
    if (typeof composed === "string" && composed.trim()) notes = composed.trim();
    else if (payload.notes != null && String(payload.notes).trim()) notes = String(payload.notes).trim();

    const { data: farmer, error } = await supabase
      .from("farmers")
      .insert({
        full_name,
        county,
        district: payload.district ? String(payload.district).trim() || null : null,
        village: payload.village ? String(payload.village).trim() || null : null,
        phone: payload.phone ? String(payload.phone).trim() || null : null,
        national_id: payload.national_id ? String(payload.national_id).trim() || null : null,
        main_crop: payload.main_crop ? String(payload.main_crop).trim() || "rice" : "rice",
        acreage_hectares: acreage != null && Number.isFinite(acreage) ? acreage : null,
        gender: payload.gender ? String(payload.gender).trim() || null : null,
        latitude: lat != null && Number.isFinite(lat) ? lat : null,
        longitude: lng != null && Number.isFinite(lng) ? lng : null,
        notes,
        registered_by: user?.id ?? null,
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !farmer?.id) return { ok: false, error: error?.message ?? "Farmer insert failed." };

    const farmerId = String(farmer.id);
    await daoAuditInsertSafe(supabase, {
      action: "DAO_FARMER_REGISTERED",
      table_name: "farmers",
      record_id: farmerId,
      new_values: { full_name, county },
    });

    const boundary = payload.operational_boundary;
    let plotId: string | null = null;
    if (isOperationalFarmBoundary(boundary)) {
      plotId = await persistPlotFromBoundary(supabase, farmerId, boundary, user?.id ?? null);
      await ensureFarmBoundarySubmission(payload, {
        farmer_id: farmerId,
        ...(plotId ? { plot_id: plotId } : {}),
        captured_at: boundary.capturedAt,
      });
    }

    const submissionId = await ensureOperationalSubmission({
      kind: "register_farmer",
      payload,
      entityRefs: { farmer_id: farmerId, ...(plotId ? { plot_id: plotId } : {}) },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistFarmInspectionPayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const farmer_id = String(payload.farmer_id ?? "").trim();
    if (!farmer_id) return { ok: false, error: "Farmer ID is required." };
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const lat = payload.gps_latitude != null && String(payload.gps_latitude).trim() ? Number(payload.gps_latitude) : null;
    const lng = payload.gps_longitude != null && String(payload.gps_longitude).trim() ? Number(payload.gps_longitude) : null;

    const boundary = payload.operational_boundary;
    const boundaryInsert: Record<string, unknown> = {};
    if (isOperationalFarmBoundary(boundary)) {
      boundaryInsert.boundary_geometry = boundary.geometry;
      boundaryInsert.boundary_points = boundary.capturedPoints;
      boundaryInsert.boundary_area_ha = boundary.areaHectares;
      boundaryInsert.boundary_captured_at = boundary.capturedAt;
    }

    const { data: visit, error } = await supabase
      .from("farmer_visits")
      .insert({
        farmer_id,
        visited_by: user?.id ?? null,
        notes: (payload.composed_notes as string) ?? null,
        gps_latitude: lat != null && Number.isFinite(lat) ? lat : null,
        gps_longitude: lng != null && Number.isFinite(lng) ? lng : null,
        verification_status: payload.verification_status ? String(payload.verification_status) : null,
        ...boundaryInsert,
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !visit?.id) return { ok: false, error: error?.message ?? "Visit insert failed." };

    const visitId = String(visit.id);
    await daoAuditInsertSafe(supabase, {
      action: "DAO_FARM_INSPECTION",
      table_name: "farmer_visits",
      record_id: visitId,
      new_values: { farmer_id },
    });

    if (isOperationalFarmBoundary(boundary)) {
      await ensureFarmBoundarySubmission(payload, {
        farmer_id,
        visit_id: visitId,
        captured_at: boundary.capturedAt,
      });
    }

    const submissionId = await ensureOperationalSubmission({
      kind: "farm_inspection",
      payload,
      entityRefs: {
        farmer_id,
        visit_id: visitId,
        ...(isOperationalFarmBoundary(boundary) ? { captured_at: boundary.capturedAt } : {}),
      },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistPestDiseasePayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const county = String(payload.county ?? "").trim();
    const pest_type = String(payload.pest_type ?? "").trim();
    const severity = String(payload.severity ?? "").trim();
    if (!county || !pest_type || !severity) return { ok: false, error: "County, pest type, and severity are required." };

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const summary = String(payload.summary ?? "").trim() || `DAO pest/disease · ${pest_type} (${severity})`;
    const channel = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

    const { data: row, error } = await supabase
      .from("field_reports")
      .insert({
        county,
        officer_profile_id: user?.id ?? null,
        summary,
        channel,
        payload: {
          dao_workflow: "pest_disease_report",
          pest_type,
          severity,
          crop: payload.crop ?? null,
          affected_area_ha: payload.affected_area_ha ?? null,
          farmer_id: payload.farmer_id ?? null,
          evidence_ref: payload.evidence_ref ?? null,
          notes: payload.notes ?? null,
        },
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !row?.id) return { ok: false, error: error?.message ?? "Field report insert failed." };

    await daoAuditInsertSafe(supabase, {
      action: "DAO_PEST_DISEASE_REPORT",
      table_name: "field_reports",
      record_id: String(row.id),
      new_values: { county, pest_type, severity },
    });

    const submissionId = await ensureOperationalSubmission({
      kind: "pest_disease_report",
      payload,
      entityRefs: { field_report_id: String(row.id) },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistProductionEstimatePayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const farmer_id = String(payload.farmer_id ?? "").trim();
    const season = String(payload.season ?? "").trim();
    const expected = payload.expected_yield_kg != null ? Number(payload.expected_yield_kg) : NaN;
    if (!farmer_id || !season || !Number.isFinite(expected) || expected <= 0) {
      return { ok: false, error: "Farmer ID, season, and expected yield (kg) are required." };
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: record, error } = await supabase
      .from("rice_production_records")
      .insert({
        farmer_id,
        season,
        expected_yield_kg: expected,
        county: payload.county ? String(payload.county).trim() || null : null,
        district: payload.district ? String(payload.district).trim() || null : null,
        notes: payload.notes ? String(payload.notes).trim() || null : null,
        recorded_by: user?.id ?? null,
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !record?.id) return { ok: false, error: error?.message ?? "Production record insert failed." };

    await daoAuditInsertSafe(supabase, {
      action: "DAO_PRODUCTION_ESTIMATE",
      table_name: "rice_production_records",
      record_id: String(record.id),
      new_values: { farmer_id, season, expected_yield_kg: expected },
    });

    const submissionId = await ensureOperationalSubmission({
      kind: "production_estimate",
      payload,
      entityRefs: { production_record_id: String(record.id), farmer_id },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistSubsidyDeliveryPayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const farmer_id = String(payload.farmer_id ?? "").trim();
    const warehouse_id = String(payload.warehouse_id ?? "").trim();
    const inventory_item_id = String(payload.inventory_item_id ?? "").trim();
    const quantity = Number(payload.quantity ?? payload.quantity_seeds);
    if (!farmer_id || !warehouse_id || !inventory_item_id || !Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: "Farmer, warehouse, SKU, and quantity are required." };
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: log, error } = await supabase
      .from("distribution_logs")
      .insert({
        farmer_id,
        warehouse_id,
        inventory_item_id,
        quantity,
        channel: String(payload.channel ?? "dao_subsidy_verify"),
        created_by: user?.id ?? null,
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !log?.id) return { ok: false, error: error?.message ?? "Distribution log insert failed." };

    await daoAuditInsertSafe(supabase, {
      action: "DAO_SUBSIDY_DELIVERY_VERIFY",
      table_name: "distribution_logs",
      record_id: String(log.id),
      new_values: { farmer_id, warehouse_id, quantity },
    });

    const submissionId = await ensureOperationalSubmission({
      kind: "subsidy_delivery_verify",
      payload,
      entityRefs: { distribution_log_id: String(log.id), farmer_id, warehouse_id },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistGpsEvidencePayload(payload: Record<string, unknown>): Promise<PersistResult> {
  try {
    const farmer_id = String(payload.farmer_id ?? "").trim();
    const lat = Number(payload.latitude);
    const lng = Number(payload.longitude);
    if (!farmer_id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, error: "Farmer ID and GPS coordinates are required." };
    }

    const supabase = getSupabaseBrowserClient();

    const accuracy = payload.accuracy_m != null && String(payload.accuracy_m).trim() ? Number(payload.accuracy_m) : null;

    const { data: geo, error } = await supabase
      .from("geo_locations")
      .insert({
        farmer_id,
        latitude: lat,
        longitude: lng,
        accuracy_m: accuracy != null && Number.isFinite(accuracy) ? accuracy : null,
        captured_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !geo?.id) return { ok: false, error: error?.message ?? "Geo location insert failed." };

    await daoAuditInsertSafe(supabase, {
      action: "DAO_GPS_FIELD_EVIDENCE",
      table_name: "geo_locations",
      record_id: String(geo.id),
      new_values: {
        latitude: lat,
        longitude: lng,
        evidence_ref: payload.evidence_ref ?? null,
        plot_notes: payload.plot_notes ?? null,
      },
    });

    const submissionId = await ensureOperationalSubmission({
      kind: "gps_field_evidence",
      payload,
      entityRefs: {
        geo_location_id: String(geo.id),
        farmer_id,
        latitude: String(lat),
        longitude: String(lng),
      },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistMoaOperationalSurvey(
  kind: MoaOperationalSurveyKind,
  payload: Record<string, unknown>,
): Promise<PersistResult> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const packed: MoaOperationalSurveyPayload = {
      ...(payload as unknown as MoaOperationalSurveyPayload),
      schema_version: 1,
      report_kind: kind,
    };
    const county = String(packed.county ?? "").trim();
    if (!county) return { ok: false, error: "County is required." };

    const summary = buildFieldReportSummary(kind, packed).slice(0, 480);
    const channel = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

    const { data: row, error } = await supabase
      .from("field_reports")
      .insert({
        county,
        officer_profile_id: user?.id ?? null,
        summary,
        channel,
        payload: {
          moa_operational_survey: true,
          dao_workflow_kind: kind,
          ...JSON.parse(JSON.stringify(packed)) as Record<string, unknown>,
        },
      } as Record<string, unknown>)
      .select("id")
      .single();
    if (error || !row?.id) return { ok: false, error: error?.message ?? "Survey insert failed." };

    await daoAuditInsertSafe(supabase, {
      action: "MOA_OPERATIONAL_SURVEY",
      table_name: "field_reports",
      record_id: String(row.id),
      new_values: { county, report_kind: kind },
    });

    const submissionId = await ensureOperationalSubmission({
      kind,
      payload,
      entityRefs: { source_id: String(row.id) },
    });

    return { ok: true, submissionId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function persistWorkflowByKind(
  kind: import("@/lib/dao/dao-workflow-types").DaoWorkflowKind,
  payload: Record<string, unknown>,
): Promise<PersistResult> {
  if (isMoaOperationalSurveyKind(kind)) {
    return persistMoaOperationalSurvey(kind, payload);
  }
  switch (kind) {
    case "register_farmer":
      return persistRegisterFarmerPayload(payload);
    case "farm_inspection":
      return persistFarmInspectionPayload(payload);
    case "pest_disease_report":
      return persistPestDiseasePayload(payload);
    case "production_estimate":
      return persistProductionEstimatePayload(payload);
    case "subsidy_delivery_verify":
      return persistSubsidyDeliveryPayload(payload);
    case "gps_field_evidence":
      return persistGpsEvidencePayload(payload);
    default:
      return { ok: false, error: "Unknown workflow kind" };
  }
}
