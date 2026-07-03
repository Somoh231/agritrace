import StatusBadge from "@/components/enterprise/StatusBadge";

type PillStatus = "ok" | "warning" | "error" | "info" | "neutral";

const TONE_MAP: Record<PillStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  ok: "success",
  warning: "warning",
  error: "danger",
  info: "info",
  neutral: "neutral",
};

/**
 * @deprecated Use `StatusBadge` from `@/components/enterprise` instead.
 * Legacy rounded pill for rice/cocoa tables — delegates to canonical StatusBadge.
 */
export default function StatusPill({
  status,
  label,
  showDot = true,
}: {
  status: PillStatus;
  label: string;
  showDot?: boolean;
}) {
  return (
    <StatusBadge tone={TONE_MAP[status]} shape="pill" dot={showDot}>
      {label}
    </StatusBadge>
  );
}
