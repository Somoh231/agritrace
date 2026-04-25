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
    // send path as query param too (so API can read without trusting payload)
    fetch(`/api/analytics?path=${encodeURIComponent(full)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view" }),
      keepalive: true,
    }).catch(() => null);
  }, [pathname, search]);

  return children;
}

