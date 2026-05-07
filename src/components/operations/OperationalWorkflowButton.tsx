"use client";

import * as React from "react";

/** Institutional workflow control — visible but disabled with native tooltip when denied. */
export default function OperationalWorkflowButton({
  allowed,
  disabledReason,
  onClick,
  className,
  children,
}: {
  allowed: boolean;
  disabledReason: string;
  onClick?: () => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={!allowed}
      title={allowed ? undefined : disabledReason}
      aria-disabled={!allowed}
      onClick={() => {
        if (!allowed) return;
        void onClick?.();
      }}
      className={`${className ?? ""} ${!allowed ? "opacity-45 cursor-not-allowed pointer-events-auto" : ""}`}
    >
      {children}
    </button>
  );
}
