import { buildUnifiedVerificationQueue } from "@/lib/ops/ministry-verification-queue-data";
import type { VerificationGridRow } from "@/features/verification/model/types";

/** Unified verification artefacts — today sourced from canonical ministry fixtures + deterministic synthesis. */
export async function fetchUnifiedVerificationQueue(): Promise<VerificationGridRow[]> {
  return Promise.resolve(buildUnifiedVerificationQueue());
}
