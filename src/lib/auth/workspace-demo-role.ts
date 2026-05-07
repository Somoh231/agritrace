import type { Profile, UserRole } from "@/lib/supabase/types";

/** Cookie used only for UI/workspace preview (navigation + route guards). Does not change Supabase RLS. */
export const WORKSPACE_DEMO_ROLE_COOKIE = "ais_workspace_demo_role";

/** Roles exposed in the workspace preview switcher */
export const WORKSPACE_PREVIEW_ROLES: UserRole[] = [
  "ministry_officer",
  "county_officer",
  "district_officer",
  "warehouse_manager",
  "auditor",
  "admin",
];

export function parseWorkspaceDemoRole(raw: string | null | undefined): UserRole | null {
  if (!raw?.trim()) return null;
  const v = raw.trim() as UserRole;
  return WORKSPACE_PREVIEW_ROLES.includes(v) ? v : null;
}

export function applyWorkspaceDemoRoleToProfile(profile: Profile, cookieValue: string | null | undefined): Profile {
  const r = parseWorkspaceDemoRole(cookieValue ?? undefined);
  if (!r) return profile;
  return { ...profile, role: r };
}
