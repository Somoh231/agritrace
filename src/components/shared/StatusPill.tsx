import * as React from "react";

type PillStatus = "ok" | "warning" | "error" | "info" | "neutral";

const STYLES: Record<PillStatus, string> = {
  ok: "bg-green-50 text-green-800 border border-green-200",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  error: "bg-red-50 text-red-800 border border-red-200",
  info: "bg-blue-50 text-blue-800 border border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",
};

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
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-medium ${STYLES[status]}`}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className="h-1 w-1 rounded-full"
          style={{ backgroundColor: "currentColor" }}
        />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

