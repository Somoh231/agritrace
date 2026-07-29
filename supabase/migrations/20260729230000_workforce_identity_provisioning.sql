-- Administrator-provisioned workforce identities.
-- This migration is intentionally committed but must not be applied remotely
-- until an operator approves a disposable/staging target.

alter table public.profiles
  add column if not exists employee_or_staff_id text,
  add column if not exists job_title text,
  add column if not exists department text,
  add column if not exists clan_or_field_area text,
  add column if not exists account_status text not null default 'incomplete',
  add column if not exists invited_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists provisioned_by uuid references public.profiles(id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;
alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('incomplete', 'invited', 'active', 'inactive'));

update public.profiles
set
  account_status = case when coalesce(is_active, true) then 'active' else 'inactive' end,
  activated_at = case when coalesce(is_active, true) then coalesce(activated_at, created_at) else activated_at end,
  updated_at = coalesce(updated_at, created_at);

create unique index if not exists profiles_employee_or_staff_id_unique
  on public.profiles (lower(employee_or_staff_id))
  where employee_or_staff_id is not null;

create table if not exists public.profile_role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  is_primary boolean not null default false,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (profile_id, role)
);

create unique index if not exists profile_role_assignments_one_primary
  on public.profile_role_assignments (profile_id)
  where is_primary and removed_at is null;
create index if not exists profile_role_assignments_active
  on public.profile_role_assignments (profile_id, role)
  where removed_at is null;

insert into public.profile_role_assignments (profile_id, role, is_primary, assigned_by)
select p.id, p.role, true, p.id
from public.profiles p
on conflict (profile_id, role) do update
set is_primary = true, removed_at = null;

alter table public.profile_role_assignments enable row level security;

drop policy if exists profile_role_assignments_read on public.profile_role_assignments;
create policy profile_role_assignments_read
on public.profile_role_assignments for select to authenticated
using (
  profile_id = auth.uid()
  or public.is_ministry_wide()
  or public.profile_role() = 'auditor'
);

-- Profiles are administered through protected server routes. The former
-- self-update policy allowed a user to change their own role and status.
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_ministry_update on public.profiles;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_profile_updated_at();

-- Public signup must never synthesize operational access. The Auth identity is
-- linked to an incomplete, inactive profile until the protected provisioning
-- workflow supplies explicit assignments.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    account_status
  )
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    'field_agent'::public.user_role,
    false,
    'incomplete'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$;

create or replace function public.select_active_workforce_role(
  selected_role public.user_role,
  audit_request_id text default null
)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and p.account_status = 'active'
  ) then
    raise exception 'active workforce profile required';
  end if;

  if not exists (
    select 1
    from public.profile_role_assignments pra
    where pra.profile_id = auth.uid()
      and pra.role = selected_role
      and pra.removed_at is null
  ) then
    raise exception 'assigned role required';
  end if;

  update public.profile_role_assignments
  set is_primary = (role = selected_role)
  where profile_id = auth.uid() and removed_at is null;

  update public.profiles set role = selected_role where id = auth.uid();

  insert into public.audit_log (
    user_id, action, table_name, record_id, new_values
  ) values (
    auth.uid(),
    'ACTIVE_ROLE_SELECTED',
    'profiles',
    auth.uid(),
    jsonb_build_object('role', selected_role, 'request_id', audit_request_id)
  );

  return selected_role;
end;
$$;

revoke all on function public.select_active_workforce_role(public.user_role, text) from public;
revoke all on function public.select_active_workforce_role(public.user_role, text) from anon;
grant execute on function public.select_active_workforce_role(public.user_role, text) to authenticated;

create or replace function public.replace_workforce_role_assignments(
  target_profile_id uuid,
  assigned_roles public.user_role[],
  selected_primary_role public.user_role,
  actor_profile_id uuid,
  audit_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
  previous_role public.user_role;
  next_role public.user_role;
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = actor_profile_id
    and p.is_active
    and p.account_status = 'active';

  if actor_role not in ('super_admin', 'admin', 'ministry_admin') then
    raise exception 'user provisioning permission required';
  end if;
  if target_profile_id = actor_profile_id then
    raise exception 'self role changes are not permitted';
  end if;
  if cardinality(assigned_roles) < 1 or not (selected_primary_role = any(assigned_roles)) then
    raise exception 'an explicit primary role is required';
  end if;
  if (
    ('super_admin'::public.user_role = any(assigned_roles)
      or 'admin'::public.user_role = any(assigned_roles))
    and actor_role <> 'super_admin'
  ) then
    raise exception 'system administrator assignment requires super administrator';
  end if;
  if (
    'ministry_admin'::public.user_role = any(assigned_roles)
    and actor_role not in ('super_admin', 'admin')
  ) then
    raise exception 'ministry administrator assignment requires system administrator';
  end if;

  for previous_role in
    select pra.role
    from public.profile_role_assignments pra
    where pra.profile_id = target_profile_id
      and pra.removed_at is null
      and not (pra.role = any(assigned_roles))
  loop
    insert into public.audit_log (user_id, action, table_name, record_id, new_values)
    values (
      actor_profile_id,
      'ROLE_REMOVED',
      'profiles',
      target_profile_id,
      jsonb_build_object('role', previous_role, 'request_id', audit_request_id)
    );
  end loop;

  for next_role in
    select unnest(assigned_roles)
    except
    select pra.role
    from public.profile_role_assignments pra
    where pra.profile_id = target_profile_id and pra.removed_at is null
  loop
    insert into public.audit_log (user_id, action, table_name, record_id, new_values)
    values (
      actor_profile_id,
      'ROLE_ASSIGNED',
      'profiles',
      target_profile_id,
      jsonb_build_object(
        'role',
        next_role,
        'primary',
        next_role = selected_primary_role,
        'request_id',
        audit_request_id
      )
    );
  end loop;

  update public.profile_role_assignments
  set is_primary = false
  where profile_id = target_profile_id and removed_at is null;

  update public.profile_role_assignments
  set removed_at = now()
  where profile_id = target_profile_id
    and removed_at is null
    and not (role = any(assigned_roles));

  insert into public.profile_role_assignments (
    profile_id, role, is_primary, assigned_by, assigned_at, removed_at
  )
  select target_profile_id, role_value, false, actor_profile_id, now(), null
  from unnest(assigned_roles) as role_value
  on conflict (profile_id, role) do update
  set assigned_by = excluded.assigned_by,
      assigned_at = excluded.assigned_at,
      removed_at = null,
      is_primary = false;

  update public.profile_role_assignments
  set is_primary = true
  where profile_id = target_profile_id
    and role = selected_primary_role
    and removed_at is null;

  update public.profiles
  set role = selected_primary_role
  where id = target_profile_id;
end;
$$;

revoke all on function public.replace_workforce_role_assignments(
  uuid, public.user_role[], public.user_role, uuid, text
) from public;
revoke all on function public.replace_workforce_role_assignments(
  uuid, public.user_role[], public.user_role, uuid, text
) from anon;
revoke all on function public.replace_workforce_role_assignments(
  uuid, public.user_role[], public.user_role, uuid, text
) from authenticated;
grant execute on function public.replace_workforce_role_assignments(
  uuid, public.user_role[], public.user_role, uuid, text
) to service_role;

-- Rollback notes:
-- 1. Restore the prior handle_new_user function only if the replacement access
--    model is also reverted; never restore active default-role access.
-- 2. Drop select_active_workforce_role, profile_role_assignments, the added
--    profile columns/indexes, and the updated-at trigger only after removing all
--    application references and exporting role history.
