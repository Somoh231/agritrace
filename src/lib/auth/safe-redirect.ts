const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

/**
 * Accepts only same-origin application paths.
 * Rejects protocol-relative URLs, control characters, and backslashes.
 */
export function safeInternalRedirect(
  candidate: string | null | undefined,
  fallback: string,
): string {
  const value = candidate?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//") || CONTROL_OR_BACKSLASH.test(value)) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://agrivault.invalid");
    if (parsed.origin !== "https://agrivault.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
