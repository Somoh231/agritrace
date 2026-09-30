/**
 * Proves the read-only preview proposal against a throwaway local Supabase
 * Postgres (Docker image public.ecr.aws/supabase/postgres). Never touches a
 * real project.
 *
 *   1. replay supabase/migrations/*.sql + the 2026-09-26 role hardening (live in production)
 *   2. apply 20260930100000_preview_read_only_and_scoped_writes.sql → scenarios must be HARDENED
 *   3. load supabase/seed/preview-synthetic.sql → refused without the staging
 *      marker; with it, only synthetic pilot-county records (run twice: idempotent)
 *   4. apply its rollback → policies and column gone, original farmers_update restored
 *
 * Usage: npm run test:db:preview   (requires Docker and the image locally)
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IMAGE = process.env.SUPABASE_PG_IMAGE ?? "public.ecr.aws/supabase/postgres:17.6.1.166";
const NAME = `agv-previewtest-${process.pid}`;
const root = process.cwd();
const ROLE_HARDENING = path.join(root, "supabase/proposals/20260926100000_harden_profile_role_assignment.sql");
const PROPOSAL = path.join(root, "supabase/proposals/20260930100000_preview_read_only_and_scoped_writes.sql");
const ROLLBACK = path.join(root, "supabase/proposals/20260930100000_preview_read_only_and_scoped_writes.rollback.sql");
const SCENARIOS = path.join(root, "supabase/tests/preview_readonly_scenarios.sql");
const SEED = path.join(root, "supabase/seed/preview-synthetic.sql");

const psql = (sql, user = "postgres") => {
  const r = spawnSync("docker", ["exec", "-i", NAME, "psql", "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q"], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql failed (${user}): ${r.stderr || r.stdout}`);
  return `${r.stdout}\n${r.stderr}`;
};
const results = (out) => {
  const res = {};
  for (const m of out.matchAll(/RESULT\|([^|\s]+)\|([^\n]*)/g)) res[m[1]] = m[2].trim();
  return res;
};

const BLOCKED = "blocked:42501";
const HARDENED = {
  // Preview account: inserts refused by RLS, updates/deletes touch nothing, reads still work.
  P_insert_farmer: BLOCKED,
  P_update_farmer: "rows:0",
  P_delete_farmer: "rows:0",
  P_insert_warehouse: BLOCKED,
  P_update_warehouse: "rows:0",
  P_insert_inventory_movement: BLOCKED,
  P_insert_transfer: BLOCKED,
  P_insert_report: BLOCKED,
  P_insert_submission: BLOCKED,
  P_update_submission_status: "rows:0",
  P_insert_workflow_action: BLOCKED,
  P_update_other_profile: "rows:0",
  P_clear_own_preview_flag: "rows:0",
  P_read_farmers: "rows:2",
  // Control: the same role without the preview flag keeps its permissions.
  M_insert_farmer: "rows:1",
  M_insert_warehouse: "rows:1",
  M_insert_inventory_movement: "rows:1",
  M_insert_transfer: "rows:1",
  M_insert_report: "rows:1",
  M_insert_workflow_action: "rows:1",
  // Scoped writes.
  F_update_own_district: "rows:1",
  F_update_other_county: "rows:0",
  F_move_record_out_of_scope: BLOCKED,
  C_update_any_farmer: "rows:0",
  K_update_own_county: "rows:1",
  K_update_other_county: "rows:0",
  COVERAGE_tables_missing_preview_policies: "0",
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
  psql(fs.readFileSync(ROLE_HARDENING, "utf8"));

  console.log("preview read-only + scoped writes — proposal applied");
  psql(fs.readFileSync(PROPOSAL, "utf8"));
  expect("hardened", results(psql(fs.readFileSync(SCENARIOS, "utf8"), "supabase_admin")), HARDENED);

  console.log("synthetic staging seed");
  const seedOutcome = () => {
    try {
      psql(fs.readFileSync(SEED, "utf8"));
      return "loaded";
    } catch (e) {
      const m = /refused: ([^\n]+)/.exec(String(e));
      return m ? `refused:${m[1].includes("marker") ? "no_marker" : "real_data_present"}` : String(e);
    }
  };
  const noMarker = seedOutcome();
  psql(`create schema if not exists agrivault_env;
        create table if not exists agrivault_env.marker (environment text primary key check (environment = 'staging'));
        insert into agrivault_env.marker values ('staging') on conflict do nothing;`);
  // A non-synthetic registry row stands in for real data: the seed must refuse.
  psql("insert into public.farmers (full_name, county) values ('Registry row', 'Nimba');", "supabase_admin");
  const realData = seedOutcome();
  psql("delete from public.farmers where coalesce(national_id, '') not like 'SMP-%';", "supabase_admin");
  psql(fs.readFileSync(SEED, "utf8"));
  psql(fs.readFileSync(SEED, "utf8"));
  const seeded = results(
    psql(
      `\\pset tuples_only on
       with f as (select * from public.farmers where national_id like 'SMP-%')
       select 'RESULT|S_farmers|' || count(*) from f
       union all select 'RESULT|S_farmers_outside_pilot|' || count(*) from f where county not in ('Nimba', 'Bong', 'Lofa')
       union all select 'RESULT|S_farmers_non_sample_name|' || count(*) from f where full_name !~ '^Sample farmer [0-9]{2}$'
       union all select 'RESULT|S_farmers_real_phone|' || count(*) from f where phone !~ '^\\+231 000 000 [0-9]{3}$'
       union all select 'RESULT|S_plots|' || count(*) from public.plots p join f on f.id = p.farmer_id
       union all select 'RESULT|S_production|' || count(*) from public.rice_production_records r join f on f.id = r.farmer_id
       union all select 'RESULT|S_warehouses|' || count(*) from public.warehouses where ministry_code like 'SMP-WH-%' and county in ('Nimba', 'Bong', 'Lofa')
       union all select 'RESULT|S_stock|' || count(*) from public.warehouse_stock where batch_code like 'SMP-BATCH-%'
       union all select 'RESULT|S_movements|' || count(*) from public.inventory_movements where reference like 'SMP-MV-%'
       union all select 'RESULT|S_transfers|' || count(*) from public.warehouse_transfer_orders where transfer_code like 'SMP-TR-%'
       union all select 'RESULT|S_submissions|' || count(*) from public.operational_submissions where reference_code like 'SMP-SUB-%'
       union all select 'RESULT|S_workflow_history|' || count(*) from public.workflow_actions a join public.operational_submissions s on s.id = a.submission_id where s.reference_code like 'SMP-SUB-%'
       union all select 'RESULT|S_linked_accounts|' || (select count(*) from public.operational_submissions where reference_code like 'SMP-SUB-%' and actor_id is not null)
                                                  + (select count(*) from public.workflow_actions a join public.operational_submissions s on s.id = a.submission_id where s.reference_code like 'SMP-SUB-%' and a.actor_id is not null);`,
    ),
  );
  expect("seed", { S_without_staging_marker: noMarker, S_with_real_farmers_present: realData, ...seeded }, {
    S_without_staging_marker: "refused:no_marker",
    S_with_real_farmers_present: "refused:real_data_present",
    S_farmers: "24",
    S_farmers_outside_pilot: "0",
    S_farmers_non_sample_name: "0",
    S_farmers_real_phone: "0",
    S_plots: "24",
    S_production: "24",
    S_warehouses: "3",
    S_stock: "9",
    S_movements: "6",
    S_transfers: "3",
    S_submissions: "8",
    S_workflow_history: "31",
    S_linked_accounts: "0",
  });

  console.log("rollback applied");
  psql(fs.readFileSync(ROLLBACK, "utf8"));
  const after = results(
    psql(
      `\\pset tuples_only on
       select 'RESULT|R_preview_policies|' || count(*) from pg_policies where policyname like 'preview_ro_%';
       select 'RESULT|R_preview_column|' || count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'preview_read_only';
       select 'RESULT|R_farmers_update_restored|' || (qual like '%call_center_agent%') from pg_policies where tablename = 'farmers' and policyname = 'farmers_update';`,
    ),
  );
  expect("rolled back", after, { R_preview_policies: "0", R_preview_column: "0", R_farmers_update_restored: "true" });
} catch (e) {
  failures++;
  console.error(e instanceof Error ? e.message : e);
} finally {
  spawnSync("docker", ["stop", NAME], { stdio: "ignore" });
}

if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("all preview read-only checks passed");
