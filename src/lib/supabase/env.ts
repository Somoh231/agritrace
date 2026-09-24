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
    // Operators get plain guidance; deployment diagnostics stay in the console / monitoring.
    console.error("[auth] sign-in could not reach the identity service:", m);
    return "AgriVault could not reach the sign-in service. Check your internet connection and try again. If the problem continues, contact your system administrator.";
  }
  if (lowered.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (lowered.includes("rate limit") || lowered.includes("too many")) {
    return "Too many sign-in attempts. Wait a few minutes before trying again.";
  }
  return m;
}

