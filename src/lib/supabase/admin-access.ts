import type { UserRole } from "@/lib/supabase/types";

/**
 * Explicit allowlist of roles that may use /admin/* routes and /api/admin/*.
 *
 * super_admin only (owner decision, 2026-09-29). `admin`, `ministry_admin`,
 * `ministry_officer` and `government_officer` are operational or institutional
 * roles and must not reach user management, system diagnostics, imports or
 * settings. Enforced server-side by middleware (route gate), admin/layout.tsx
 * and guardAdminApiRequest → requireAdminConsole for every admin API.
 */
export const ADMIN_CONSOLE_ROLES: readonly UserRole[] = ["super_admin"];

export function isAdminConsoleRole(role: UserRole): boolean {
  return ADMIN_CONSOLE_ROLES.includes(role);
}
