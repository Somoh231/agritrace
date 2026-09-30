-- Profile role-assignment scenarios. Every scenario runs in its own transaction
-- and is rolled back. Output lines: RESULT|<scenario>|<observed>
-- Run by scripts/db-tests/profile-role-hardening.mjs against a throwaway local
-- Supabase Postgres container; never against a real project.
\set ON_ERROR_STOP 1
\set QUIET 1
\pset tuples_only on
\pset format unaligned

-- Users act through the same GUCs PostgREST sets for a request.
create or replace function pg_temp.act_as(uid uuid, jwt_role text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true),
         set_config('request.jwt.claim.role', jwt_role, true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', jwt_role)::text, true);
$$;

-- S1/S2/S3: self-registration with and without a chosen role
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 's1@example.test', '{"role":"admin","full_name":"S1"}'),
  ('00000000-0000-4000-8000-0000000000a2', 's2@example.test', '{"role":"super_admin"}'),
  ('00000000-0000-4000-8000-0000000000a3', 's3@example.test', '{}');
select 'RESULT|S1_signup_meta_admin|' || role || ',' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000a1';
select 'RESULT|S2_signup_meta_super_admin|' || role || ',' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000a2';
select 'RESULT|S3_signup_no_meta|' || role || ',' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000a3';
select 'RESULT|S3b_signup_full_name_kept|' || full_name from public.profiles where id = '00000000-0000-4000-8000-0000000000a1';
rollback;

-- S4: an active field agent promotes themselves through the REST API
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000b1', 'b1@example.test', '{}');
update public.profiles set role = 'field_agent', is_active = true where id = '00000000-0000-4000-8000-0000000000b1';
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b1', 'authenticated');
set local role authenticated;
do $$ begin
  update public.profiles set role = 'super_admin' where id = auth.uid();
  raise notice 'RESULT|S4_self_promote_stmt|accepted';
exception when others then raise notice 'RESULT|S4_self_promote_stmt|blocked:%', sqlstate; end $$;
reset role;
select 'RESULT|S4_self_promote_role_after|' || role from public.profiles where id = '00000000-0000-4000-8000-0000000000b1';
rollback;

-- S5: a deactivated user reactivates themselves
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000c1', 'c1@example.test', '{}');
update public.profiles set role = 'county_officer', is_active = false where id = '00000000-0000-4000-8000-0000000000c1';
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c1', 'authenticated');
set local role authenticated;
do $$ begin
  update public.profiles set is_active = true where id = auth.uid();
  raise notice 'RESULT|S5_self_reactivate_stmt|accepted';
exception when others then raise notice 'RESULT|S5_self_reactivate_stmt|blocked:%', sqlstate; end $$;
reset role;
select 'RESULT|S5_self_reactivate_after|' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000c1';
rollback;

-- S6: harmless self-edit (name, phone) still works
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000d1', 'd1@example.test', '{}');
update public.profiles set role = 'field_agent', is_active = true where id = '00000000-0000-4000-8000-0000000000d1';
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d1', 'authenticated');
set local role authenticated;
do $$ begin
  update public.profiles set full_name = 'Renamed', phone = '000' where id = auth.uid();
  raise notice 'RESULT|S6_self_rename_stmt|accepted';
exception when others then raise notice 'RESULT|S6_self_rename_stmt|blocked:%', sqlstate; end $$;
reset role;
select 'RESULT|S6_self_rename_after|' || full_name from public.profiles where id = '00000000-0000-4000-8000-0000000000d1';
rollback;

-- S7: a ministry officer promotes another user through the REST API
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000e1', 'e1@example.test', '{}'),
  ('00000000-0000-4000-8000-0000000000e2', 'e2@example.test', '{}');
update public.profiles set role = 'ministry_officer', is_active = true where id = '00000000-0000-4000-8000-0000000000e1';
update public.profiles set role = 'field_agent', is_active = true where id = '00000000-0000-4000-8000-0000000000e2';
select pg_temp.act_as('00000000-0000-4000-8000-0000000000e1', 'authenticated');
set local role authenticated;
do $$ begin
  update public.profiles set role = 'super_admin' where id = '00000000-0000-4000-8000-0000000000e2';
  raise notice 'RESULT|S7_peer_promote_stmt|accepted';
exception when others then raise notice 'RESULT|S7_peer_promote_stmt|blocked:%', sqlstate; end $$;
reset role;
select 'RESULT|S7_peer_promote_role_after|' || role from public.profiles where id = '00000000-0000-4000-8000-0000000000e2';
rollback;

-- S8: the admin console (service role) assigns a role — allowed and audited
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000f1', 'f1@example.test', '{}');
select pg_temp.act_as(null, 'service_role');
set local role service_role;
do $$ begin
  update public.profiles set role = 'county_officer', is_active = true where id = '00000000-0000-4000-8000-0000000000f1';
  raise notice 'RESULT|S8_service_assign_stmt|accepted';
exception when others then raise notice 'RESULT|S8_service_assign_stmt|blocked:%', sqlstate; end $$;
reset role;
select 'RESULT|S8_service_assign_after|' || role || ',' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000f1';
select 'RESULT|S8_audit_rows|' || count(*) from public.audit_log
  where record_id = '00000000-0000-4000-8000-0000000000f1' and action = 'PROFILE_PRIVILEGE_CHANGE';
rollback;

-- S9: a deactivated county officer's role as seen by row-level security
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-000000000101', 'g1@example.test', '{}');
update public.profiles set role = 'county_officer', county = 'Bong', is_active = false where id = '00000000-0000-4000-8000-000000000101';
select pg_temp.act_as('00000000-0000-4000-8000-000000000101', 'authenticated');
set local role authenticated;
select 'RESULT|S9_inactive_profile_role|' || coalesce(public.profile_role()::text, 'none');
select 'RESULT|S9_inactive_profile_county|' || coalesce(public.profile_county(), 'none');
reset role;
rollback;

-- S10: an active user's role is unchanged for row-level security
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-000000000111', 'h1@example.test', '{}');
update public.profiles set role = 'dao_officer', district = 'Gbarnga', is_active = true where id = '00000000-0000-4000-8000-000000000111';
select pg_temp.act_as('00000000-0000-4000-8000-000000000111', 'authenticated');
set local role authenticated;
select 'RESULT|S10_active_profile_role|' || coalesce(public.profile_role()::text, 'none') || ',' || coalesce(public.profile_district(), 'none');
reset role;
rollback;

-- S11: the pre-existing administrator seeded before any change keeps role and status
select 'RESULT|S11_existing_admin|' || role || ',' || is_active from public.profiles where id = '00000000-0000-4000-8000-0000000000ff';
