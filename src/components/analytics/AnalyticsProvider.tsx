"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { track } from "@/lib/analytics/client";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();

  React.useEffect(() => {
    const qs = search?.toString() ?? "";
    const full = qs ? `${pathname}?${qs}` : pathname;
    track("page_view", { path: full });
  }, [pathname, search]);

  return children;
}

