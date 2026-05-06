/**
 * TEMP DEMO FALLBACK — remove after live demo meeting.
 *
 * When `profiles` has no row for the signed-in user, the app uses this stand-in so the
 * dashboard and admin UI keep working without seeding data.
 */
import type { Profile, UserRole } from "@/lib/supabase/types";

/** Literal demo identity spec (auth user id still comes from Supabase Auth). */
export const DEMO_PROFILE_FALLBACK = {
  id: "demo-admin",
  email: "msdonzo@agrivaultdata.com",
  role: "admin",
  full_name: "Demo Admin",
} as const;

export function buildDemoProfileForAuthUser(authUser: { id: string; email?: string | null }): Profile {
  // TEMP DEMO FALLBACK
  return {
    id: authUser.id,
    full_name: DEMO_PROFILE_FALLBACK.full_name,
    role: DEMO_PROFILE_FALLBACK.role as UserRole,
    organization_id: null,
    county: null,
    phone: null,
    is_active: true,
    created_at: new Date(0).toISOString(),
  };
}

/** Use DB role when present; otherwise TEMP DEMO FALLBACK role for missing profile rows. */
export function resolveUserRoleWithDemoFallback(
  profile: { role: UserRole } | null | undefined,
  authUser: { id: string; email?: string | null },
): UserRole {
  if (profile?.role) return profile.role;
  // TEMP DEMO FALLBACK
  return buildDemoProfileForAuthUser(authUser).role;
}
