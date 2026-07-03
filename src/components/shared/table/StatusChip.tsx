import type { ReactNode } from "react";

import StatusBadge, { type StatusBadgeTone } from "@/components/enterprise/StatusBadge";

export type ChipTone = "ok" | "warn" | "danger" | "info" | "neutral";

const TONE_MAP: Record<ChipTone, StatusBadgeTone> = {
  ok: "success",
  warn: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",
};

/**
 * @deprecated Use `StatusBadge` from `@/components/enterprise` instead.
 * Legacy admin/activity table chip — delegates to canonical StatusBadge.
 */
export default function StatusChip({
  tone = "neutral",
  theme = "light",
  dot = true,
  children,
}: {
  tone?: ChipTone;
  theme?: "light" | "dark";
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <StatusBadge tone={TONE_MAP[tone]} theme={theme} dot={dot} uppercase>
      {children}
    </StatusBadge>
  );
}
