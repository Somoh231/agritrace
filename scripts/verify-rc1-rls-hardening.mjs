import assert from "node:assert/strict";
import fs from "node:fs";

const migrationPath =
  "supabase/migrations/20260729220000_rc1_geography_rls_hardening.sql";
const sql = fs.readFileSync(migrationPath, "utf8");

assert.doesNotMatch(sql, /\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
assert.doesNotMatch(sql, /\bauth\.users\b/i);
assert.doesNotMatch(
  sql,
  /warehouse_transfer_orders_select[\s\S]{0,240}using\s*\(\s*true\s*\)/i,
  "warehouse transfer SELECT must not remain globally readable",
);
assert.match(sql, /drop policy if exists warehouse_transfer_orders_write/i);
assert.match(sql, /create policy warehouse_transfer_orders_select/i);
assert.match(sql, /create policy warehouse_transfer_orders_insert/i);
assert.match(sql, /create policy warehouse_transfer_orders_update/i);
assert.match(sql, /create policy warehouse_transfer_orders_delete/i);
assert.match(sql, /p\.is_active is true/);
assert.match(sql, /can_read_warehouse_transfer/);
assert.match(sql, /warehouse_assignments/);
assert.match(sql, /lower\(w\.county\) = lower\(p\.county\)/);
assert.match(sql, /can_read_field_report/);
assert.match(sql, /officer\.county is not null/);
assert.match(sql, /lower\(officer\.county\) = lower\(p\.county\)/);
assert.match(sql, /officer\.district/);
assert.match(sql, /can_read_geo_location/);
assert.match(sql, /lower\(f\.district\) = lower\(p\.district\)/);
assert.match(sql, /f\.registered_by = p\.id/);
assert.doesNotMatch(
  sql,
  /security definer\s+set search_path = public/i,
  "SECURITY DEFINER helpers must not trust the writable public schema",
);
assert.equal(
  (sql.match(/security definer\s+set search_path = pg_catalog/gi) ?? []).length,
  6,
  "all six RC1 authorization helpers must use the hardened search path",
);
assert.match(
  sql,
  /from public, anon, authenticated, service_role/i,
  "function ACLs must be reset explicitly before grants",
);

console.log("RC1 RLS hardening migration contract passed.");
