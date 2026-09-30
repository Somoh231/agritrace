/**
 * Target check for scripts/ops/preview-account.mjs. Pure, so it is unit-tested
 * (src/lib/auth/__tests__/preview-read-only.spec.ts) without a network.
 *
 * A preview account may only be managed against the STAGING Supabase project:
 *   - NEXT_PUBLIC_APP_ENV must be "staging";
 *   - both SUPABASE_PRODUCTION_PROJECT_REF and SUPABASE_STAGING_PROJECT_REF must be set;
 *   - the URL's project must equal the staging ref and differ from production;
 *   - the service-role key must belong to the same project (when it carries a ref);
 *   - PREVIEW_SITE_URL (where the invite lands) must be https and not the public site.
 * Messages never include refs, URLs or keys.
 */
import { checkSupabaseEnvironment, projectRefFromUrl } from "../../src/lib/env/supabase-environment-guard.mjs";

const PRODUCTION_SITE_HOSTS = new Set(["agrivaultdata.com", "www.agrivaultdata.com"]);

/** @returns {{ ok: boolean, errors: string[] }} */
export function checkPreviewAccountTarget(env) {
  const errors = [];
  const appEnv = (env.NEXT_PUBLIC_APP_ENV ?? "").trim();
  const prodRef = (env.SUPABASE_PRODUCTION_PROJECT_REF ?? "").trim().toLowerCase();
  const stagingRef = (env.SUPABASE_STAGING_PROJECT_REF ?? "").trim().toLowerCase();
  const urlRef = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);

  if (appEnv !== "staging") errors.push('NEXT_PUBLIC_APP_ENV must be "staging".');
  if (!prodRef) errors.push("SUPABASE_PRODUCTION_PROJECT_REF must be set.");
  if (!stagingRef) errors.push("SUPABASE_STAGING_PROJECT_REF must be set.");
  if (prodRef && stagingRef && prodRef === stagingRef) errors.push("Staging and production refs must differ.");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) errors.push("SUPABASE_SERVICE_ROLE_KEY (staging) must be set.");
  if (urlRef && stagingRef && urlRef !== stagingRef) errors.push("The Supabase project is not the configured staging project.");
  if (urlRef && prodRef && urlRef === prodRef) errors.push("The Supabase project is PRODUCTION. Refusing.");

  const base = checkSupabaseEnvironment({
    appEnv: "staging",
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    productionRef: prodRef,
    stagingRef,
  });
  for (const e of base.errors) if (!errors.includes(e)) errors.push(e);

  let site = null;
  try {
    site = new URL(String(env.PREVIEW_SITE_URL ?? "").trim());
  } catch {
    errors.push("PREVIEW_SITE_URL (the staging preview origin the invite opens) must be set.");
  }
  if (site) {
    if (site.protocol !== "https:") errors.push("PREVIEW_SITE_URL must be https.");
    if (PRODUCTION_SITE_HOSTS.has(site.hostname.toLowerCase())) errors.push("PREVIEW_SITE_URL must not be the production site.");
  }

  return { ok: errors.length === 0, errors };
}

/** a***@example.org — enough to recognise an account, not to harvest it. */
export function maskEmail(email) {
  const [user, domain] = String(email ?? "").split("@");
  if (!user || !domain) return "(invalid)";
  return `${user[0]}***@${domain}`;
}
