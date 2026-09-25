import type { Profile, UserRole } from "@/lib/supabase/types";

/**
 * Where a signed-in user without a usable AgriVault profile is sent. Lives
 * outside the protected dashboard, so it can never redirect back into it.
 */
export const ACCOUNT_UNAVAILABLE_PATH = "/account-unavailable";

type ProfileForAccess = Pick<Profile, "role"> & Partial<Pick<Profile, "is_active">>;

/**
 * The role a signed-in user may act with, or `null` when access must be denied:
 * no profile row, a profile without a role, a failed lookup (callers pass the
 * query's `data`, which is `null` on error), or a deactivated profile.
 *
 * There is deliberately no fallback role. A missing profile never grants access.
 */
export function roleFromProfile(profile: ProfileForAccess | null | undefined): UserRole | null {
  if (!profile?.role) return null;
  if (profile.is_active === false) return null;
  return profile.role;
}
