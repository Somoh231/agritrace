/**
 * Supabase environment guard. Loaded by next.config.mjs, so it runs for
 * `next build`, `next dev` and `next start`: a misconfigured environment fails
 * to build or start instead of connecting to the wrong project.
 *
 * Rules:
 *   Vercel Preview  → NEXT_PUBLIC_APP_ENV must be "staging"; the project must not
 *                     be production (SUPABASE_PRODUCTION_PROJECT_REF is required),
 *                     and must be staging when SUPABASE_STAGING_PROJECT_REF is set.
 *   Vercel Production → NEXT_PUBLIC_APP_ENV must be "production" or unset; the
 *                     project must be production (SUPABASE_PRODUCTION_PROJECT_REF
 *                     is required) and must not be staging.
 *   Local, NEXT_PUBLIC_APP_ENV="staging" → same as Preview.
 *   Local, anything else → no constraint (unchanged developer behaviour).
 * Anon and service-role keys that carry a `ref` claim must match the URL's project.
 *
 * Messages never include project refs, URLs or keys.
 *
 * Plain JavaScript on purpose: next.config.mjs imports it before TypeScript runs.
 */

const APP_ENVS = new Set(["production", "staging", "development"]);

/** Supabase project ref from a project URL (`https://<ref>.supabase.co`). */
export function projectRefFromUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(String(url).trim()).hostname.toLowerCase();
    return host.endsWith(".supabase.co") ? host.split(".")[0] : host;
  } catch {
    return null;
  }
}

/** `ref` claim of a legacy JWT-format Supabase key; null for other formats. */
export function projectRefFromKey(key) {
  if (!key) return null;
  const parts = String(key).trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.ref === "string" ? payload.ref.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ vercelEnv?: string, appEnv?: string, supabaseUrl?: string, anonKey?: string,
 *           serviceRoleKey?: string, productionRef?: string, stagingRef?: string }} env
 * @returns {{ ok: boolean, target: "production" | "staging" | "unconstrained", errors: string[] }}
 */
export function checkSupabaseEnvironment(env) {
  const errors = [];
  const vercelEnv = (env.vercelEnv ?? "").trim();
  const appEnv = (env.appEnv ?? "").trim();
  const prodRef = (env.productionRef ?? "").trim().toLowerCase() || null;
  const stagingRef = (env.stagingRef ?? "").trim().toLowerCase() || null;
  const urlRef = projectRefFromUrl(env.supabaseUrl);

  if (appEnv && !APP_ENVS.has(appEnv)) {
    errors.push("NEXT_PUBLIC_APP_ENV must be one of production, staging, development.");
  }

  let target = "unconstrained";
  if (vercelEnv === "production") target = "production";
  else if (vercelEnv === "preview" || appEnv === "staging") target = "staging";

  if (target === "unconstrained") return { ok: errors.length === 0, target, errors };

  if (!urlRef) errors.push("NEXT_PUBLIC_SUPABASE_URL is missing or invalid.");
  if (!prodRef) errors.push("SUPABASE_PRODUCTION_PROJECT_REF must be set so the environment can be verified.");

  if (target === "staging") {
    if (appEnv !== "staging") errors.push('Preview and staging builds must set NEXT_PUBLIC_APP_ENV="staging".');
    if (urlRef && prodRef && urlRef === prodRef) {
      errors.push("This staging/preview build is configured with the PRODUCTION Supabase project. Refusing to continue.");
    }
    if (urlRef && stagingRef && urlRef !== stagingRef) {
      errors.push("The Supabase project is not the configured staging project.");
    }
  } else {
    if (appEnv && appEnv !== "production") errors.push('Production builds must set NEXT_PUBLIC_APP_ENV="production" (or leave it unset).');
    if (urlRef && prodRef && urlRef !== prodRef) {
      errors.push("This production build is not configured with the production Supabase project. Refusing to continue.");
    }
    if (urlRef && stagingRef && urlRef === stagingRef) {
      errors.push("This production build is configured with the STAGING Supabase project. Refusing to continue.");
    }
  }

  // Keys must belong to the same project as the URL (legacy JWT keys carry `ref`).
  for (const [name, key] of [
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.anonKey],
    ["SUPABASE_SERVICE_ROLE_KEY", env.serviceRoleKey],
  ]) {
    const keyRef = projectRefFromKey(key);
    if (keyRef && urlRef && keyRef !== urlRef) errors.push(`${name} belongs to a different Supabase project than NEXT_PUBLIC_SUPABASE_URL.`);
  }

  return { ok: errors.length === 0, target, errors };
}

/** Throws with every problem listed; used at config load. */
export function assertSupabaseEnvironment(processEnv = process.env) {
  const result = checkSupabaseEnvironment({
    vercelEnv: processEnv.VERCEL_ENV,
    appEnv: processEnv.NEXT_PUBLIC_APP_ENV,
    supabaseUrl: processEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: processEnv.SUPABASE_SERVICE_ROLE_KEY,
    productionRef: processEnv.SUPABASE_PRODUCTION_PROJECT_REF,
    stagingRef: processEnv.SUPABASE_STAGING_PROJECT_REF,
  });
  if (!result.ok) {
    throw new Error(`[supabase-environment-guard] ${result.target} environment rejected:\n  - ${result.errors.join("\n  - ")}`);
  }
  return result;
}
