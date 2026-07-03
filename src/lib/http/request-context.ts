/** Request correlation for middleware and API routes. */

export const REQUEST_ID_HEADER = "x-request-id";

export function resolveRequestId(request: Request): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER)?.trim();
  if (incoming && incoming.length <= 128) return incoming;
  return crypto.randomUUID();
}

export function withRequestIdHeader(headers: HeadersInit | undefined, requestId: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((v, k) => {
        out[k] = v;
      });
    } else if (Array.isArray(headers)) {
      for (const [k, v] of headers) out[k] = v;
    } else {
      Object.assign(out, headers);
    }
  }
  out[REQUEST_ID_HEADER] = requestId;
  return out;
}

/** Best-effort client key for rate limiting (edge-aware). */
export function clientRateLimitKey(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `ip:${forwarded ?? realIp ?? "anonymous"}`;
}
