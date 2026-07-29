/**
 * Shared demo identities are intentionally disabled.
 *
 * Operational and QA users must be individually invited through the protected
 * Users & Roles workspace and store credentials only in an approved secret
 * manager. This file remains as a fail-closed compatibility entry point for
 * operators who still have the former command in local notes.
 */

throw new Error(
  "Shared demo account seeding is disabled. Provision unique non-production users through Admin → Users & Roles.",
);
