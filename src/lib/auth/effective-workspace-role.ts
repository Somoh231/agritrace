import { parseWorkspaceDemoRole } from "@/lib/auth/workspace-demo-role";
import type { Profile, UserRole } from "@/lib/supabase/types";

/** Database-backed role merged with optional workspace preview cookie (server-side). */
export function resolveEffectiveWorkspaceRole(
  profile: Pick<Profile, "role">,
  cookieValue: string | null | undefined,
): UserRole {
  return parseWorkspaceDemoRole(cookieValue) ?? profile.role;
}
