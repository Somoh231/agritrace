import type { DaoWorkflowKind } from "@/lib/dao/dao-workflow-types";

/** Hierarchical reporting / approval chain (payload; ministry systems may mirror). */
export type MoaWorkflowStatus =
  | "draft"
  | "saved_offline"
  | "pending_submission"
  | "submitted"
  | "under_dao_review"
  | "under_cac_verification"
  | "escalated"
  | "verified"
  | "archived";

export type MoaEvidenceVerificationStatus = "pending" | "verified" | "flagged";

export const MOA_OPERATIONAL_SURVEY_KINDS = [
  "clan_crop_monitoring",
  "clan_field_activity_report",
  "dao_district_summary",
  "dao_operational_review",
  "dao_verification_review",
  "dao_district_escalation",
  "cac_county_operational_summary",
  "cac_county_verification",
  "cac_county_escalation",
  "cac_reporting_compliance",
] as const satisfies readonly DaoWorkflowKind[];

export type MoaOperationalSurveyKind = (typeof MOA_OPERATIONAL_SURVEY_KINDS)[number];

export function isMoaOperationalSurveyKind(k: DaoWorkflowKind): k is MoaOperationalSurveyKind {
  return (MOA_OPERATIONAL_SURVEY_KINDS as readonly DaoWorkflowKind[]).includes(k);
}

/** Ministry sample–aligned operational survey envelope (JSON-safe). */
export type MoaOperationalSurveyPayload = {
  schema_version: 1;
  report_kind: MoaOperationalSurveyKind;
  workflow_status: MoaWorkflowStatus;
  /** Officer identity (enumerator / reviewer) */
  officer_display_name?: string | null;
  officer_role_label?: string | null;
  /** Geographic scope */
  county: string;
  district?: string | null;
  clan_or_community?: string | null;
  /** Farmer (registry conventions e.g. NIM-0001) */
  farmer_registry_id?: string | null;
  farmer_full_name?: string | null;
  farmer_phone?: string | null;
  /** Farm / plot */
  farm_plot_label?: string | null;
  main_crop?: string | null;
  area_hectares_reported?: string | null;
  /** GPS */
  gps_latitude?: string | null;
  gps_longitude?: string | null;
  gps_accuracy_m?: string | null;
  gps_captured_at?: string | null;
  operational_boundary_ref?: string | null;
  /** Photos / evidence (URLs or ministry media ids until bucket wiring) */
  evidence_farm_photo_refs?: string | null;
  evidence_officer_photo_refs?: string | null;
  evidence_verification_status?: MoaEvidenceVerificationStatus;
  /** Crop monitoring */
  crop_growth_stage?: string | null;
  crop_stress_notes?: string | null;
  /** Inputs */
  inputs_distributed?: "yes" | "no" | "";
  input_type?: string | null;
  input_quantity?: string | null;
  input_unit?: string | null;
  /** Pest / disease */
  pest_issue_observed?: "yes" | "no" | "";
  pest_type?: string | null;
  pest_severity?: string | null;
  pest_affected_area_ha?: string | null;
  /** Warehouse */
  warehouse_linked?: "yes" | "no" | "";
  warehouse_ministry_code?: string | null;
  /** Subsidy (conditional narrative) */
  subsidy_distributed?: "yes" | "no" | "";
  subsidy_notes?: string | null;
  /** Closing */
  operational_notes?: string | null;
  verification_status?: string | null;
  submitted_at_client?: string | null;
};

export function emptyMoaSurveyPayload(
  kind: MoaOperationalSurveyKind,
  defaults: { county?: string | null; district?: string | null; officerName?: string | null; officerRole?: string | null },
): MoaOperationalSurveyPayload {
  return {
    schema_version: 1,
    report_kind: kind,
    workflow_status: "draft",
    county: (defaults.county ?? "").trim() || "",
    district: defaults.district?.trim() || null,
    clan_or_community: null,
    officer_display_name: defaults.officerName?.trim() || null,
    officer_role_label: defaults.officerRole?.trim() || null,
    evidence_verification_status: "pending",
    inputs_distributed: "",
    pest_issue_observed: "",
    warehouse_linked: "",
    subsidy_distributed: "",
  };
}

export function buildFieldReportSummary(kind: MoaOperationalSurveyKind, p: MoaOperationalSurveyPayload): string {
  const crop = p.main_crop?.trim() || "—";
  const reg = p.farmer_registry_id?.trim() || "";
  const tail = reg ? ` · ${reg}` : "";
  switch (kind) {
    case "clan_crop_monitoring":
      return `MoA crop monitoring · ${p.county}${p.district ? ` / ${p.district}` : ""} · ${crop}${tail}`;
    case "clan_field_activity_report":
      return `MoA field activity · ${p.county}${p.district ? ` / ${p.district}` : ""}${tail}`;
    case "dao_district_summary":
      return `DAO district summary · ${p.county}${p.district ? ` / ${p.district}` : ""}`;
    case "dao_operational_review":
      return `DAO operational review · ${p.county}${p.district ? ` / ${p.district}` : ""}`;
    case "dao_verification_review":
      return `DAO verification review · ${p.county}${p.district ? ` / ${p.district}` : ""}`;
    case "dao_district_escalation":
      return `DAO district escalation · ${p.county}${p.district ? ` / ${p.district}` : ""}`;
    case "cac_county_operational_summary":
      return `CAC county operational summary · ${p.county}`;
    case "cac_county_verification":
      return `CAC county verification · ${p.county}`;
    case "cac_county_escalation":
      return `CAC county escalation · ${p.county}`;
    case "cac_reporting_compliance":
      return `CAC reporting compliance · ${p.county}`;
    default:
      return `MoA operational report · ${p.county}`;
  }
}
