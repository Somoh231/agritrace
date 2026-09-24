-- Asserts the P0 containment migration against the LIVE-equivalent schema
-- (migrations through 20260729215000 only). Disposable database only.
\set ON_ERROR_STOP 1

insert into auth.users(id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attacker@p0.invalid','{"role":"super_admin"}',now(),now()),
  ('b1000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','insider@p0.invalid','{}',now(),now()),
  ('b1000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','officer@p0.invalid','{}',now(),now());

do $$
begin
  if (select role::text || '/' || is_active::text from public.profiles where id = 'b1000000-0000-4000-8000-000000000001') <> 'field_agent/false' then
    raise exception 'FAIL P0-1: signup metadata still grants a role or activates the profile';
  end if;
  raise notice 'PASS P0-1 signup metadata cannot grant a role; new profiles start inactive';
end $$;

update public.profiles set is_active = true where id in ('b1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003');
update public.profiles set role = 'ministry_officer' where id = 'b1000000-0000-4000-8000-000000000003';

begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b1000000-0000-4000-8000-000000000002';
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$
begin
  begin
    update public.profiles set role = 'super_admin' where id = auth.uid();
    raise exception 'FAIL P0-2: self role escalation succeeded';
  exception when insufficient_privilege then
    raise notice 'PASS P0-2 self role escalation blocked';
  end;
end $$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b1000000-0000-4000-8000-000000000003';
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000003","role":"authenticated"}';
do $$
begin
  begin
    update public.profiles set role = 'super_admin' where id = 'b1000000-0000-4000-8000-000000000002';
    raise exception 'FAIL P0-3: non-super-admin granted super_admin';
  exception when insufficient_privilege then
    raise notice 'PASS P0-3 only a super administrator may grant administrator roles';
  end;
  update public.profiles set county = 'Bong' where id = 'b1000000-0000-4000-8000-000000000002';
  if not found then raise exception 'FAIL P0-4: legitimate admin edit of another profile blocked'; end if;
  raise notice 'PASS P0-4 legitimate admin edits of other profiles still work';
end $$;
commit;
