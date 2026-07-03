/**
 * Rate-limit readiness stub.
 * Wire to Vercel KV, Upstash Redis, or edge middleware for production enforcement.
 */

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export type RateLimitPolicy = {
  /** Sliding window in milliseconds */
  windowMs: number;
  /** Max requests per window per key */
  max: number;
};

const DEFAULT_POLICY: RateLimitPolicy = {
  windowMs: 60_000,
  max: 60,
};

/** Response headers for clients and upstream proxies (readiness only — not enforced yet). */
export function rateLimitPolicyHeaders(policy: RateLimitPolicy = DEFAULT_POLICY): Record<string, string> {
  return {
    "X-RateLimit-Policy": `${policy.max};w=${Math.round(policy.windowMs / 1000)}`,
  };
}

/**
 * Placeholder check — always allows today.
 * Replace with durable store keyed by IP / user id before exposing high-cost routes publicly.
 */
export function checkRateLimit(_key: string, policy: RateLimitPolicy = DEFAULT_POLICY): RateLimitResult {
  const now = Date.now();
  return {
    allowed: true,
    limit: policy.max,
    remaining: policy.max,
    resetAt: now + policy.windowMs,
  };
}
