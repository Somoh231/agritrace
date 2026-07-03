"use client";

import StatusBadge from "@/components/enterprise/StatusBadge";
import { cn } from "@/components/enterprise/cn";
import {
  DATA_SOURCE_DESCRIPTIONS,
  type DataSourceKind,
  type DataSourceMeta,
  isLiveSource,
  requiresDisclosure,
} from "@/lib/data/data-source";

const KIND_TONE: Record<DataSourceKind, "success" | "info" | "warning" | "neutral"> = {
  live: "success",
  pilot: "info",
  offline: "warning",
  demo: "warning",
};

const KIND_SHORT: Record<DataSourceKind, string> = {
  live: "LIVE",
  pilot: "PILOT",
  offline: "OFFLINE",
  demo: "DEMO",
};

export default function DataSourceBadge({
  source,
  theme = "light",
  variant = "badge",
  className,
}: {
  source: DataSourceMeta;
  theme?: "light" | "dark";
  /** `badge` — compact chip; `banner` — full-width disclosure strip */
  variant?: "badge" | "banner";
  className?: string;
}) {
  if (!requiresDisclosure(source) && variant === "badge") {
    return (
      <StatusBadge tone="success" theme={theme} dot uppercase shape="pill" className={className}>
        {KIND_SHORT.live}
      </StatusBadge>
    );
  }

  if (variant === "banner" && isLiveSource(source)) return null;

  const tone = KIND_TONE[source.kind];
  const title = source.label;
  const body = source.detail ?? DATA_SOURCE_DESCRIPTIONS[source.kind];

  if (variant === "banner") {
    return (
      <div
        role="status"
        className={cn(
          "rounded-lg border px-3 py-2 text-[11px] leading-snug",
          theme === "dark"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
            : "border-amber-200 bg-amber-50 text-amber-950",
          className,
        )}
      >
        <span className="font-semibold">{title}</span>
        <span className="mx-1.5 font-mono text-[10px] uppercase tracking-wide opacity-80">({KIND_SHORT[source.kind]})</span>
        — {body}
      </div>
    );
  }

  return (
    <span title={body} className={className}>
      <StatusBadge tone={tone} theme={theme} dot uppercase shape="pill">
        {source.mixed?.length ? source.label : KIND_SHORT[source.kind]}
      </StatusBadge>
    </span>
  );
}

/** Renders a banner only when the source is not fully live. */
export function DataSourceNotice({
  source,
  theme = "light",
  className,
}: {
  source: DataSourceMeta;
  theme?: "light" | "dark";
  className?: string;
}) {
  if (isLiveSource(source)) return null;
  return <DataSourceBadge source={source} theme={theme} variant="banner" className={className} />;
}
