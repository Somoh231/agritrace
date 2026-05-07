/**
 * Stable TanStack Query keys for operational domains.
 * Extend per feature — keep hierarchies predictable for invalidation.
 */
export const operationalQueryKeys = {
  transfers: {
    all: ["operations", "transfers"] as const,
    list: () => [...operationalQueryKeys.transfers.all, "list"] as const,
  },
  verification: {
    all: ["operations", "verification"] as const,
    unifiedQueue: () => [...operationalQueryKeys.verification.all, "unified-queue"] as const,
  },
  warehouses: {
    all: ["operations", "warehouses"] as const,
    detail: (code: string) => [...operationalQueryKeys.warehouses.all, "detail", code] as const,
  },
} as const;
