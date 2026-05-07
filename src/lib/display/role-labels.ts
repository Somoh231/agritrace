import type { UserRole } from "@/lib/supabase/types";

/** Sovereign ministry-facing labels (database roles unchanged). */
export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case "ministry_officer":
    case "government_officer":
      return "Ministry officer";
    case "county_officer":
      return "County agriculture officer (CAO)";
    case "district_officer":
      return "District agriculture officer (DAO)";
    case "field_agent":
      return "District agriculture officer (DAO)";
    case "warehouse_manager":
      return "Warehouse manager";
    case "donor_partner":
      return "Donor partner";
    case "auditor":
      return "Donor / auditor";
    case "super_admin":
      return "System administrator";
    case "admin":
      return "Administrator";
    case "exporter":
      return "Exporter";
    case "cooperative_manager":
      return "Cooperative manager";
    case "call_center_agent":
      return "Call center";
    default: {
      const r = role as string;
      return r.replace(/_/g, " ");
    }
  }
}
