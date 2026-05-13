import type { UserRole } from "@/lib/supabase/types";

/** Default workspace after authentication for each ministry role. */
export function postLoginHomeForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
    case "ministry_admin":
    case "ministry_officer":
    case "government_officer":
      return "/command-center";
    case "county_agriculture_coordinator":
    case "county_officer":
      return "/county-dashboard";
    case "dao_officer":
    case "district_officer":
    case "clan_technician":
    case "field_agent":
      return "/district-dashboard";
    case "warehouse_manager":
      return "/inventory";
    case "donor_observer":
    case "donor_partner":
      return "/donor-dashboard";
    case "auditor":
      return "/audit-tools";
    case "exporter":
      return "/cocoa/lots";
    case "cooperative_manager":
      return "/farmers";
    case "call_center_agent":
      return "/verification-queue";
    default:
      return "/command-center";
  }
}

/** Roles permitted to open the national command center route. */
export function mayAccessNationalCommandCenter(role: UserRole): boolean {
  if (role === "donor_partner" || role === "donor_observer" || role === "auditor") return false;
  if (
    role === "ministry_admin" ||
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "super_admin" ||
    role === "admin"
  ) {
    return true;
  }
  if (role === "exporter" || role === "cooperative_manager" || role === "call_center_agent") {
    return true;
  }
  return false;
}

export function mayAccessCountyDashboard(role: UserRole): boolean {
  return (
    role === "county_agriculture_coordinator" ||
    role === "county_officer" ||
    role === "ministry_admin" ||
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "super_admin" ||
    role === "admin"
  );
}

export function mayAccessDistrictDashboard(role: UserRole): boolean {
  return (
    role === "dao_officer" ||
    role === "district_officer" ||
    role === "clan_technician" ||
    role === "field_agent" ||
    role === "county_agriculture_coordinator" ||
    role === "county_officer" ||
    role === "ministry_admin" ||
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "super_admin" ||
    role === "admin"
  );
}
