import type { ReactNode } from "react";

import { cn } from "@/components/enterprise/cn";
import { enterpriseTokens } from "@/components/enterprise/tokens";

export default function DashboardPanel({
  children,
  className,
  padding = "default",
}: {
  children: ReactNode;
  className?: string;
  padding?: "none" | "default" | "lg";
}) {
  const pad = padding === "none" ? "" : padding === "lg" ? "p-6" : "p-5";
  return (
    <section
      className={cn(
        enterpriseTokens.radius.lg,
        enterpriseTokens.shadow.card,
        enterpriseTokens.card,
        pad,
        className,
      )}
    >
      {children}
    </section>
  );
}
