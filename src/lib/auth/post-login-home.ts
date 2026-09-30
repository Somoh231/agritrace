import {
  canAccessCountyDashboard,
  canAccessDistrictDashboard,
  canAccessNationalCommandCenter,
} from "@/lib/auth/workspace-access";
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
      return "/district-dashboard";
    case "clan_technician":
    case "field_agent":
      return "/workspace/clan";
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
      // Capture support, not a reviewer (ADR 0012 §A).
      return "/farmers";
    default:
      return "/command-center";
  }
}

/*
 * Layout checks delegate to the middleware route policy so the two can never
 * disagree (ADR 0012 §A).
 */
export function mayAccessNationalCommandCenter(role: UserRole): boolean {
  return canAccessNationalCommandCenter(role);
}

export function mayAccessCountyDashboard(role: UserRole): boolean {
  return canAccessCountyDashboard(role);
}

export function mayAccessDistrictDashboard(role: UserRole): boolean {
  return canAccessDistrictDashboard(role);
}
