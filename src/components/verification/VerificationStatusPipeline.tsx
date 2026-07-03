"use client";

import StatusPipeline from "@/components/enterprise/StatusPipeline";
import { VERIFICATION_PIPELINE } from "@/components/verification/verification-workspace-utils";
import type { VerificationQueueStatus } from "@/features/verification/model/types";
import { verificationStatusTone } from "@/components/verification/verification-workspace-utils";

/** @deprecated Use `StatusPipeline` from `@/components/enterprise` directly. */
export default function VerificationStatusPipeline({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const stages = VERIFICATION_PIPELINE.map((stage) => ({
    key: stage.key,
    label: stage.label,
    tone: verificationStatusTone(stage.key as VerificationQueueStatus),
    activeLabel: "In queue",
  }));

  return <StatusPipeline stages={stages} counts={counts} />;
}
