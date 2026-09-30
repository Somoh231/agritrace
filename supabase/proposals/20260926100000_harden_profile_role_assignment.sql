-- =============================================================================
-- PROPOSAL — NOT APPLIED. Owner review required (docs/adr/0011-profile-role-assignment-hardening.md).
-- To apply after approval: move this file into supabase/migrations/ unchanged.
-- Rollback: supabase/proposals/20260926100000_harden_profile_role_assignment.rollback.sql
--
-- Closes three ways an account could choose its own authority:
--   A. handle_new_user() copied the role from user-supplied signup metadata.
--   B. profiles_self_update let any signed-in user UPDATE their own row,
--      including role and is_active, straight through the REST API.
--   C. profile_role()/profile_county()/profile_district() ignored is_active,
--      so a deactivated profile kept its role in row-level security.
-- Adds D: every role, activation or scope change is written to audit_log.
--
-- Existing profiles keep their current role and status. No policy is dropped.
-- =============================================================================
begin;

-- A. New accounts never choose their own role ---------------------------------
-- Every new profile starts inactive on the lowest field role. An administrator
-- assigns the real role and activates it through the admin console (service
-- role, audited). Signup metadata may still supply a display name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    'field_agent'::user_role,
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  -- On conflict the existing role and is_active are deliberately left alone.

  return new;
end;
$$;

-- B. Privileged profile fields change only through trusted workflows -----------
-- Requests made with a user's own session (JWT role 'authenticated' or 'anon')
-- cannot change role, activation, organisation, geography, email or id — on
-- their own row or anyone else's. The service role (admin console APIs) and
-- direct database operators are unaffected. Name and phone stay self-editable.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and (
       new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.deactivated_at is distinct from old.deactivated_at
    or new.organization_id is distinct from old.organization_id
    or new.county is distinct from old.county
    or new.district is distinct from old.district
    or new.email is distinct from old.email
  ) then
    raise exception 'Role, activation and scope changes require an administrator workflow'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- C. A deactivated profile holds no role, county or district in RLS -----------
create or replace function public.profile_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and coalesce(is_active, true);
$$;

create or replace function public.profile_county()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select county from public.profiles where id = auth.uid() and coalesce(is_active, true);
$$;

create or replace function public.profile_district()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select district from public.profiles where id = auth.uid() and coalesce(is_active, true);
$$;

-- D. Every privilege change is audited, whoever makes it ----------------------
create or replace function public.audit_profile_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.organization_id is distinct from old.organization_id
    or new.county is distinct from old.county
    or new.district is distinct from old.district
  then
    insert into public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    values (
      (select p.id from public.profiles p where p.id = auth.uid()),
      'PROFILE_PRIVILEGE_CHANGE',
      'profiles',
      new.id,
      jsonb_build_object(
        'role', old.role, 'is_active', old.is_active, 'organization_id', old.organization_id,
        'county', old.county, 'district', old.district
      ),
      jsonb_build_object(
        'role', new.role, 'is_active', new.is_active, 'organization_id', new.organization_id,
        'county', new.county, 'district', new.district,
        'actor_jwt_role', coalesce(auth.role(), 'database')
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_privileged_change on public.profiles;
create trigger profiles_audit_privileged_change
  after update on public.profiles
  for each row execute function public.audit_profile_privileged_change();

commit;
