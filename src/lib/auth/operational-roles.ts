import type { UserRole } from "@/lib/supabase/types";

/**
 * Ministry of Agriculture Liberia — operational chain:
 * CLAN (field) → DAO (district) → CAC (county) → Ministry / national.
 *
 * Canonical enum values added in Supabase coexist with legacy aliases for RLS compatibility.
 */

export const CLAN_FIELD_ROLES: UserRole[] = ["clan_technician", "field_agent"];

export const DAO_DISTRICT_ROLES: UserRole[] = ["dao_officer", "district_officer"];

export const CAC_COUNTY_ROLES: UserRole[] = ["county_agriculture_coordinator", "county_officer"];

export const MINISTRY_NATIONAL_ROLES: UserRole[] = [
  "ministry_admin",
  "ministry_officer",
  "government_officer",
  "super_admin",
  "admin",
];

export const DONOR_VISIBILITY_ROLES: UserRole[] = ["donor_observer", "donor_partner"];

export function isClanFieldRole(role: UserRole | null | undefined): boolean {
  return role != null && CLAN_FIELD_ROLES.includes(role);
}

export function isDaoDistrictRole(role: UserRole | null | undefined): boolean {
  return role != null && DAO_DISTRICT_ROLES.includes(role);
}

export function isCountyCoordinatorRole(role: UserRole | null | undefined): boolean {
  return role != null && CAC_COUNTY_ROLES.includes(role);
}

export function isMinistryNationalRole(role: UserRole | null | undefined): boolean {
  return role != null && MINISTRY_NATIONAL_ROLES.includes(role);
}

export function isDonorObserverRole(role: UserRole | null | undefined): boolean {
  return role != null && DONOR_VISIBILITY_ROLES.includes(role);
}

/** DAO workspace (district oversight + CLAN capture tools). */
export function isDaoWorkspaceRole(role: UserRole | null | undefined): boolean {
  return isDaoDistrictRole(role) || isClanFieldRole(role);
}

/** County CAC workspace entry. */
export function isCacWorkspaceRole(role: UserRole | null | undefined): boolean {
  return isCountyCoordinatorRole(role);
}

export function daoReviewReadOnly(role: UserRole | null | undefined): boolean {
  return isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}
