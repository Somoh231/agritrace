import type { UserRole } from "@/lib/supabase/types";

/**
 * Roles allowed to use /admin/* shell routes and admin APIs.
 * Includes legacy `government_officer` for existing seeded ministry accounts.
 * `admin` is a real `user_role` value; it is only ever read from an active profile row.
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
