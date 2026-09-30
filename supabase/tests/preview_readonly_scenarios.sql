-- Read-only preview accounts and scoped farmer/plot/production writes.
-- Every scenario runs in its own transaction and is rolled back.
-- Output lines: RESULT|<scenario>|<observed>
-- Run by scripts/db-tests/preview-readonly.mjs against a throwaway local
-- Supabase Postgres container; never against a real project.
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
\pset format unaligned

create or replace function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid::text, true),
         set_config('request.jwt.claim.role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Actors (created as the database owner, like the service role would).
--   p1 preview ministry_officer · m1 ordinary ministry_officer (control)
--   f1 field_agent Nimba/Sanniquellie · c1 call_center_agent · k1 county_officer Bong
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000aa001', 'p1@example.test', '{}'),
  ('00000000-0000-4000-8000-0000000bb001', 'm1@example.test', '{}'),
  ('00000000-0000-4000-8000-0000000cc001', 'f1@example.test', '{}'),
  ('00000000-0000-4000-8000-0000000dd001', 'c1@example.test', '{}'),
  ('00000000-0000-4000-8000-0000000ee001', 'k1@example.test', '{}');
update public.profiles set role = 'ministry_officer', is_active = true, preview_read_only = true where id = '00000000-0000-4000-8000-0000000aa001';
update public.profiles set role = 'ministry_officer', is_active = true where id = '00000000-0000-4000-8000-0000000bb001';
update public.profiles set role = 'field_agent', is_active = true, county = 'Nimba', district = 'Sanniquellie' where id = '00000000-0000-4000-8000-0000000cc001';
update public.profiles set role = 'call_center_agent', is_active = true where id = '00000000-0000-4000-8000-0000000dd001';
update public.profiles set role = 'county_officer', is_active = true, county = 'Bong' where id = '00000000-0000-4000-8000-0000000ee001';
insert into public.farmers (id, full_name, county, district) values
  ('00000000-0000-4000-8000-0000000a0001', 'Sample farmer 01', 'Nimba', 'Sanniquellie'),
  ('00000000-0000-4000-8000-0000000a0002', 'Sample farmer 02', 'Bong', 'Fuamah');
insert into public.warehouses (id, name, county) values ('00000000-0000-4000-8000-0000000b0001', 'Sample warehouse A', 'Nimba');
insert into public.inventory_items (id, name, category, sku) values ('00000000-0000-4000-8000-0000000d0001', 'Sample seed', 'rice_seed', 'SMP-SEED');
insert into public.operational_submissions (id, title, submission_type, county, actor_id)
  values ('00000000-0000-4000-8000-0000000e0001', 'Sample submission', 'farmer_registration', 'Nimba', '00000000-0000-4000-8000-0000000bb001');

-- Try one statement as a given actor; report accepted / blocked:<sqlstate> / rows:<n>.
create or replace function pg_temp.try(uid uuid, label text, stmt text) returns void language plpgsql as $$
declare n int;
begin
  perform pg_temp.act_as(uid);
  execute 'set local role authenticated';
  begin
    execute stmt;
    get diagnostics n = row_count;
    raise notice 'RESULT|%|rows:%', label, n;
  exception when others then
    raise notice 'RESULT|%|blocked:%', label, sqlstate;
  end;
  execute 'reset role';
end $$;

-- Preview account: every write fails closed (inserts raise, updates/deletes touch 0 rows).
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_farmer', $s$insert into public.farmers (full_name, county) values ('x', 'Nimba')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_update_farmer', $s$update public.farmers set notes = 'x'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_delete_farmer', $s$delete from public.farmers$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_warehouse', $s$insert into public.warehouses (name, county) values ('x', 'Nimba')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_update_warehouse', $s$update public.warehouses set name = 'x'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_inventory_movement', $s$insert into public.inventory_movements (movement_type, inventory_item_id, quantity) values ('receipt', '00000000-0000-4000-8000-0000000d0001', 1)$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_transfer', $s$insert into public.warehouse_transfer_orders (status, transfer_code, quantity) values ('requested', 'SMP-T-X', 1)$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_report', $s$insert into public.reports (report_code, title) values ('SMP-R-X', 'x')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_submission', $s$insert into public.operational_submissions (title, submission_type, county, actor_id) values ('x', 'farmer_registration', 'Nimba', '00000000-0000-4000-8000-0000000aa001')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_update_submission_status', $s$update public.operational_submissions set status = 'ministry_approved'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_insert_workflow_action', $s$insert into public.workflow_actions (submission_id, action, actor_id) values ('00000000-0000-4000-8000-0000000e0001', 'approve', '00000000-0000-4000-8000-0000000aa001')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_update_other_profile', $s$update public.profiles set full_name = 'x' where id <> auth.uid()$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_clear_own_preview_flag', $s$update public.profiles set preview_read_only = false where id = auth.uid()$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000aa001', 'P_read_farmers', $s$select 1 from public.farmers$s$);

-- Control: the same writes by an ordinary ministry_officer are accepted (the block is the preview flag).
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_farmer', $s$insert into public.farmers (full_name, county) values ('x', 'Nimba')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_warehouse', $s$insert into public.warehouses (name, county) values ('x', 'Nimba')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_inventory_movement', $s$insert into public.inventory_movements (movement_type, inventory_item_id, quantity) values ('receipt', '00000000-0000-4000-8000-0000000d0001', 1)$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_transfer', $s$insert into public.warehouse_transfer_orders (status, transfer_code, quantity) values ('requested', 'SMP-T-Y', 1)$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_report', $s$insert into public.reports (report_code, title) values ('SMP-R-Y', 'x')$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000bb001', 'M_insert_workflow_action', $s$insert into public.workflow_actions (submission_id, action, actor_id) values ('00000000-0000-4000-8000-0000000e0001', 'comment', '00000000-0000-4000-8000-0000000bb001')$s$);

-- Scoped farmer updates.
select pg_temp.try('00000000-0000-4000-8000-0000000cc001', 'F_update_own_district', $s$update public.farmers set notes = 'x' where id = '00000000-0000-4000-8000-0000000a0001'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000cc001', 'F_update_other_county', $s$update public.farmers set notes = 'x' where id = '00000000-0000-4000-8000-0000000a0002'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000cc001', 'F_move_record_out_of_scope', $s$update public.farmers set county = 'Bong' where id = '00000000-0000-4000-8000-0000000a0001'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000dd001', 'C_update_any_farmer', $s$update public.farmers set notes = 'x'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000ee001', 'K_update_own_county', $s$update public.farmers set notes = 'x' where county = 'Bong'$s$);
select pg_temp.try('00000000-0000-4000-8000-0000000ee001', 'K_update_other_county', $s$update public.farmers set notes = 'x' where county = 'Nimba'$s$);

-- Coverage: every RLS table carries all three preview policies.
select 'RESULT|COVERAGE_tables_missing_preview_policies|' || count(*)
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname and p.policyname like 'preview_ro_%') <> 3;
rollback;
