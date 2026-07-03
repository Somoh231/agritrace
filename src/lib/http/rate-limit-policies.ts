import type { RateLimitPolicy } from "@/lib/http/rate-limit";

/** Authenticated read APIs */
export const READ_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 120 };

/** Public marketing / contact endpoints */
export const PUBLIC_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 10 };

/** AI chat — token cost control */
export const AI_CHAT_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 20 };

/** PDF / CSV export generation */
export const EXPORT_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 15 };

/** Workflow mutations */
export const WORKFLOW_MUTATION_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 60 };

/** Analytics event ingestion */
export const ANALYTICS_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 120 };

/** Admin console mutations */
export const ADMIN_MUTATION_POLICY: RateLimitPolicy = { windowMs: 60_000, max: 40 };
