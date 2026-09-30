import { assignedWorkspaceRoles, presentedWorkspaceRole } from "@/lib/auth/workspace-demo-role";
import type { Profile, UserRole } from "@/lib/supabase/types";

/**
 * Role used for server-side workspace routing. Always one of the user's own
 * assigned roles (today: their single profile role); the preview cookie can only
 * pick among those, so it never widens access. Returns `null` when the user has
 * no usable profile.
 */
export function resolveEffectiveWorkspaceRole(
  profile: (Pick<Profile, "role"> & Partial<Pick<Profile, "is_active">>) | null | undefined,
  cookieValue: string | null | undefined,
): UserRole | null {
  return presentedWorkspaceRole(assignedWorkspaceRoles(profile), cookieValue);
}
