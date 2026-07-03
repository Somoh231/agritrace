import type { DaoWorkflowKind } from "@/lib/dao/dao-workflow-types";
import { postWorkflowAction } from "@/lib/workflow/client";
import { OPERATIONAL_SUBMISSION_TYPES } from "@/lib/workflow/submission-types";

export type WorkflowPersistContext = {
  kind: DaoWorkflowKind | "farm_boundary_capture" | "warehouse_transfer" | "warehouse_created" | "farmer_verification";
  payload: Record<string, unknown>;
  entityRefs?: Record<string, string>;
};

/** Stable idempotency key stored in `operational_submissions.metadata.dedupe_key`. */
export function buildWorkflowDedupeKey(ctx: WorkflowPersistContext): string | null {
  const refs = ctx.entityRefs ?? {};
  switch (ctx.kind) {
    case "register_farmer":
      return refs.farmer_id ? `${OPERATIONAL_SUBMISSION_TYPES.farmerRegistration}:${refs.farmer_id}` : null;
    case "farm_inspection":
      return refs.visit_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.fieldInspection}:${refs.visit_id}`
        : refs.farmer_id
          ? `${OPERATIONAL_SUBMISSION_TYPES.fieldInspection}:farmer:${refs.farmer_id}:${refs.captured_at ?? "ts"}`
          : null;
    case "gps_field_evidence":
      return refs.geo_location_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.gpsVerification}:${refs.geo_location_id}`
        : refs.farmer_id
          ? `${OPERATIONAL_SUBMISSION_TYPES.gpsVerification}:${refs.farmer_id}:${refs.latitude}:${refs.longitude}`
          : null;
    case "pest_disease_report":
      return refs.field_report_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.pestDiseaseAlert}:${refs.field_report_id}`
        : null;
    case "production_estimate":
      return refs.production_record_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.harvestReport}:${refs.production_record_id}`
        : null;
    case "subsidy_delivery_verify":
      return refs.distribution_log_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.inputDistribution}:${refs.distribution_log_id}`
        : null;
    case "farm_boundary_capture":
      return refs.plot_client_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.farmBoundary}:plot:${refs.plot_client_id}`
        : refs.farmer_id
          ? `${OPERATIONAL_SUBMISSION_TYPES.farmBoundary}:${refs.farmer_id}:${refs.captured_at ?? "ts"}`
          : null;
    case "warehouse_transfer":
      return refs.movement_id
        ? `${OPERATIONAL_SUBMISSION_TYPES.warehouseTransfer}:${refs.movement_id}`
        : null;
    default:
      return refs.source_id ? `moa_survey:${ctx.kind}:${refs.source_id}` : null;
  }
}

function submissionTypeForKind(kind: WorkflowPersistContext["kind"]): string | null {
  switch (kind) {
    case "register_farmer":
      return OPERATIONAL_SUBMISSION_TYPES.farmerRegistration;
    case "farm_inspection":
      return OPERATIONAL_SUBMISSION_TYPES.fieldInspection;
    case "gps_field_evidence":
      return OPERATIONAL_SUBMISSION_TYPES.gpsVerification;
    case "pest_disease_report":
      return OPERATIONAL_SUBMISSION_TYPES.pestDiseaseAlert;
    case "production_estimate":
      return OPERATIONAL_SUBMISSION_TYPES.harvestReport;
    case "subsidy_delivery_verify":
      return OPERATIONAL_SUBMISSION_TYPES.inputDistribution;
    case "farm_boundary_capture":
      return OPERATIONAL_SUBMISSION_TYPES.farmBoundary;
    case "warehouse_transfer":
      return OPERATIONAL_SUBMISSION_TYPES.warehouseTransfer;
    case "farmer_verification":
      return OPERATIONAL_SUBMISSION_TYPES.farmerRegistration;
    default:
      if (String(kind).startsWith("dao_") || String(kind).startsWith("cac_") || String(kind).startsWith("clan_")) {
        return OPERATIONAL_SUBMISSION_TYPES.fieldReport;
      }
      return null;
  }
}

function titleForContext(ctx: WorkflowPersistContext): string {
  const p = ctx.payload;
  switch (ctx.kind) {
    case "register_farmer":
      return `Farmer registration · ${String(p.full_name ?? "household").trim()}`;
    case "farm_inspection":
      return `Field inspection · farmer ${String(p.farmer_id ?? refsLabel(ctx)).slice(0, 8)}…`;
    case "gps_field_evidence":
      return `GPS field evidence · farmer ${String(p.farmer_id ?? "").slice(0, 8)}…`;
    case "pest_disease_report":
      return `Pest / disease report · ${String(p.pest_type ?? "alert")}`;
    case "production_estimate":
      return `Harvest estimate · ${String(p.season ?? "season")}`;
    case "subsidy_delivery_verify":
      return `Input distribution · farmer ${String(p.farmer_id ?? "").slice(0, 8)}…`;
    case "farm_boundary_capture":
      return `Farm boundary · farmer ${String(p.farmer_id ?? refsLabel(ctx)).slice(0, 8)}…`;
    case "warehouse_transfer":
      return `Warehouse transfer · ${String(p.reference ?? "corridor")}`;
    default:
      return `Operational submission · ${ctx.kind.replace(/_/g, " ")}`;
  }
}

function refsLabel(ctx: WorkflowPersistContext): string {
  return ctx.entityRefs?.farmer_id ?? "—";
}

function summaryForContext(ctx: WorkflowPersistContext): string | undefined {
  const p = ctx.payload;
  if (ctx.kind === "register_farmer") {
    const county = String(p.county ?? "").trim();
    const district = String(p.district ?? "").trim();
    return [county, district].filter(Boolean).join(" · ") || undefined;
  }
  if (ctx.kind === "production_estimate" && p.expected_yield_kg != null) {
    return `Expected yield ${p.expected_yield_kg} kg`;
  }
  if (ctx.kind === "subsidy_delivery_verify" && p.quantity != null) {
    return `Quantity ${p.quantity}`;
  }
  return undefined;
}

/**
 * Creates (or deduplicates) an `operational_submissions` row after domain persist.
 * Best-effort: never throws; returns null when skipped or failed.
 */
export async function ensureOperationalSubmission(ctx: WorkflowPersistContext): Promise<string | null> {
  const submissionType = submissionTypeForKind(ctx.kind);
  if (!submissionType) return null;

  const dedupe_key = buildWorkflowDedupeKey(ctx);
  const county = typeof ctx.payload.county === "string" ? ctx.payload.county.trim() || undefined : undefined;
  const district = typeof ctx.payload.district === "string" ? ctx.payload.district.trim() || undefined : undefined;

  const res = await postWorkflowAction({
    action: "submit",
    create: {
      submissionType,
      title: titleForContext(ctx),
      summary: summaryForContext(ctx),
      county,
      district,
      metadata: {
        dedupe_key,
        source_kind: ctx.kind,
        entity_refs: ctx.entityRefs ?? {},
        payload_snapshot: sanitizeSnapshot(ctx.payload),
      },
    },
  });

  if (!res.ok) {
    console.warn("[workflow-bridge] submission create failed", res.message);
    return null;
  }
  return res.submission.id;
}

/** Strip heavy geometry from workflow metadata snapshots. */
function sanitizeSnapshot(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === "operational_boundary" && v && typeof v === "object") {
      const b = v as Record<string, unknown>;
      out[k] = {
        areaHectares: b.areaHectares,
        capturedAt: b.capturedAt,
        pointCount: Array.isArray(b.capturedPoints) ? b.capturedPoints.length : null,
      };
    } else if (k !== "boundary_geometry" && k !== "boundary_points") {
      out[k] = v;
    }
  }
  return out;
}

/** Secondary boundary submission when inspection or registration includes GIS capture. */
export async function ensureFarmBoundarySubmission(
  payload: Record<string, unknown>,
  entityRefs: Record<string, string>,
): Promise<string | null> {
  return ensureOperationalSubmission({
    kind: "farm_boundary_capture",
    payload,
    entityRefs,
  });
}
