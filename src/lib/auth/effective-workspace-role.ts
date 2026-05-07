import { parseWorkspaceDemoRole } from "@/lib/auth/workspace-demo-role";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile, UserRole } from "@/lib/supabase/types";

/** Database-backed role merged with optional workspace preview cookie (server-side). */
export function resolveEffectiveWorkspaceRole(
  profile: Pick<Profile, "role"> | null | undefined,
  authUser: { id: string; email?: string | null },
  cookieValue: string | null | undefined,
): UserRole {
  const base = resolveUserRoleWithDemoFallback(profile ?? undefined, authUser);
  return parseWorkspaceDemoRole(cookieValue) ?? base;
}
