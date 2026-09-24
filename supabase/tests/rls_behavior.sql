-- Behavioral RLS / authorization suite. Executes real statements as the
-- `authenticated` role with emulated JWT claims against a DISPOSABLE database
-- that has every migration applied. Never run against a shared project.
--
-- Run: npm run test:rls:behavior   (scripts/run-rls-behavior.sh)
--
-- Every probe runs inside a subtransaction that is always rolled back, so
-- probes cannot affect each other. Only the result row is kept.
\set ON_ERROR_STOP 1
\pset footer off

create schema if not exists rls_test;
create table if not exists rls_test.results (
  seq bigserial primary key,
  label text not null,
  ok boolean not null,
  detail text
);
truncate rls_test.results;
grant usage on schema rls_test to authenticated, service_role;
grant insert, select on rls_test.results to authenticated, service_role;
grant usage on sequence rls_test.results_seq_seq to authenticated, service_role;

create or replace function rls_test.login(uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- expect_rows: true  => statement must succeed and affect/return >= 1 row
--              false => statement must fail OR affect 0 rows
create or replace function rls_test.probe(label text, stmt text, expect_rows boolean)
returns void
language plpgsql
as $$
declare
  n bigint := -1;
  err text;
begin
  begin
    execute stmt;
    get diagnostics n = row_count;
    raise exception using errcode = 'RT001', message = n::text;
  exception
    when sqlstate 'RT001' then
      n := sqlerrm::bigint;
    when others then
      err := sqlstate || ' ' || sqlerrm;
  end;
  insert into rls_test.results(label, ok, detail)
  values (
    label,
    case when err is not null then not expect_rows else (n > 0) = expect_rows end,
    coalesce(err, 'rows=' || n)
  );
end;
$$;

-- statement must fail with an error whose message contains `expected`
create or replace function rls_test.probe_error(label text, stmt text, expected text)
returns void
language plpgsql
as $$
declare
  err text;
begin
  begin
    execute stmt;
    raise exception using errcode = 'RT003', message = 'statement succeeded';
  exception
    when others then
      err := sqlstate || ' ' || sqlerrm;
  end;
  insert into rls_test.results(label, ok, detail)
  values (label, err not like 'RT003%' and position(expected in err) > 0, err || ' | expected: ' || expected);
end;
$$;

-- expect an exact scalar result from a query
create or replace function rls_test.probe_value(label text, query text, expected text)
returns void
language plpgsql
as $$
declare
  v text;
  err text;
begin
  begin
    execute query into v;
    raise exception using errcode = 'RT002', message = coalesce(v, '<<NULL>>');
  exception
    when sqlstate 'RT002' then
      v := nullif(sqlerrm, '<<NULL>>');
    when others then
      err := sqlstate || ' ' || sqlerrm;
  end;
  insert into rls_test.results(label, ok, detail)
  values (label, err is null and v is not distinct from expected, coalesce(err, 'value=' || coalesce(v, 'NULL') || ' expected=' || expected));
end;
$$;

-- Runs a transition, then reads back state and ledger in later statements
-- (fresh snapshots), proving the change and its ledger row commit together.
create or replace function rls_test.transition_and_ledger(sub uuid, act text)
returns text
language plpgsql
as $$
declare
  st text;
  n bigint;
begin
  perform public.wf_transition(sub, act, 'probe');
  select status::text into st from public.operational_submissions where id = sub;
  select count(*) into n from public.workflow_actions where submission_id = sub and action = act;
  return st || '/' || n;
end;
$$;

grant usage on schema rls_test to authenticated, service_role;
grant execute on all functions in schema rls_test to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixtures (as database owner, emulating the audited service-role provisioning path)
-- ---------------------------------------------------------------------------
insert into public.counties(name, is_pilot) values ('Bong', true), ('Nimba', true) on conflict do nothing;
insert into public.districts(county_id, name)
select c.id, d.name
from public.counties c
join (values ('Bong', 'Jorquelleh'), ('Bong', 'Suakoko'), ('Nimba', 'Sanniquellie-Mah')) d(county, name)
  on d.county = c.name
on conflict do nothing;
insert into public.organizations(id, name, type)
values ('0a000000-0000-4000-8000-000000000001', 'Ministry of Agriculture (test)', 'government')
on conflict do nothing;
insert into public.warehouses(id, name, county) values
  ('0b000000-0000-4000-8000-000000000001', 'Bong WH', 'Bong'),
  ('0b000000-0000-4000-8000-000000000002', 'Nimba WH', 'Nimba')
on conflict do nothing;

create temporary table fx(key text primary key, id uuid, role public.user_role, county text, district text, active boolean);
insert into fx values
  ('bong_clan',   'a1000000-0000-4000-8000-000000000001', 'clan_technician', 'Bong', 'Jorquelleh', true),
  ('bong_clan2',  'a1000000-0000-4000-8000-000000000011', 'clan_technician', 'Bong', 'Suakoko', true),
  ('bong_dao',    'a1000000-0000-4000-8000-000000000002', 'dao_officer', 'Bong', 'Jorquelleh', true),
  ('bong_dao_s',  'a1000000-0000-4000-8000-000000000012', 'dao_officer', 'Bong', 'Suakoko', true),
  ('nimba_dao',   'a1000000-0000-4000-8000-000000000003', 'dao_officer', 'Nimba', 'Sanniquellie-Mah', true),
  ('bong_cac',    'a1000000-0000-4000-8000-000000000004', 'county_agriculture_coordinator', 'Bong', null, true),
  ('ministry',    'a1000000-0000-4000-8000-000000000005', 'ministry_officer', null, null, true),
  ('donor',       'a1000000-0000-4000-8000-000000000006', 'donor_observer', null, null, true),
  ('auditor',     'a1000000-0000-4000-8000-000000000007', 'auditor', null, null, true),
  ('bong_wh',     'a1000000-0000-4000-8000-000000000008', 'warehouse_manager', 'Bong', null, true),
  ('legacy_fa',   'a1000000-0000-4000-8000-000000000009', 'field_agent', 'Bong', null, true),
  ('inactive',    'a1000000-0000-4000-8000-000000000010', 'clan_technician', 'Bong', 'Jorquelleh', false),
  ('super1',      'a1000000-0000-4000-8000-000000000020', 'super_admin', null, null, true),
  ('super2',      'a1000000-0000-4000-8000-000000000021', 'super_admin', null, null, true),
  ('madmin',      'a1000000-0000-4000-8000-000000000022', 'ministry_admin', null, null, true);

insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       key || '@rls-test.invalid', '{}'::jsonb, now(), now()
from fx
on conflict do nothing;

insert into public.warehouse_assignments(profile_id, warehouse_id)
values ('a1000000-0000-4000-8000-000000000008', '0b000000-0000-4000-8000-000000000001')
on conflict do nothing;

update public.profiles p
set role = fx.role,
    county = fx.county,
    district = fx.district,
    clan_or_field_area = case when fx.role = 'clan_technician' then 'Clan A' end,
    organization_id = '0a000000-0000-4000-8000-000000000001',
    is_active = fx.active,
    account_status = case when fx.active then 'active' else 'inactive' end,
    access_transition_status = 'complete',
    deactivated_at = case when fx.active then null else now() end
from fx
where p.id = fx.id;

insert into public.profile_role_assignments(profile_id, role, is_primary, provenance)
select id, role, true, 'admin_assigned' from fx
on conflict do nothing;
-- bong_dao also holds a secondary, non-primary county role
insert into public.profile_role_assignments(profile_id, role, is_primary, provenance)
values ('a1000000-0000-4000-8000-000000000002', 'county_officer', false, 'admin_assigned');

-- Operational fixtures
insert into public.farmers(id, full_name, county, district, national_id, phone, registered_by, verification_status) values
  ('f1000000-0000-4000-8000-000000000001', 'Bong Jorquelleh Farmer', 'Bong', 'Jorquelleh', 'LR-B-1', '0770000001', 'a1000000-0000-4000-8000-000000000001', 'pending'),
  ('f1000000-0000-4000-8000-000000000002', 'Nimba Farmer', 'Nimba', 'Sanniquellie-Mah', 'LR-N-1', '0770000002', null, 'pending'),
  ('f1000000-0000-4000-8000-000000000003', 'Bong Suakoko Farmer', 'Bong', 'Suakoko', 'LR-B-2', '0770000003', null, 'pending')
on conflict do nothing;
insert into public.farmer_visits(id, farmer_id, visited_by, notes) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'nimba visit')
on conflict do nothing;
insert into public.operational_submissions(id, reference_code, submission_type, title, status, actor_id, county, district, metadata) values
  ('51000000-0000-4000-8000-000000000001', 'SUB-T1', 'farmer_registration', 'Bong sub', 'submitted', 'a1000000-0000-4000-8000-000000000001', 'Bong', 'Jorquelleh', '{"payload_snapshot":{"national_id":"LR-B-1"}}'),
  ('51000000-0000-4000-8000-000000000002', 'SUB-T2', 'farmer_registration', 'Nimba sub', 'submitted', 'a1000000-0000-4000-8000-000000000003', 'Nimba', 'Sanniquellie-Mah', '{}')
on conflict do nothing;
insert into public.warehouse_transfer_orders(transfer_code, warehouse_from, warehouse_to, quantity, status) values
  ('TRF-T-BONG', '0b000000-0000-4000-8000-000000000001', null, 5, 'requested'),
  ('TRF-T-NIMBA', '0b000000-0000-4000-8000-000000000002', null, 5, 'requested')
on conflict do nothing;
insert into public.field_reports(county, officer_profile_id, summary, channel) values
  ('Nimba', 'a1000000-0000-4000-8000-000000000003', 'nimba report', 'online');

-- ---------------------------------------------------------------------------
-- Identity / signup
-- ---------------------------------------------------------------------------
insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('a1000000-0000-4000-8000-0000000000ff', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'signup-attacker@rls-test.invalid', '{"role":"super_admin"}', now(), now())
on conflict do nothing;
select rls_test.probe_value('ID-01 signup metadata cannot grant a role',
  $q$select role::text || '/' || is_active::text from public.profiles where id = 'a1000000-0000-4000-8000-0000000000ff'$q$,
  'field_agent/false');

begin; select rls_test.login('a1000000-0000-4000-8000-0000000000ff');
select rls_test.probe('ID-02 fresh signup reads no counties', 'select 1 from public.counties', false);
select rls_test.probe('ID-03 fresh signup reads no farmers', 'select 1 from public.farmers', false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('ID-04 CLAN cannot self-escalate role',
  $q$update public.profiles set role = 'super_admin' where id = auth.uid()$q$, false);
select rls_test.probe('ID-05 CLAN cannot move own county',
  $q$update public.profiles set county = 'Nimba' where id = auth.uid()$q$, false);
select rls_test.probe('ID-06 CLAN cannot self-assign a role row',
  $q$insert into public.profile_role_assignments(profile_id, role, is_primary, provenance) values (auth.uid(), 'super_admin', false, 'admin_assigned')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000005');
select rls_test.probe('ID-07 ministry officer cannot rewrite another profile role',
  $q$update public.profiles set role = 'super_admin' where id = 'a1000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe('ID-08 ministry officer cannot rewrite warehouse assignments',
  $q$insert into public.warehouse_assignments(profile_id, warehouse_id) values ('a1000000-0000-4000-8000-000000000005', '0b000000-0000-4000-8000-000000000002')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000010');
select rls_test.probe('ID-09 deactivated operator reads no farmers', 'select 1 from public.farmers', false);
select rls_test.probe('ID-10 deactivated operator reads no submissions', 'select 1 from public.operational_submissions', false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000002');
select rls_test.probe_value('ID-16 multi-role operator selects an assigned secondary role',
  $q$select public.select_active_workforce_role('county_officer')::text$q$, 'county_officer');
select rls_test.probe_error('ID-17 operator cannot select an unassigned role',
  $q$select public.select_active_workforce_role('super_admin')$q$, 'current explicit role assignment required');
commit;

-- Administrator path (service_role only; actor authority re-verified in SQL)
begin;
set local role service_role;
select rls_test.probe_error('ID-11 ministry admin cannot demote a super admin',
  $q$select public.replace_workforce_role_assignments('a1000000-0000-4000-8000-000000000020', array['ministry_officer']::public.user_role[], 'ministry_officer', 'a1000000-0000-4000-8000-000000000022')$q$,
  'not permitted to administer');
select rls_test.probe_error('ID-12 ministry admin cannot grant super admin',
  $q$select public.replace_workforce_role_assignments('a1000000-0000-4000-8000-000000000005', array['super_admin']::public.user_role[], 'super_admin', 'a1000000-0000-4000-8000-000000000022')$q$,
  'requires super administrator');
select rls_test.probe('ID-13 super admin can re-scope a ministry admin',
  $q$select public.replace_workforce_role_assignments('a1000000-0000-4000-8000-000000000022', array['ministry_officer']::public.user_role[], 'ministry_officer', 'a1000000-0000-4000-8000-000000000020')$q$, true);
select rls_test.probe_error('ID-14 administrators cannot change their own roles',
  $q$select public.replace_workforce_role_assignments('a1000000-0000-4000-8000-000000000020', array['super_admin']::public.user_role[], 'super_admin', 'a1000000-0000-4000-8000-000000000020')$q$,
  'self role changes');
commit;
begin; select rls_test.login('a1000000-0000-4000-8000-000000000022');
select rls_test.probe('ID-15 role replacement is not callable by end users',
  $q$select public.replace_workforce_role_assignments('a1000000-0000-4000-8000-000000000001', array['dao_officer']::public.user_role[], 'dao_officer', 'a1000000-0000-4000-8000-000000000022')$q$, false);
commit;

-- ---------------------------------------------------------------------------
-- Farmer registry
-- ---------------------------------------------------------------------------
begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('FR-01 CLAN registers farmer in own county/district',
  $q$insert into public.farmers(full_name, county, district, registered_by) values ('New', 'Bong', 'Jorquelleh', auth.uid())$q$, true);
select rls_test.probe('FR-02 CLAN cannot register farmer in another county',
  $q$insert into public.farmers(full_name, county, district, registered_by) values ('New', 'Nimba', 'Sanniquellie-Mah', auth.uid())$q$, false);
select rls_test.probe('FR-03 CLAN cannot register farmer in another district',
  $q$insert into public.farmers(full_name, county, district, registered_by) values ('New', 'Bong', 'Suakoko', auth.uid())$q$, false);
select rls_test.probe('FR-04 CLAN cannot attribute registration to someone else',
  $q$insert into public.farmers(full_name, county, district, registered_by) values ('New', 'Bong', 'Jorquelleh', 'a1000000-0000-4000-8000-000000000002')$q$, false);
select rls_test.probe('FR-05 CLAN reads own-district farmer', $q$select 1 from public.farmers where id = 'f1000000-0000-4000-8000-000000000001'$q$, true);
select rls_test.probe('FR-06 CLAN cannot read another county farmer', $q$select 1 from public.farmers where county = 'Nimba'$q$, false);
select rls_test.probe('FR-07 CLAN cannot self-verify a farmer',
  $q$update public.farmers set verification_status = 'verified' where id = 'f1000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe('FR-08 CLAN cannot set subsidy eligibility at registration',
  $q$insert into public.farmers(full_name, county, district, registered_by, subsidy_eligible) values ('New', 'Bong', 'Jorquelleh', auth.uid(), true)$q$, false);
select rls_test.probe('FR-09 CLAN cannot rewrite farmer provenance',
  $q$update public.farmers set registered_by = null where id = 'f1000000-0000-4000-8000-000000000001'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000009');
select rls_test.probe('FR-10 legacy field agent cannot verify farmers (segregation of duties)',
  $q$update public.farmers set verification_status = 'verified', subsidy_eligible = true where id = 'f1000000-0000-4000-8000-000000000001'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000002');
select rls_test.probe('FR-11 DAO verifies in-district farmer',
  $q$update public.farmers set verification_status = 'verified' where id = 'f1000000-0000-4000-8000-000000000001'$q$, true);
select rls_test.probe('FR-12 DAO cannot verify another-district farmer',
  $q$update public.farmers set verification_status = 'verified' where id = 'f1000000-0000-4000-8000-000000000003'$q$, false);
select rls_test.probe('FR-13 DAO cannot move a farmer out of scope',
  $q$update public.farmers set county = 'Nimba' where id = 'f1000000-0000-4000-8000-000000000001'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000003');
select rls_test.probe('FR-14 Nimba DAO cannot read Bong farmers', $q$select 1 from public.farmers where county = 'Bong'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000004');
select rls_test.probe('FR-15 CAC reads all farmers in own county', $q$select 1 from public.farmers where id = 'f1000000-0000-4000-8000-000000000003'$q$, true);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000006');
select rls_test.probe('FR-16 donor cannot read farmer PII', 'select 1 from public.farmers', false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000007');
select rls_test.probe('FR-17 auditor reads farmers (oversight)', 'select 1 from public.farmers', true);
select rls_test.probe('FR-18 auditor cannot modify farmers',
  $q$update public.farmers set full_name = 'x' where id = 'f1000000-0000-4000-8000-000000000001'$q$, false);
commit;

-- ---------------------------------------------------------------------------
-- Farmer visits
-- ---------------------------------------------------------------------------
begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('FV-01 CLAN cannot delete another county visit',
  $q$delete from public.farmer_visits where id = 'f2000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe('FV-02 CLAN cannot read another county visit',
  $q$select 1 from public.farmer_visits where id = 'f2000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe('FV-03 CLAN records visit for in-scope farmer',
  $q$insert into public.farmer_visits(farmer_id, visited_by, notes) values ('f1000000-0000-4000-8000-000000000001', auth.uid(), 'ok')$q$, true);
select rls_test.probe('FV-04 CLAN cannot record visit for out-of-scope farmer',
  $q$insert into public.farmer_visits(farmer_id, visited_by, notes) values ('f1000000-0000-4000-8000-000000000002', auth.uid(), 'x')$q$, false);
commit;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('AU-01 audit rows cannot be attributed to another user',
  $q$insert into public.audit_log(user_id, action) values ('a1000000-0000-4000-8000-000000000005', 'FORGED')$q$, false);
select rls_test.probe('AU-02 audit rows attributed to self are accepted',
  $q$insert into public.audit_log(user_id, action) values (auth.uid(), 'OK')$q$, true);
select rls_test.probe('AU-03 audit rows are not deletable', 'delete from public.audit_log', false);
commit;

-- ---------------------------------------------------------------------------
-- Workflow engine
-- ---------------------------------------------------------------------------
begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('WF-01 author cannot set own submission to ministry_approved',
  $q$update public.operational_submissions set status = 'ministry_approved' where id = '51000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe('WF-02 author cannot forge ledger entries',
  $q$insert into public.workflow_actions(submission_id, actor_id, action, from_status, to_status, county) values ('51000000-0000-4000-8000-000000000001', auth.uid(), 'approve', 'cac_approved', 'ministry_approved', 'Bong')$q$, false);
select rls_test.probe('WF-03 author cannot insert pre-approved submissions',
  $q$insert into public.operational_submissions(submission_type, title, status, actor_id, county) values ('x', 'x', 'ministry_approved', auth.uid(), 'Bong')$q$, false);
select rls_test.probe('WF-04 CLAN cannot approve via RPC',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'approve')$q$, false);
select rls_test.probe('WF-05 CLAN cannot read another county submission',
  $q$select 1 from public.operational_submissions where id = '51000000-0000-4000-8000-000000000002'$q$, false);
select rls_test.probe_value('WF-06 CLAN create derives county from profile',
  $q$select (public.wf_create_submission('farmer_registration', 't', null, null, null, '{}'::jsonb)) #>> '{submission,county}'$q$, 'Bong');
select rls_test.probe('WF-07 CLAN cannot create a submission for another county',
  $q$select public.wf_create_submission('farmer_registration', 't', null, 'Nimba', null, '{}'::jsonb)$q$, false);
select rls_test.probe('WF-08 CLAN cannot spam notifications directly',
  $q$insert into public.workflow_notifications(recipient_id, created_by, kind, title) values ('a1000000-0000-4000-8000-000000000005', auth.uid(), 'x', 'x')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000002');
select rls_test.probe('WF-09 DAO cannot update status directly',
  $q$update public.operational_submissions set status = 'dao_approved' where id = '51000000-0000-4000-8000-000000000001'$q$, false);
select rls_test.probe_value('WF-10 DAO approves in-scope submission atomically',
  $q$select rls_test.transition_and_ledger('51000000-0000-4000-8000-000000000001', 'approve')$q$,
  'dao_approved/1');
select rls_test.probe('WF-11 DAO cannot skip to ministry approval',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'archive')$q$, false);
select rls_test.probe('WF-12 DAO cannot assign a non-reviewer',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'assign_reviewer', null, 'a1000000-0000-4000-8000-000000000006')$q$, false);
select rls_test.probe('WF-13 DAO cannot assign an out-of-county reviewer',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'assign_reviewer', null, 'a1000000-0000-4000-8000-000000000003')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000012');
select rls_test.probe('WF-14 DAO cannot decide another district submission',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'approve')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000003');
select rls_test.probe('WF-15 Nimba DAO cannot decide Bong submission',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'approve')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000006');
select rls_test.probe('WF-16 donor cannot read submissions (PII in metadata)', 'select 1 from public.operational_submissions', false);
select rls_test.probe('WF-17 donor cannot mutate workflow',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'comment', 'x')$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000007');
select rls_test.probe('WF-18 auditor reads submissions', 'select 1 from public.operational_submissions', true);
select rls_test.probe('WF-19 auditor cannot mutate workflow',
  $q$select public.wf_transition('51000000-0000-4000-8000-000000000001', 'comment', 'x')$q$, false);
commit;

-- ---------------------------------------------------------------------------
-- Transfers / field reports / pilot tables
-- ---------------------------------------------------------------------------
begin; select rls_test.login('a1000000-0000-4000-8000-000000000001');
select rls_test.probe('TR-01 CLAN cannot read transfer orders', 'select 1 from public.warehouse_transfer_orders', false);
select rls_test.probe('FRP-01 CLAN cannot read another county field report', $q$select 1 from public.field_reports where county = 'Nimba'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000008');
select rls_test.probe('TR-02 warehouse manager reads assigned-warehouse transfer', $q$select 1 from public.warehouse_transfer_orders where transfer_code = 'TRF-T-BONG'$q$, true);
select rls_test.probe('TR-03 warehouse manager cannot read unassigned transfer', $q$select 1 from public.warehouse_transfer_orders where transfer_code = 'TRF-T-NIMBA'$q$, false);
commit;

begin; select rls_test.login('a1000000-0000-4000-8000-000000000003');
select rls_test.probe('TR-04 Nimba DAO cannot update Bong transfer',
  $q$update public.warehouse_transfer_orders set status = 'approved' where transfer_code = 'TRF-T-BONG'$q$, false);
commit;

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------
select case when ok then 'PASS' else 'FAIL' end as result, label, detail
from rls_test.results order by seq;

select format('RLS behavior: %s of %s probes passed', count(*) filter (where ok), count(*)) as summary
from rls_test.results;

do $$
declare
  failures int;
  total int;
begin
  select count(*) filter (where not ok), count(*) into failures, total from rls_test.results;
  if failures > 0 then
    raise exception 'RLS behavior suite failed: % probe(s)', failures;
  end if;
end;
$$;
