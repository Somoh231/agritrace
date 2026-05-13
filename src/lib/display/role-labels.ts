import type { UserRole } from "@/lib/supabase/types";

/** Sovereign ministry-facing labels (database roles unchanged). */
export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case "ministry_admin":
      return "Ministry administrator";
    case "ministry_officer":
    case "government_officer":
      return "Ministry officer";
    case "county_agriculture_coordinator":
    case "county_officer":
      return "County Agriculture Coordinator (CAC)";
    case "dao_officer":
    case "district_officer":
      return "District Agriculture Officer (DAO)";
    case "clan_technician":
    case "field_agent":
      return "Clan Agriculture Crops Technician (CLAN)";
    case "warehouse_manager":
      return "Warehouse manager";
    case "donor_observer":
    case "donor_partner":
      return "Donor observer";
    case "auditor":
      return "Auditor";
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
