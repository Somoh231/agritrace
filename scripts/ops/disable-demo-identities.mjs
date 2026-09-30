/**
 * Disable the shared demo identities (accounts on the @agritrace.demo domain).
 *
 * DRY RUN BY DEFAULT — reads only, prints labels (never emails or passwords).
 * Executing requires explicit owner approval, the --execute flag and
 * CONFIRM_DISABLE_DEMO=disable-shared-demo-identities in the environment.
 *
 * Sequence per account (no deletion — production rows reference these users):
 *   1. profiles.is_active = false, deactivated_at = now()   (app denies at once)
 *   2. Auth ban for 100 years                               (no sign-in, no token refresh)
 *   3. Replace the password with a random one               (the published shared password stops working)
 *   4. audit_log row per account
 * Existing access tokens expire at their JWT expiry; middleware already refuses
 * inactive profiles on every request, so nothing waits on that.
 *
 *   node scripts/ops/disable-demo-identities.mjs                 # dry run
 *   CONFIRM_DISABLE_DEMO=disable-shared-demo-identities \
 *     node scripts/ops/disable-demo-identities.mjs --execute     # owner-approved run
 */
import crypto from "node:crypto";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const URL_ = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = "@agritrace.demo";
const EXECUTE = process.argv.includes("--execute");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function call(path, init = {}) {
  const res = await fetch(URL_ + path, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} -> ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const users = [];
for (let page = 1; ; page++) {
  const d = await call(`/auth/v1/admin/users?page=${page}&per_page=200`);
  const batch = d.users ?? [];
  users.push(...batch);
  if (batch.length < 200) break;
}
const demo = users.filter((u) => (u.email ?? "").toLowerCase().endsWith(DOMAIN)).sort((a, b) => a.created_at.localeCompare(b.created_at));
const profiles = demo.length
  ? await call(`/rest/v1/profiles?select=id,role,is_active&id=in.(${demo.map((u) => u.id).join(",")})`)
  : [];

console.log(`${EXECUTE ? "EXECUTE" : "DRY RUN"} — shared demo identities found: ${demo.length}`);
demo.forEach((u, i) => {
  const p = profiles.find((x) => x.id === u.id);
  const banned = u.banned_until && u.banned_until !== "none";
  console.log(`  demo #${i + 1}: profile=${p ? `${p.role}/${p.is_active ? "active" : "inactive"}` : "none"} auth=${banned ? "banned" : "not banned"}`);
});

if (!EXECUTE) {
  console.log("\nPlanned per account: deactivate profile → ban Auth identity → random password → audit_log row. No deletion.");
  console.log("Nothing was changed. Re-run with --execute and CONFIRM_DISABLE_DEMO only after owner approval.");
  process.exit(0);
}
if (process.env.CONFIRM_DISABLE_DEMO !== "disable-shared-demo-identities") {
  console.error("Refusing: set CONFIRM_DISABLE_DEMO=disable-shared-demo-identities to confirm owner approval.");
  process.exit(2);
}

const now = new Date().toISOString();
for (const [i, u] of demo.entries()) {
  await call(`/rest/v1/profiles?id=eq.${u.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: false, deactivated_at: now }),
  });
  await call(`/auth/v1/admin/users/${u.id}`, {
    method: "PUT",
    body: JSON.stringify({ ban_duration: "876000h", password: crypto.randomBytes(36).toString("base64url") }),
  });
  await call(`/rest/v1/audit_log`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ action: "DEMO_IDENTITY_DISABLED", table_name: "profiles", record_id: u.id, new_values: { is_active: false, banned: true, password_rotated: true } }),
  });
  console.log(`  demo #${i + 1}: deactivated, banned, password rotated, audited`);
}
console.log("Done. Verify: re-run without --execute; all accounts should read inactive/banned.");
