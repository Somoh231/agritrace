import { buildUnifiedVerificationQueue } from "@/lib/ops/ministry-verification-queue-data";
import type { VerificationGridRow } from "@/features/verification/model/types";
import { fetchOperationalSubmissions } from "@/lib/workflow/client";
import { mergeVerificationQueueWithSubmissions } from "@/lib/workflow/operational-submission-queue";

/** Unified verification artefacts — fixtures merged with live operational_submissions. */
export async function fetchUnifiedVerificationQueue(): Promise<VerificationGridRow[]> {
  const fixtures = buildUnifiedVerificationQueue();
  const live = await fetchOperationalSubmissions();
  if (!live.ok) return fixtures;
  return mergeVerificationQueueWithSubmissions(fixtures, live.submissions);
}
