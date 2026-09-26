-- Rollback for 20260926100000_harden_profile_role_assignment.sql.
-- Restores the functions exactly as defined by 20260207101000 / 20260513120000
-- and removes the two triggers. Profiles created while the hardening was live
-- keep the role/is_active an administrator gave them; nothing is re-derived.
begin;

drop trigger if exists profiles_audit_privileged_change on public.profiles;
drop function if exists public.audit_profile_privileged_change();
drop trigger if exists profiles_guard_privileged_columns on public.profiles;
drop function if exists public.guard_profile_privileged_columns();

create or replace function public.profile_role()
returns user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.profile_county()
returns text language sql stable security definer set search_path = public
as $$ select county from public.profiles where id = auth.uid(); $$;

create or replace function public.profile_district()
returns text language sql stable security definer set search_path = public
as $$ select district from public.profiles where id = auth.uid(); $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r user_role;
begin
  r := case lower(trim(coalesce(new.raw_user_meta_data->>'role', '')))
    when 'super_admin' then 'super_admin'::user_role
    when 'admin' then 'admin'::user_role
    when 'ministry_admin' then 'ministry_admin'::user_role
    when 'ministry_officer' then 'ministry_officer'::user_role
    when 'government_officer' then 'government_officer'::user_role
    when 'county_agriculture_coordinator' then 'county_agriculture_coordinator'::user_role
    when 'county_officer' then 'county_officer'::user_role
    when 'dao_officer' then 'dao_officer'::user_role
    when 'district_officer' then 'district_officer'::user_role
    when 'clan_technician' then 'clan_technician'::user_role
    when 'cooperative_manager' then 'cooperative_manager'::user_role
    when 'field_agent' then 'field_agent'::user_role
    when 'warehouse_manager' then 'warehouse_manager'::user_role
    when 'donor_observer' then 'donor_observer'::user_role
    when 'donor_partner' then 'donor_partner'::user_role
    when 'exporter' then 'exporter'::user_role
    when 'call_center_agent' then 'call_center_agent'::user_role
    when 'auditor' then 'auditor'::user_role
    else 'field_agent'::user_role
  end;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    r,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);

  return new;
end;
$$;

commit;
