import type { UserRole } from "@/lib/supabase/types";

/**
 * Authorization rules for administrative profile changes (PATCH /api/admin/users).
 * Pure and unit-tested (src/lib/auth/__tests__/profile-update-policy.spec.ts).
 * The route runs with the service-role client, which bypasses RLS and the
 * profiles trigger, so these rules are the enforcement point.
 */

/** Every role an administrator may assign. Anything else is rejected. */
export const ASSIGNABLE_ROLES: readonly UserRole[] = [
  "super_admin",
  "admin",
  "ministry_admin",
  "ministry_officer",
  "government_officer",
  "county_agriculture_coordinator",
  "county_officer",
  "dao_officer",
  "district_officer",
  "clan_technician",
  "field_agent",
  "cooperative_manager",
  "warehouse_manager",
  "donor_observer",
  "donor_partner",
  "exporter",
  "call_center_agent",
  "auditor",
];

/** Roles with national, administrative or institution-wide reach. Only super_admin may grant them. */
export const PRIVILEGED_ROLES: readonly UserRole[] = ["super_admin", "admin", "ministry_admin", "ministry_officer", "government_officer"];

/** Roles allowed to change other users' profiles at all. */
export const PROFILE_ADMIN_ROLES: readonly UserRole[] = ["super_admin"];

export type ProfileUpdateInput = {
  actor: { id: string; role: UserRole };
  target: { id: string; role: UserRole | null; is_active: boolean | null };
  patch: { role?: unknown; is_active?: unknown };
  /** Active super_admin profiles, counted server-side before the change. */
  activeSuperAdmins: number;
};

export type ProfileUpdateDecision = { ok: true } | { ok: false; status: 400 | 403 | 409; reason: string };

export function isAssignableRole(v: unknown): v is UserRole {
  return typeof v === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(v);
}

export function authorizeProfileUpdate(input: ProfileUpdateInput): ProfileUpdateDecision {
  const { actor, target, patch, activeSuperAdmins } = input;

  if (!PROFILE_ADMIN_ROLES.includes(actor.role)) {
    return { ok: false, status: 403, reason: "Only a super administrator can change user profiles." };
  }

  const roleChange = typeof patch.role !== "undefined";
  if (roleChange && !isAssignableRole(patch.role)) {
    return { ok: false, status: 400, reason: "Unknown role." };
  }
  const nextRole = roleChange ? (patch.role as UserRole) : target.role;
  const changesRole = roleChange && nextRole !== target.role;

  if (typeof patch.is_active !== "undefined" && typeof patch.is_active !== "boolean") {
    return { ok: false, status: 400, reason: "is_active must be true or false." };
  }
  const deactivates = patch.is_active === false && target.is_active !== false;

  if (target.id === actor.id && changesRole) {
    return { ok: false, status: 403, reason: "You cannot change your own role." };
  }
  if (target.id === actor.id && deactivates) {
    return { ok: false, status: 403, reason: "You cannot deactivate your own account." };
  }

  if (changesRole && PRIVILEGED_ROLES.includes(nextRole as UserRole) && actor.role !== "super_admin") {
    return { ok: false, status: 403, reason: "Only a super administrator can assign privileged roles." };
  }

  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { ok: false, status: 403, reason: "Only a super administrator can modify a super administrator." };
  }

  const removesActiveSuperAdmin =
    target.role === "super_admin" && target.is_active !== false && ((changesRole && nextRole !== "super_admin") || deactivates);
  if (removesActiveSuperAdmin && activeSuperAdmins <= 1) {
    return { ok: false, status: 409, reason: "The last active super administrator cannot be demoted or deactivated." };
  }

  return { ok: true };
}
