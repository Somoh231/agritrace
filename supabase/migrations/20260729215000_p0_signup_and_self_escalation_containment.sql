-- P0 CONTAINMENT (Opus 5.5 audit, finding OPS-SEC-01). Small, standalone, and
-- safe to apply BEFORE the larger workforce identity migration.
--
-- Live state (verified 2026-09-23): public email signup is enabled, and
--   * handle_new_user() copies raw_user_meta_data->>'role' into profiles.role
--     (any signup can request super_admin) and marks the profile active;
--   * profiles_self_update has no WITH CHECK or column restriction, so any
--     signed-in user can set their own role to super_admin via PostgREST.
--
-- This migration:
--   1. makes signups ignore client-supplied roles and start INACTIVE;
--   2. blocks self-changes to authority fields and reserves granting
--      system-administrator roles to an active super_admin.
-- Existing admin flows that edit OTHER users keep working.
--
-- Compatible with 20260729230000_workforce_identity_provisioning.sql, which later
-- replaces handle_new_user and revokes direct profile updates entirely.
-- Operators must ALSO disable public sign-ups in Supabase Auth settings.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    'field_agent'::public.user_role,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- INVOKER rights on purpose: current_user must be the PostgREST role
-- (anon/authenticated). Under SECURITY DEFINER it would be the owner and the
-- guard would never fire. The caller's own row is readable via profiles_self_select.
create or replace function public.p0_guard_profile_authority()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  caller_role public.user_role;
  caller_active boolean;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.deactivated_at is distinct from old.deactivated_at
     or new.organization_id is distinct from old.organization_id
     or new.county is distinct from old.county
     or new.district is distinct from old.district
  then
    if old.id = auth.uid() then
      raise exception using errcode = '42501',
        message = 'operators cannot change their own role, activation, organization or geography';
    end if;

    select p.role, p.is_active into caller_role, caller_active
    from public.profiles p
    where p.id = auth.uid();

    if new.role in ('super_admin', 'admin', 'ministry_admin')
       and new.role is distinct from old.role
       and not (caller_role = 'super_admin' and caller_active is true)
    then
      raise exception using errcode = '42501',
        message = 'only an active super administrator may grant administrator roles';
    end if;
  end if;
  return new;
end;
$$;


drop trigger if exists profiles_p0_guard_authority on public.profiles;
create trigger profiles_p0_guard_authority
before update on public.profiles
for each row execute function public.p0_guard_profile_authority();

commit;
