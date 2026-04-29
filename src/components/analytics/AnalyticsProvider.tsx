"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { track } from "@/lib/analytics/client";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  React.useEffect(() => {
    const safePath = typeof pathname === "string" && pathname ? pathname : "/";
    const qs = typeof window !== "undefined" ? window.location.search : "";
    const full = qs ? `${safePath}?${qs}` : safePath;
    track("page_view", { path: full });
  }, [pathname]);

  return children;
}

