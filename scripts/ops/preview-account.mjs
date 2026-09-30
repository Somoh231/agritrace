/**
 * Manage READ-ONLY stakeholder preview accounts on the STAGING Supabase project.
 *
 * DRY RUN BY DEFAULT. Refuses before any network call unless the env file
 * targets staging (scripts/ops/preview-account-guard.mjs). Never prints keys,
 * passwords or full email addresses; never handles a password at all — the
 * person sets their own through the invite link (/auth/callback → set-password).
 *
 *   node scripts/ops/preview-account.mjs --env-file .env.staging --status
 *   node scripts/ops/preview-account.mjs --env-file .env.staging --invite --email a@b.org --name "Full Name" [--qa]
 *   node scripts/ops/preview-account.mjs --env-file .env.staging --revoke --email a@b.org
 *
 * Add --execute plus CONFIRM_PREVIEW_ACCOUNT=<action>-staging-preview-account
 * (invite | revoke) to change anything. Invites require owner approval per person.
 *
 * Invite: Auth invite (real email, unique person) → profile set in ONE update to
 *   role ministry_officer, preview_read_only true, is_active true → audit_log row.
 *   The new profile row is created by handle_new_user() inactive, so there is
 *   no moment where the account is active without the read-only flag.
 * Revoke: profile is_active false (middleware refuses at once) → Auth ban
 *   (no sign-in or token refresh) → audit_log row. No deletion; re-invite to restore.
 * --qa labels a synthetic QA account ("Preview QA · synthetic") for internal walkthroughs.
 */
import fs from "node:fs";

import { checkPreviewAccountTarget, maskEmail } from "./preview-account-guard.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const envFile = opt("--env-file");
if (!envFile) {
  console.error("Refusing: pass --env-file with the STAGING environment (never .env.local / production).");
  process.exit(2);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);

const target = checkPreviewAccountTarget(env);
if (!target.ok) {
  console.error(`Refusing — not a verified staging target:\n  - ${target.errors.join("\n  - ")}`);
  process.exit(2);
}

const action = flag("--invite") ? "invite" : flag("--revoke") ? "revoke" : "status";
const EXECUTE = flag("--execute");
const email = (opt("--email") ?? "").trim().toLowerCase();
const QA = flag("--qa");
const name = QA ? "Preview QA · synthetic" : (opt("--name") ?? "").trim();

const BASE = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const SITE = new URL(env.PREVIEW_SITE_URL).origin;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function call(path, init = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} -> ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// The read-only capability must exist in this database before any account is made.
try {
  await call("/rest/v1/profiles?select=preview_read_only&limit=1");
} catch {
  console.error("Refusing: profiles.preview_read_only is missing — apply supabase/proposals/20260930100000_preview_read_only_and_scoped_writes.sql to staging first.");
  process.exit(2);
}

async function findUser(addr) {
  for (let page = 1; ; page++) {
    const d = await call(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const batch = d.users ?? [];
    const hit = batch.find((u) => (u.email ?? "").toLowerCase() === addr);
    if (hit || batch.length < 200) return hit ?? null;
  }
}

if (action === "status") {
  const rows = await call("/rest/v1/profiles?select=id,email,role,is_active,preview_read_only&preview_read_only=is.true&order=created_at");
  console.log(`Staging preview accounts: ${rows.length}`);
  for (const r of rows) console.log(`  ${maskEmail(r.email)}  ${r.role}  ${r.is_active ? "active" : "inactive"}  read-only`);
  process.exit(0);
}

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Refusing: --email must be the person's own, unique address (no shared or team mailboxes).");
  process.exit(2);
}
if (action === "invite" && !name) {
  console.error("Refusing: --name is required for an invite (or --qa for the synthetic QA account).");
  process.exit(2);
}

const existing = await findUser(email);
console.log(`${EXECUTE ? "EXECUTE" : "DRY RUN"} — ${action} ${maskEmail(email)} on STAGING`);
if (action === "invite") {
  console.log(`  existing Auth user: ${existing ? "yes (will not re-invite)" : "no"}`);
  console.log(`  planned: invite → redirect ${SITE}/auth/callback → set own password`);
  console.log("  planned: profile role=ministry_officer, preview_read_only=true, is_active=true (single update) → audit_log");
} else {
  console.log(`  existing Auth user: ${existing ? "yes" : "no — nothing to revoke"}`);
  console.log("  planned: profile is_active=false → Auth ban → audit_log (no deletion)");
}
if (!EXECUTE) {
  console.log("Nothing was changed.");
  process.exit(0);
}
if (process.env.CONFIRM_PREVIEW_ACCOUNT !== `${action}-staging-preview-account`) {
  console.error(`Refusing: set CONFIRM_PREVIEW_ACCOUNT=${action}-staging-preview-account to confirm owner approval.`);
  process.exit(2);
}

if (action === "invite") {
  if (existing) {
    console.error("Refusing: an Auth user with this email already exists. Use --revoke, or restore it deliberately in the dashboard.");
    process.exit(2);
  }
  const invited = await call(`/auth/v1/invite?redirect_to=${encodeURIComponent(`${SITE}/auth/callback`)}`, {
    method: "POST",
    body: JSON.stringify({ email, data: { full_name: name } }),
  });
  const id = invited.id ?? invited.user?.id;
  const updated = await call(`/rest/v1/profiles?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ role: "ministry_officer", preview_read_only: true, is_active: true, full_name: name, deactivated_at: null }),
  });
  if (!updated?.[0] || updated[0].preview_read_only !== true) throw new Error("profile update did not apply — revoke this account before retrying");
  await call("/rest/v1/audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ action: "PREVIEW_ACCOUNT_INVITED", table_name: "profiles", record_id: id, new_values: { role: "ministry_officer", preview_read_only: true, is_active: true, qa: QA } }),
  });
  console.log("Invited. The person sets their own password from the email; nothing to share.");
} else {
  if (!existing) process.exit(0);
  await call(`/rest/v1/profiles?id=eq.${existing.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: false, deactivated_at: new Date().toISOString() }),
  });
  await call(`/auth/v1/admin/users/${existing.id}`, { method: "PUT", body: JSON.stringify({ ban_duration: "876000h" }) });
  await call("/rest/v1/audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ action: "PREVIEW_ACCOUNT_REVOKED", table_name: "profiles", record_id: existing.id, new_values: { is_active: false, banned: true } }),
  });
  console.log("Revoked: profile inactive (refused on the next request), Auth identity banned, audited.");
}
