"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchUnifiedVerificationQueue } from "@/features/verification/repositories/verification-repository";
import { operationalQueryKeys } from "@/platform/query-keys";

export function useVerificationQueue() {
  return useQuery({
    queryKey: operationalQueryKeys.verification.queue(),
    queryFn: fetchUnifiedVerificationQueue,
  });
}
