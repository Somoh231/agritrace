"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listTransferOrdersSourced,
  type SourcedResult,
} from "@/features/transfers/repositories/transfers-repository";
import type { TransferOrderView } from "@/lib/logistics/types";
import { operationalQueryKeys } from "@/platform/query-keys";

export type TransferOrdersResult = SourcedResult<TransferOrderView[]>;

/** Shared corridor ledger — GIS + national trace surfaces should use this hook for cache coherence. */
export function useTransferOrders() {
  return useQuery<TransferOrdersResult>({
    queryKey: operationalQueryKeys.transfers.list(),
    queryFn: listTransferOrdersSourced,
  });
}
