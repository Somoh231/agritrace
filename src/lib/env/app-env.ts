/**
 * Which environment this deployment is. A label only — never a project ref,
 * URL or key. The build guard (supabase-environment-guard.mjs) guarantees a
 * production deployment can never carry the "staging" label.
 */
export type AppEnvironment = "production" | "staging" | "development";

// Referenced literally so Next.js inlines the build-time value (server and client).
const BUILD_APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

/** Pass `env` only in tests; by default the build-time label is used. */
export function appEnvironment(env?: Partial<NodeJS.ProcessEnv>): AppEnvironment {
  const explicit = (env ? env.NEXT_PUBLIC_APP_ENV : BUILD_APP_ENV)?.trim();
  if (explicit === "production" || explicit === "staging" || explicit === "development") return explicit;
  const vercelEnv = env ? env.VERCEL_ENV : process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "staging";
  return "development";
}

/** True only when the build explicitly says staging (the indicator never guesses). */
export const IS_STAGING_BUILD = BUILD_APP_ENV === "staging";
