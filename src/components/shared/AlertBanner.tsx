import * as React from "react";

type Severity = "warning" | "danger" | "info";

const STYLES: Record<Severity, string> = {
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  danger: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function AlertBanner({
  message,
  severity,
  actions,
}: {
  message: string;
  severity: Severity;
  actions?: Array<{ label: string; onClick: () => void }>;
}) {
  return (
    <div
      role={severity === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2.5 p-3 rounded-lg text-[12px] border ${STYLES[severity]}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      >
        <path
          d="M12 3l10 18H2L12 3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex-1 leading-relaxed">{message}</div>

      {actions?.length ? (
        <div className="flex items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="text-[11px] font-mono underline underline-offset-2 opacity-90 hover:opacity-100"
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

