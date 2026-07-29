export const ANALYTICS_STATUS_HEADER = "x-agrivault-analytics-status";

type ProviderError = {
  code?: string | null;
  message?: string | null;
};

/**
 * Usage analytics is optional observability infrastructure. Supabase reports a
 * missing PostgREST table as PGRST205 and direct Postgres access as 42P01.
 */
export function isAnalyticsTableUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as ProviderError;
  if (candidate.code === "PGRST205" || candidate.code === "42P01") return true;

  const message = String(candidate.message ?? "").toLowerCase();
  return (
    message.includes("analytics_events") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}
