/**
 * The database enforces workflow transitions (public.workflow_transition_rules,
 * used by wf_transition). The UI and API compute the same table in TypeScript.
 * This check fails if the two ever diverge.
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { WORKFLOW_TRANSITIONS } from "../src/lib/workflow/status-model";

const MIGRATION = "supabase/migrations/20260923120000_opus55_integrity_hardening.sql";
const sql = fs.readFileSync(MIGRATION, "utf8");
const block = sql.split("insert into public.workflow_transition_rules")[1]?.split(";")[0] ?? "";
const sqlRows = new Set(
  [...block.matchAll(/\('([a-z_]+)', '([a-z_]+)', '([a-z_]+)', '([a-z_]+)'\)/g)].map(
    ([, from, action, stage, to]) => `${from}|${action}|${stage}|${to}`,
  ),
);

const tsRows = new Set<string>();
for (const t of WORKFLOW_TRANSITIONS) {
  for (const from of t.from) {
    for (const stage of t.stage) tsRows.add(`${from}|${t.action}|${stage}|${t.to}`);
  }
}

const missingInSql = [...tsRows].filter((r) => !sqlRows.has(r));
const extraInSql = [...sqlRows].filter((r) => !tsRows.has(r));
assert.equal(sqlRows.size > 0, true, "no SQL transition rows parsed");
assert.deepEqual(missingInSql, [], `transitions missing from SQL: ${missingInSql.join(", ")}`);
assert.deepEqual(extraInSql, [], `SQL transitions not in TypeScript: ${extraInSql.join(", ")}`);
console.log(`Workflow transition parity passed (${tsRows.size} rules).`);
