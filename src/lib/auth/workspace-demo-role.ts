import { roleFromProfile } from "@/lib/auth/profile-access";
import type { Profile, UserRole } from "@/lib/supabase/types";

/**
 * Cookie that selects which of the user's own roles the workspace presents.
 * It is presentation only: it never grants a role, never widens route or API
 * access and never reaches the database (RLS reads profiles.role directly).
 */
export const WORKSPACE_DEMO_ROLE_COOKIE = "ais_workspace_demo_role";

/** Role labels the preview cookie may carry (anything else is ignored). */
export const WORKSPACE_PREVIEW_ROLES: UserRole[] = [
  "ministry_admin",
  "ministry_officer",
  "county_agriculture_coordinator",
  "dao_officer",
  "clan_technician",
  "county_officer",
  "district_officer",
  "warehouse_manager",
  "donor_observer",
  "auditor",
  "admin",
];

export function parseWorkspaceDemoRole(raw: string | null | undefined): UserRole | null {
  if (!raw?.trim()) return null;
  const v = raw.trim() as UserRole;
  return WORKSPACE_PREVIEW_ROLES.includes(v) ? v : null;
}

/**
 * Roles this user actually holds, validated server-side from the profile row.
 * Today every account has exactly one role (profiles.role), so this is that
 * role or nothing. A future multi-role model plugs in here.
 */
export function assignedWorkspaceRoles(
  profile: (Pick<Profile, "role"> & Partial<Pick<Profile, "is_active">>) | null | undefined,
): UserRole[] {
  const role = roleFromProfile(profile);
  return role ? [role] : [];
}

/**
 * The role the workspace should present: the cookie's choice only when it is
 * one of the user's own assigned roles, otherwise the profile role. A forged or
 * stale cookie therefore changes nothing.
 */
export function presentedWorkspaceRole(assigned: UserRole[], cookieValue: string | null | undefined): UserRole | null {
  if (!assigned.length) return null;
  const requested = parseWorkspaceDemoRole(cookieValue ?? undefined);
  return requested && assigned.includes(requested) ? requested : assigned[0];
}

export function applyWorkspaceDemoRoleToProfile(profile: Profile, cookieValue: string | null | undefined): Profile {
  const role = presentedWorkspaceRole(assignedWorkspaceRoles(profile), cookieValue);
  return role && role !== profile.role ? { ...profile, role } : profile;
}
