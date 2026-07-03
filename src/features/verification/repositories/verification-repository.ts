import { buildUnifiedVerificationQueue } from "@/lib/ops/ministry-verification-queue-data";
import type { VerificationGridRow } from "@/features/verification/model/types";
import { liveSource, pilotSource, resolveDisplaySource, sourced, type SourcedResult } from "@/lib/data/data-source";
import { fetchOperationalSubmissions } from "@/lib/workflow/client";
import { mergeVerificationQueueWithSubmissions } from "@/lib/workflow/operational-submission-queue";

export type VerificationQueueResult = SourcedResult<VerificationGridRow[]>;

/** Unified verification artefacts — fixtures merged with live operational_submissions. */
export async function fetchUnifiedVerificationQueue(): Promise<VerificationQueueResult> {
  const fixtures = buildUnifiedVerificationQueue();
  const live = await fetchOperationalSubmissions();
  if (!live.ok) {
    return sourced(fixtures, pilotSource("Live submissions unavailable → canonical VRF fixtures only"));
  }
  const merged = mergeVerificationQueueWithSubmissions(fixtures, live.submissions);
  const hasLive = merged.some((r) => Boolean(r._detail.submissionId));
  return sourced(
    merged,
    hasLive
      ? resolveDisplaySource([liveSource("operational_submissions"), pilotSource("VRF fixture rows for training")])
      : pilotSource("Canonical verification fixtures — no live submissions in scope"),
  );
}
