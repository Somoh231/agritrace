/** Matches `public.user_role` enum in Supabase migrations. */
export type UserRole =
  | "super_admin"
  | "admin" // TEMP DEMO FALLBACK — synthetic when profiles row missing; also assignable for service accounts
  | "ministry_admin"
  | "ministry_officer"
  | "government_officer" // legacy alias — prefer ministry_officer or ministry_admin for new profiles
  | "county_agriculture_coordinator"
  | "county_officer"
  | "dao_officer"
  | "district_officer"
  | "clan_technician"
  | "cooperative_manager"
  | "field_agent"
  | "warehouse_manager"
  | "donor_observer"
  | "donor_partner"
  | "exporter"
  | "call_center_agent"
  | "auditor";

export type OrgType =
  | "cooperative"
  | "exporter"
  | "government"
  | "ngo"
  | "certifier";

export type LocationType =
  | "collection_point"
  | "warehouse"
  | "processing_facility"
  | "export_port"
  | "farm_gate";

export type CommodityType =
  | "cocoa"
  | "rice"
  | "rubber"
  | "palm_oil"
  | "coffee";

export type LotStatus =
  | "created"
  | "in_transit"
  | "at_warehouse"
  | "processed"
  | "exported"
  | "rejected";

export type MovementStatus = "dispatched" | "in_transit" | "received" | "disputed";

export type ComplianceStatus =
  | "unchecked"
  | "compliant"
  | "non_compliant"
  | "pending_verification";

export interface Profile {
  id: string;
  email?: string | null;
  full_name: string;
  role: UserRole;
  organization_id: string | null;
  county: string | null;
  district?: string | null;
  phone: string | null;
  is_active?: boolean;
  deactivated_at?: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  country: string;
  county: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  license_number: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  organization_id: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Farmer {
  id: string;
  client_id?: string | null;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  gender: string | null;
  organization_id: string | null;
  county: string;
  district: string | null;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  registration_date: string;
  registered_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Plot {
  id: string;
  client_id?: string | null;
  farmer_id: string;
  commodity: CommodityType;
  area_hectares: number | null;
  polygon_geojson: Record<string, unknown> | null;
  center_latitude: number | null;
  center_longitude: number | null;
  land_tenure: string | null;
  water_source?: "rain_fed" | "irrigated" | "both" | string | null;
  years_farming_plot?: number | null;
  participated_programmes?: boolean | null;
  planting_year: number | null;
  deforestation_check_status: "pending" | "clear" | "flagged";
  deforestation_check_date: string | null;
  deforestation_check_notes: string | null;
  county: string | null;
  district: string | null;
  village: string | null;
  created_at: string;
  registered_by: string | null;
}

export type LotExportApprovalStatus = "none" | "pending" | "approved" | "rejected";

export interface Lot {
  id: string;
  lot_code: string;
  commodity: CommodityType;
  origin_location_id: string | null;
  organization_id: string | null;
  weight_kg_in: number;
  weight_kg_current: number;
  moisture_content: number | null;
  quality_grade: string | null;
  status: LotStatus;
  season: string | null;
  farmer_group_ids: string[] | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  export_approval_status?: LotExportApprovalStatus;
  export_approved_by?: string | null;
  export_approved_at?: string | null;
}

export type VarianceReviewStatus = "not_required" | "pending" | "approved" | "rejected";

export interface Movement {
  id: string;
  client_id?: string | null;
  lot_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  weight_kg_dispatched: number;
  weight_kg_received: number | null;
  weight_variance_kg: number | null;
  dispatched_at: string | null;
  received_at: string | null;
  transport_mode: string | null;
  vehicle_id: string | null;
  driver_name: string | null;
  dispatched_by: string | null;
  received_by: string | null;
  status: MovementStatus;
  notes: string | null;
  created_at: string;
  receiver_confirmed_at?: string | null;
  receiver_confirmed_by?: string | null;
  variance_review_status?: VarianceReviewStatus;
  variance_reviewed_by?: string | null;
  variance_reviewed_at?: string | null;
}

export type DiscrepancyIssueStatus = "open" | "in_progress" | "resolved";

export interface DiscrepancyIssue {
  id: string;
  movement_id: string;
  lot_id: string | null;
  issue_type: string;
  status: DiscrepancyIssueStatus;
  assigned_to: string | null;
  title: string | null;
  notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  created_by: string | null;
}

export interface LocationInventoryOpening {
  location_id: string;
  commodity: CommodityType;
  opening_kg: number;
  effective_from?: string;
  notes?: string | null;
}

export interface RiceProductionRecord {
  id: string;
  client_id?: string | null;
  farmer_id: string;
  plot_id: string | null;
  season: string;
  planting_date: string | null;
  expected_yield_kg: number | null;
  actual_yield_kg: number | null;
  post_harvest_loss_kg: number | null;
  post_harvest_loss_cause: string | null;
  storage_location_id: string | null;
  market_destination: string | null;
  farm_gate_price_usd: number | null;
  county: string | null;
  district: string | null;
  water_source?: "rain_fed" | "irrigated" | "both" | string | null;
  years_farming_plot?: number | null;
  recorded_by: string | null;
  recorded_at: string;
  notes: string | null;
}

export interface ComplianceRecord {
  id: string;
  lot_id: string;
  standard: string;
  status: string;
  verification_method: string | null;
  verified_by: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export type DemoInquiryStatus = "new" | "contacted" | "closed";

export interface DemoInquiry {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  status: DemoInquiryStatus;
  admin_notes: string | null;
}

