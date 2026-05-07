/**
 * Stable TanStack Query keys for operational domains.
 * Extend per feature — keep hierarchies predictable for invalidation.
 */
function normCountyKey(county: string): string {
  return county.trim().toLowerCase() || "__none__";
}

export const operationalQueryKeys = {
  transfers: {
    all: ["operations", "transfers"] as const,
    list: () => [...operationalQueryKeys.transfers.all, "list"] as const,
  },
  verification: {
    all: ["operations", "verification"] as const,
    /** Canonical unified ministry verification ledger (client-assembled today). */
    queue: () => [...operationalQueryKeys.verification.all, "queue"] as const,
    /** Reserved for server-filtered slices / partial hydration — invalidate alongside `queue()` today. */
    queueByCounty: (county: string) =>
      [...operationalQueryKeys.verification.all, "queue", "county", normCountyKey(county)] as const,
    /** Reserved for per-artefact detail fetches. */
    detail: (id: string) => [...operationalQueryKeys.verification.all, "detail", id] as const,
  },
  warehouses: {
    all: ["operations", "warehouses"] as const,
    detail: (code: string) => [...operationalQueryKeys.warehouses.all, "detail", code] as const,
  },
} as const;
