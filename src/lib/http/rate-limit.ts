/**
 * In-process sliding-window rate limiter.
 * Suitable for single-node / low-traffic pilots; swap store for Redis/KV at scale.
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

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function prune(now: number): void {
  if (store.size <= MAX_KEYS) return;
  for (const [key, bucket] of store) {
    if (now >= bucket.resetAt) store.delete(key);
    if (store.size <= MAX_KEYS * 0.8) break;
  }
}

/** Enforce rate limit for a namespaced key (IP, user id, route composite). */
export function checkRateLimit(key: string, policy: RateLimitPolicy = DEFAULT_POLICY): RateLimitResult {
  const now = Date.now();
  prune(now);

  let bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + policy.windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= policy.max;
  return {
    allowed,
    limit: policy.max,
    remaining: Math.max(0, policy.max - bucket.count),
    resetAt: bucket.resetAt,
  };
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
