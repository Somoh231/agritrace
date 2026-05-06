export function isValidHttpUrl(value: string | undefined) {
  return normalizeHttpUrl(value) !== null;
}

/**
 * Normalizes a user-provided URL string into a valid http(s) URL.
 * - trims whitespace
 * - adds https:// if a scheme is missing
 * - returns null if invalid or non-http(s)
 */
export function normalizeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  let trimmed = value.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return null;
  // Strip wrapping quotes often pasted from dashboards / env UIs.
  trimmed = trimmed.replace(/^["'`]+|["'`]+$/g, "").trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Browsers block mixed active content: never call http://*.supabase.co from an https site.
    if (u.protocol === "http:" && /\.supabase\.co$/i.test(u.hostname)) {
      u.protocol = "https:";
    }
    // Keep a stable canonical form (no trailing slash).
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Maps Supabase-js / fetch failures into actionable copy for sign-in UI. */
export function describeAuthFetchFailure(message: string): string {
  const m = message.trim();
  const lowered = m.toLowerCase();
  if (
    m === "Failed to fetch" ||
    lowered.includes("failed to fetch") ||
    lowered.includes("networkerror") ||
    lowered.includes("network request failed") ||
    lowered.includes("load failed")
  ) {
    return [
      "Could not reach Supabase Auth (network error).",
      "Confirm NEXT_PUBLIC_SUPABASE_URL is https://YOUR_PROJECT.supabase.co (not http, not the DB pooler URL), redeploy after changing env vars, and ensure the Supabase project is not paused.",
      "Then retry — or open /health from the same device to compare server-side connectivity.",
    ].join(" ");
  }
  return m;
}

