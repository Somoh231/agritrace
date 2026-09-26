import type { RateLimitPolicy } from "@/lib/http/rate-limit";

/*
 * API rate-limit budgets. Each policy is its own namespace: counters are keyed
 * `<name>:<identity>`, where identity is the signed-in user (`user:<id>`) or,
 * for anonymous callers, the client IP (`ip:<addr>`). Budgets never share a
 * counter, so traffic on one endpoint family cannot starve another.
 */

/** Authenticated read APIs (registry, production, registrations, reports list, workspace preview). */
export const READ_POLICY: RateLimitPolicy = { name: "read", windowMs: 60_000, max: 120 };

/** Public website forms (demo inquiry). Anonymous, per IP. */
export const PUBLIC_POLICY: RateLimitPolicy = { name: "public-form", windowMs: 60_000, max: 10 };

/** AI assistant — token cost control. Per user. */
export const AI_CHAT_POLICY: RateLimitPolicy = { name: "ai-chat", windowMs: 60_000, max: 20 };

/** PDF / CSV export generation. Per user. */
export const EXPORT_POLICY: RateLimitPolicy = { name: "export", windowMs: 60_000, max: 15 };

/** Workflow mutations (submission, verification, transfer). Per user. */
export const WORKFLOW_MUTATION_POLICY: RateLimitPolicy = { name: "workflow-write", windowMs: 60_000, max: 60 };

/**
 * Analytics event ingestion. Its own budget: page views and clicks never count
 * against any other endpoint. Per user when signed in, per IP otherwise (each
 * event is a database insert, so it stays limited).
 */
export const ANALYTICS_POLICY: RateLimitPolicy = { name: "analytics", windowMs: 60_000, max: 120 };

/** Admin console reads. Per user; independent of general reads. */
export const ADMIN_READ_POLICY: RateLimitPolicy = { name: "admin-read", windowMs: 60_000, max: 120 };

/** Admin console mutations. Per user. */
export const ADMIN_MUTATION_POLICY: RateLimitPolicy = { name: "admin-write", windowMs: 60_000, max: 40 };
