export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (
  err: Error,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string },
) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() && !process.env.SENTRY_DSN?.trim()) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err, {
    extra: {
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      requestId: request.headers["x-request-id"],
    },
  });
};
