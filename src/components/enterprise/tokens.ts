/** Shared enterprise design tokens (reference + Tailwind class maps). 8px spacing grid. */
export const enterpriseTokens = {
  radius: {
    sm: "rounded-lg", // 8px
    md: "rounded-xl", // 12px
    lg: "rounded-2xl", // 16px
  },
  shadow: {
    card: "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.06)]",
    panel: "shadow-[0_2px_8px_rgba(16,24,40,0.08)]",
  },
  sidebar: "bg-[rgb(var(--enterprise-sidebar))] text-[rgb(var(--enterprise-sidebar-fg))]",
  canvas: "bg-[rgb(var(--enterprise-canvas))]",
  card: "bg-white border border-[rgb(var(--enterprise-border))]",
} as const;
