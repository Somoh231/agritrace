/**
 * Proves the profile role-assignment proposal against a throwaway local
 * Supabase Postgres (Docker image public.ecr.aws/supabase/postgres). Never
 * touches a real project.
 *
 *   1. replay supabase/migrations/*.sql  → run scenarios, expect VULNERABLE
 *   2. apply the proposal                → run scenarios, expect HARDENED
 *   3. apply the rollback                → run scenarios, expect VULNERABLE again
 *
 * Usage: npm run test:db:roles   (requires Docker and the image locally)
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IMAGE = process.env.SUPABASE_PG_IMAGE ?? "public.ecr.aws/supabase/postgres:17.6.1.166";
const NAME = `agv-roletest-${process.pid}`;
const root = process.cwd();
const PROPOSAL = path.join(root, "supabase/proposals/20260926100000_harden_profile_role_assignment.sql");
const ROLLBACK = path.join(root, "supabase/proposals/20260926100000_harden_profile_role_assignment.rollback.sql");
const SCENARIOS = path.join(root, "supabase/tests/profile_role_scenarios.sql");

const psql = (sql, user = "postgres") => {
  const r = spawnSync("docker", ["exec", "-i", NAME, "psql", "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q"], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql failed (${user}): ${r.stderr || r.stdout}`);
  return `${r.stdout}\n${r.stderr}`;
};
const scenarios = () => {
  const out = psql(fs.readFileSync(SCENARIOS, "utf8"), "supabase_admin");
  const res = {};
  for (const m of out.matchAll(/RESULT\|([^|\s]+)\|([^\n]*)/g)) res[m[1]] = m[2].trim();
  return res;
};

const VULNERABLE = {
  S1_signup_meta_admin: "admin,true",
  S2_signup_meta_super_admin: "super_admin,true",
  S4_self_promote_role_after: "super_admin",
  S5_self_reactivate_after: "true",
  S7_peer_promote_role_after: "super_admin",
  S9_inactive_profile_role: "county_officer",
};
const HARDENED = {
  S1_signup_meta_admin: "field_agent,false",
  S2_signup_meta_super_admin: "field_agent,false",
  S3_signup_no_meta: "field_agent,false",
  S3b_signup_full_name_kept: "S1",
  S4_self_promote_stmt: "blocked:42501",
  S4_self_promote_role_after: "field_agent",
  S5_self_reactivate_stmt: "blocked:42501",
  S5_self_reactivate_after: "false",
  S6_self_rename_stmt: "accepted",
  S6_self_rename_after: "Renamed",
  S7_peer_promote_stmt: "blocked:42501",
  S7_peer_promote_role_after: "field_agent",
  S8_service_assign_stmt: "accepted",
  S8_service_assign_after: "county_officer,true",
  S8_audit_rows: "1",
  S9_inactive_profile_role: "none",
  S9_inactive_profile_county: "none",
  S10_active_profile_role: "dao_officer,Gbarnga",
  S11_existing_admin: "admin,true",
};

let failures = 0;
const expect = (phase, got, want) => {
  for (const [k, v] of Object.entries(want)) {
    const ok = got[k] === v;
    if (!ok) failures++;
    console.log(`  ${ok ? "✓" : "✗"} [${phase}] ${k}: ${got[k] ?? "(missing)"}${ok ? "" : `  (expected ${v})`}`);
  }
};

try {
  execFileSync("docker", ["run", "-d", "--rm", "--name", NAME, "-e", "POSTGRES_PASSWORD=postgres", IMAGE], { stdio: "ignore" });
  for (let i = 0; i < 90; i++) {
    const r = spawnSync("docker", ["exec", NAME, "psql", "-U", "supabase_admin", "-d", "postgres", "-tAc", "select 1"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "1") break;
    await new Promise((res) => setTimeout(res, 1000));
  }
  await new Promise((res) => setTimeout(res, 3000));
  for (const f of fs.readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
    psql(fs.readFileSync(path.join(root, "supabase/migrations", f), "utf8"));
  }
  // An administrator that exists before the change (S11).
  psql(`insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000ff', 'admin@example.test', '{"role":"admin"}');
        update public.profiles set role = 'admin', is_active = true where id = '00000000-0000-4000-8000-0000000000ff';`, "supabase_admin");

  console.log("current migrations (expect the vulnerabilities to be present):");
  expect("before", scenarios(), VULNERABLE);

  psql(fs.readFileSync(PROPOSAL, "utf8"));
  console.log("with the proposal applied:");
  expect("hardened", scenarios(), HARDENED);

  psql(fs.readFileSync(ROLLBACK, "utf8"));
  console.log("after the rollback (previous behaviour restored):");
  expect("rollback", scenarios(), { ...VULNERABLE, S11_existing_admin: "admin,true" });
} finally {
  spawnSync("docker", ["rm", "-f", NAME], { stdio: "ignore" });
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll role-assignment checks passed");
process.exit(failures ? 1 : 0);
