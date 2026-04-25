import * as React from "react";

export default function ProgressBar({
  valuePct,
  tone = "green",
}: {
  valuePct: number;
  tone?: "green" | "amber" | "red" | "gray";
}) {
  const pct = Math.max(0, Math.min(100, valuePct));
  const fill =
    tone === "amber"
      ? "bg-amber-500"
      : tone === "red"
        ? "bg-red-500"
        : tone === "gray"
          ? "bg-gray-400"
          : "bg-green-600";

  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

