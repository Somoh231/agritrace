import {
  isClanFieldRole,
  isCountyCoordinatorRole,
  isDaoDistrictRole,
} from "@/lib/auth/operational-roles";
import type { UserRole } from "@/lib/supabase/types";

export const INACTIVE_ACCOUNT_MESSAGE =
  "This account is inactive. Contact your system administrator.";
export const INCOMPLETE_PROFILE_MESSAGE =
  "Your identity was verified, but your AgriVault access profile is incomplete. Contact your system administrator.";
export const NO_AUTHORIZED_ROLE_MESSAGE =
  "Your account does not currently have an authorized AgriVault role.";

export type AccessProfile = {
  role?: UserRole | null;
  organization_id?: string | null;
  county?: string | null;
  district?: string | null;
  clan_or_field_area?: string | null;
  is_active?: boolean | null;
  account_status?: string | null;
};

export type AccessReadiness =
  | { ok: true; role: UserRole; roles: UserRole[]; multipleRoles: boolean }
  | {
      ok: false;
      code: "account_inactive" | "profile_incomplete" | "role_required";
      message: string;
    };

export function roleRequiresCounty(role: UserRole): boolean {
  return isClanFieldRole(role) || isDaoDistrictRole(role) || isCountyCoordinatorRole(role);
}

export function roleRequiresDistrict(role: UserRole): boolean {
  return isClanFieldRole(role) || isDaoDistrictRole(role);
}

export function roleRequiresClanOrFieldArea(role: UserRole): boolean {
  return isClanFieldRole(role);
}

export function assessOperationalAccess(
  profile: AccessProfile | null | undefined,
  assignedRoles: UserRole[],
): AccessReadiness {
  if (!profile) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  if (profile.is_active === false || profile.account_status === "inactive") {
    return { ok: false, code: "account_inactive", message: INACTIVE_ACCOUNT_MESSAGE };
  }

  const roles = [...new Set(assignedRoles)];
  if (roles.length === 0) {
    return { ok: false, code: "role_required", message: NO_AUTHORIZED_ROLE_MESSAGE };
  }

  const role = profile.role && roles.includes(profile.role) ? profile.role : null;
  if (!role) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  if (
    (profile.account_status && profile.account_status !== "active") ||
    !profile.organization_id ||
    (roleRequiresCounty(role) && !profile.county) ||
    (roleRequiresDistrict(role) && !profile.district) ||
    (roleRequiresClanOrFieldArea(role) && !profile.clan_or_field_area)
  ) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  return { ok: true, role, roles, multipleRoles: roles.length > 1 };
}
