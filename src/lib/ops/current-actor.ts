import type { OperationalActor, OperationalPersona } from "@/lib/ops/permissions";
import type { Profile, UserRole } from "@/lib/supabase/types";

/** Fallback actor when no authenticated profile is wired into React context (should not occur inside dashboard shell). */
export function demoOperationalActor(): OperationalActor {
  return {
    id: "demo-national-admin",
    displayName: "National Admin",
    role: "national_admin",
    county: null,
    warehouseMinistryCode: null,
  };
}

export function mapUserRoleToOperationalPersona(role: UserRole): OperationalPersona {
  switch (role) {
    case "super_admin":
    case "admin":
    case "ministry_officer":
    case "government_officer":
      return "national_admin";
    case "county_officer":
      return "county_supervisor";
    case "district_officer":
    case "field_agent":
      return "dao_officer";
    case "warehouse_manager":
      return "warehouse_manager";
    case "donor_partner":
      return "donor_observer";
    case "auditor":
      return "investigation_officer";
    default:
      return "donor_observer";
  }
}

export function resolveOperationalActor(profile: Pick<Profile, "id" | "full_name" | "role" | "county">): OperationalActor {
  return {
    id: profile.id,
    displayName: profile.full_name?.trim() || "Operator",
    role: mapUserRoleToOperationalPersona(profile.role),
    county: profile.county,
    warehouseMinistryCode: null,
  };
}
