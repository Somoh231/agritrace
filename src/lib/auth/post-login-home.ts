import type { UserRole } from "@/lib/supabase/types";

/** Default workspace after authentication for each ministry role. */
export function postLoginHomeForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
    case "ministry_officer":
    case "government_officer":
      return "/command-center";
    case "county_officer":
      return "/county-dashboard";
    case "district_officer":
    case "field_agent":
      return "/district-dashboard";
    case "warehouse_manager":
      return "/inventory";
    case "donor_partner":
    case "auditor":
      return "/reports/ministry";
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
  if (role === "donor_partner" || role === "auditor") return false;
  if (
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
    role === "county_officer" ||
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "super_admin" ||
    role === "admin"
  );
}

export function mayAccessDistrictDashboard(role: UserRole): boolean {
  return (
    role === "district_officer" ||
    role === "field_agent" ||
    role === "county_officer" ||
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "super_admin" ||
    role === "admin"
  );
}
