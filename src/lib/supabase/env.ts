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
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Keep a stable canonical form (no trailing slash).
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

