"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchUnifiedVerificationQueue,
  type VerificationQueueResult,
} from "@/features/verification/repositories/verification-repository";
import { operationalQueryKeys } from "@/platform/query-keys";

export function useVerificationQueue() {
  return useQuery<VerificationQueueResult>({
    queryKey: operationalQueryKeys.verification.queue(),
    queryFn: fetchUnifiedVerificationQueue,
  });
}
