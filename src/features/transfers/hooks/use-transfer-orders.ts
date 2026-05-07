"use client";

import { useQuery } from "@tanstack/react-query";

import { listTransferOrders } from "@/features/transfers/repositories/transfers-repository";
import { operationalQueryKeys } from "@/platform/query-keys";

/** Shared corridor ledger — GIS + national trace surfaces should use this hook for cache coherence. */
export function useTransferOrders() {
  return useQuery({
    queryKey: operationalQueryKeys.transfers.list(),
    queryFn: () => listTransferOrders(),
  });
}
