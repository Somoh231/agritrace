import { roleFromProfile } from "@/lib/auth/profile-access";
import { parseWorkspaceDemoRole } from "@/lib/auth/workspace-demo-role";
import type { Profile, UserRole } from "@/lib/supabase/types";

/**
 * Database-backed role merged with optional workspace preview cookie (server-side).
 * Returns `null` when the user has no usable profile; the preview cookie never
 * stands in for a missing profile.
 */
export function resolveEffectiveWorkspaceRole(
  profile: Pick<Profile, "role"> | null | undefined,
  cookieValue: string | null | undefined,
): UserRole | null {
  const base = roleFromProfile(profile);
  if (!base) return null;
  return parseWorkspaceDemoRole(cookieValue) ?? base;
}
