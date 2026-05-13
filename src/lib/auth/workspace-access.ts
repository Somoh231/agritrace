import type { UserRole } from "@/lib/supabase/types";

import {
  isClanFieldRole,
  isCountyCoordinatorRole,
  isDaoDistrictRole,
  isDonorObserverRole,
  isMinistryNationalRole,
} from "@/lib/auth/operational-roles";

export type PilotWorkspaceId = "clan" | "dao" | "cac" | "ministry";

/** Aligns with operational workspace nav: who may open each hub. */
export function canAccessPilotWorkspace(role: UserRole, workspace: PilotWorkspaceId): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  const clanDaoDesk =
    isClanFieldRole(role) || isDaoDistrictRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
  switch (workspace) {
    case "clan":
    case "dao":
      return clanDaoDesk;
    case "cac":
      return isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
    case "ministry":
      return isMinistryNationalRole(role);
    default:
      return false;
  }
}

/** Safe redirect after a workspace access denial (no new routes). */
export function pilotRoleLandingPath(role: UserRole): string {
  if (isDonorObserverRole(role)) return "/donor-dashboard";
  if (role === "auditor") return "/audit-tools";
  if (isMinistryNationalRole(role)) return "/command-center";
  if (isCountyCoordinatorRole(role)) return "/county-dashboard";
  if (isDaoDistrictRole(role)) return "/district-dashboard";
  if (isClanFieldRole(role)) return "/field/mobile";
  if (role === "warehouse_manager") return "/inventory";
  if (role === "cooperative_manager") return "/cooperatives";
  return "/district-dashboard";
}

export function assertPilotWorkspaceAccess(
  role: UserRole,
  workspace: PilotWorkspaceId,
): { ok: true } | { ok: false; redirectTo: string } {
  if (canAccessPilotWorkspace(role, workspace)) return { ok: true };
  return { ok: false, redirectTo: pilotRoleLandingPath(role) };
}
