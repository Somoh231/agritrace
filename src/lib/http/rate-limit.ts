/**
 * In-process sliding-window rate limiter (memory store).
 * Production routes should use checkRateLimitDistributed via beginApiRequestAsync.
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

export const DEFAULT_POLICY: RateLimitPolicy = {
  windowMs: 60_000,
  max: 60,
};

export { checkRateLimitDistributed, checkRateLimitMemory, activeRateLimitStoreKind } from "@/lib/http/rate-limit-store";

import { checkRateLimitMemory } from "@/lib/http/rate-limit-store";

/** @deprecated Prefer checkRateLimitDistributed in route handlers. */
export function checkRateLimit(key: string, policy: RateLimitPolicy = DEFAULT_POLICY): RateLimitResult {
  return checkRateLimitMemory(key, policy);
}

/** Response headers describing policy intent (always sent). */
export function rateLimitPolicyHeaders(policy: RateLimitPolicy = DEFAULT_POLICY): Record<string, string> {
  return {
    "X-RateLimit-Policy": `${policy.max};w=${Math.round(policy.windowMs / 1000)}`,
  };
}

/** Response headers from an enforcement result. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/** @deprecated Use checkRateLimit — kept for importers during migration. */
export { checkRateLimit as enforceRateLimit };
