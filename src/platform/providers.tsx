"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

import { createOperationalQueryClient } from "@/platform/query-client";

/** Cross-cutting client providers for ministry workspaces (React Query, etc.). */
export default function PlatformProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => createOperationalQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
