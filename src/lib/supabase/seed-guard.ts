/**
 * Seed scripts write synthetic records with the service-role key (and some
 * delete season data). They must never run against a project real operators
 * use. Require an explicit, project-specific confirmation for every run:
 *
 *   SEED_TARGET_IS_DISPOSABLE=yes SEED_TARGET_PROJECT_REF=<ref|local> npm run seed:...
 */
export function assertDisposableSeedTarget(supabaseUrl: string): void {
  const host = new URL(supabaseUrl).hostname;
  const ref = host === "127.0.0.1" || host === "localhost" ? "local" : host.split(".")[0];
  if (process.env.SEED_TARGET_IS_DISPOSABLE !== "yes" || process.env.SEED_TARGET_PROJECT_REF !== ref) {
    throw new Error(
      `Refusing to seed ${host}: set SEED_TARGET_IS_DISPOSABLE=yes and SEED_TARGET_PROJECT_REF=${ref} only for a disposable staging or local project.`,
    );
  }
}
