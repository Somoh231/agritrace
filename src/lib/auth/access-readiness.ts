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
  access_transition_status?: string | null;
  deactivated_at?: string | null;
  suspended_at?: string | null;
  has_warehouse_assignment?: boolean;
};

export type AccessRoleAssignment = {
  role: UserRole;
  is_primary: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  ended_at?: string | null;
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

export function roleRequiresWarehouseAssignment(role: UserRole): boolean {
  return role === "warehouse_manager";
}

export function assessOperationalAccess(
  profile: AccessProfile | null | undefined,
  assignments: AccessRoleAssignment[],
  now = new Date(),
): AccessReadiness {
  if (!profile) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  if (
    profile.is_active !== true ||
    profile.account_status === "inactive" ||
    profile.account_status === "suspended" ||
    profile.deactivated_at ||
    profile.suspended_at
  ) {
    return { ok: false, code: "account_inactive", message: INACTIVE_ACCOUNT_MESSAGE };
  }

  const nowMs = now.getTime();
  const currentAssignments = assignments.filter((assignment) => {
    if (assignment.ended_at) return false;
    const startsAt = assignment.starts_at ? Date.parse(assignment.starts_at) : Number.NEGATIVE_INFINITY;
    const expiresAt = assignment.expires_at ? Date.parse(assignment.expires_at) : Number.POSITIVE_INFINITY;
    return !Number.isNaN(startsAt) && !Number.isNaN(expiresAt) && startsAt <= nowMs && expiresAt > nowMs;
  });
  const roles = [...new Set(currentAssignments.map((assignment) => assignment.role))];
  if (roles.length === 0) {
    return { ok: false, code: "role_required", message: NO_AUTHORIZED_ROLE_MESSAGE };
  }

  const primaryAssignments = currentAssignments.filter((assignment) => assignment.is_primary);
  const role =
    primaryAssignments.length === 1 &&
    profile.role === primaryAssignments[0]?.role
      ? primaryAssignments[0].role
      : null;
  if (!role || !roles.includes(role)) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  if (
    profile.account_status !== "active" ||
    profile.access_transition_status !== "complete" ||
    !profile.organization_id ||
    (roleRequiresCounty(role) && !profile.county) ||
    (roleRequiresDistrict(role) && !profile.district) ||
    (roleRequiresClanOrFieldArea(role) && !profile.clan_or_field_area) ||
    (roleRequiresWarehouseAssignment(role) && !profile.has_warehouse_assignment)
  ) {
    return { ok: false, code: "profile_incomplete", message: INCOMPLETE_PROFILE_MESSAGE };
  }

  return { ok: true, role, roles, multipleRoles: roles.length > 1 };
}
