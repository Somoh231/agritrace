/**
 * Read-only stakeholder preview accounts (profiles.preview_read_only).
 *
 * Enforced in three layers:
 *   1. middleware: every non-read request from a preview account is refused
 *      (403), on API routes and pages alike, except the exact allowlist below;
 *   2. database: restrictive RLS policies refuse every INSERT/UPDATE/DELETE
 *      (supabase/proposals/20260930100000_preview_read_only_and_scoped_writes.sql);
 *   3. UI: mutation controls are not rendered and the shell shows
 *      "Preview · Read only".
 */

export const PREVIEW_READ_ONLY_LABEL = "Preview · Read only";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * POST endpoints a read-only account may call, because they change nothing:
 * report exports that only render a file, and page-view telemetry.
 */
export const READ_ONLY_ALLOWED_WRITE_PATHS: readonly string[] = ["/api/reports/rice", "/api/reports/dds", "/api/analytics"];

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

export function isPreviewReadOnly(profile: { preview_read_only?: boolean | null } | null | undefined): boolean {
  return profile?.preview_read_only === true;
}

/** True when a read-only preview account may make this request. */
export function previewRequestAllowed(method: string, pathname: string): boolean {
  if (isSafeMethod(method)) return true;
  const path = pathname.split("?")[0] ?? pathname;
  return method.toUpperCase() === "POST" && READ_ONLY_ALLOWED_WRITE_PATHS.includes(path);
}
