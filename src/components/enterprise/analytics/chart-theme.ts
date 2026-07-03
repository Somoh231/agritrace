/** Shared Recharts palette — ministry enterprise intelligence surfaces */
export const CHART_COLORS = {
  forest: "#1B4B25",
  forestLight: "#62AD73",
  gold: "#C9A24B",
  navy: "#1e3a5f",
  slate: "#64748b",
  rose: "#e11d48",
  amber: "#d97706",
  sky: "#0284c7",
  grid: "#e2e8f0",
  muted: "#94a3b8",
} as const;

export const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;

export const AXIS_TICK = { fontSize: 11, fill: CHART_COLORS.slate, fontFamily: "var(--font-mono)" } as const;

export const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
} as const;
