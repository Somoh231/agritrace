import type { UserRole } from "@/lib/supabase/types";

/**
 * Roles allowed to use /admin/* shell routes and admin APIs.
 * Includes legacy `government_officer` for existing seeded ministry accounts.
 * TEMP DEMO FALLBACK synthetic `admin` is included for stability until profiles exist everywhere.
 */
export function isAdminConsoleRole(role: UserRole): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "ministry_admin" ||
    role === "ministry_officer" ||
    role === "government_officer"
  );
}
