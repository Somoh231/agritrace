/** Shared API input hygiene and safe error surfaces (no secrets in responses). */

export const API_ERROR_GENERIC = "Request could not be completed.";
export const API_ERROR_UNAUTHORIZED = "Unauthorized";
export const API_ERROR_INVALID_JSON = "Invalid request body.";

export function clampStr(v: unknown, max: number): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

export function parseBoundedInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Reject oversize JSON bodies before parsing when Content-Length is present. */
export function requestBodyTooLarge(request: Request, maxBytes: number): boolean {
  const len = request.headers.get("content-length");
  if (!len) return false;
  const n = Number(len);
  return Number.isFinite(n) && n > maxBytes;
}

/** Bound serialized payload size for analytics / metadata inserts. */
export function jsonPayloadTooLarge(value: unknown, maxBytes: number): boolean {
  try {
    return JSON.stringify(value ?? null).length > maxBytes;
  } catch {
    return true;
  }
}

/** Log server-side only — never return raw DB/provider messages to clients. */
export function logApiError(scope: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err ?? "unknown");
  console.error(`[${scope}]`, message);
}
