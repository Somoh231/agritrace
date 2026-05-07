import { QueryClient } from "@tanstack/react-query";

/**
 * Browser-side operational query client — tuned for uneven connectivity:
 * longer retained cache, bounded retries, reconnect refetch for ministry desks.
 */
export function createOperationalQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 45_000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
